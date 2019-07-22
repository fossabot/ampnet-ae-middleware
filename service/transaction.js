const { TxBuilder: TxBuilder } = require('@aeternity/aepp-sdk')

const client = require('../ae/client')
const repo = require('../persistence/repository')
const enums = require('../enums/enums')
const contracts = require('../ae/contracts')
const config = require('../env.json')[process.env.NODE_ENV || 'development']
const codec = require('../ae/codec')
const util = require('../ae/util')

const TxState = enums.txState
const TxType = enums.txType

async function postTransaction(call, callback) {
    console.log(`\nReceived request to post transaction: ${call.request.data}`)
    try {
        let tx = call.request.data
        let txUnpacked = TxBuilder.unpackTx(tx).tx.encodedTx
        let txInfo = await getTransactionType(txUnpacked)

        await performSecurityChecks(txUnpacked, txInfo)
        let result = await client.instance().sendTransaction(tx, { waitMined: false })
        await persistTransaction(txUnpacked.tx, result.hash, txInfo)

        updateTransactionState(result.hash)

        console.log(`Transaction successfully broadcasted! Tx hash: ${result.hash}`)
        callback(null, { txHash: result.hash })
    } catch(err) {
        console.log("err", err)
        console.log(`Error while posting transaction: ${err}`)
        callback(err, null)
    }
}

async function performSecurityChecks(unpackedTx, txInfo) {
    switch (unpackedTx.txType) {
        case 'contractCallTx':
            await checkTxCaller(unpackedTx.tx.callerId)
            await checkTxCallee(unpackedTx.tx.contractId)
            break
        case 'contractCreateTx':
            await checkTxCaller(unpackedTx.tx.ownerId)
            await checkContractData(unpackedTx.tx, txInfo)
            break
        default:
            throw new Error(`Error posting transaction. Expected transaction of type contractCall or contractCreate but got ${unpackedTx.txType}. Aborting.`)
    }
}

async function checkTxCaller(callerId) {
    let coopAuthorityId = config.contracts.coop.owner
    let issuingAuthorityId = config.contracts.eur.owner
    
    // if caller is coop or token authority return normally
    if(callerId == coopAuthorityId || callerId == issuingAuthorityId) {
        return
    }

    // if caller not found in repo or caller's wallet still not mined exception is thrown
    return repo.findByWallet(callerId)
}

async function checkTxCallee(calleeId) {
    if (calleeId == contracts.getCoopAddress() || calleeId == contracts.getEurAddress()) { return }
    
    let walletActive = await isWalletActive(calleeId)
    if (walletActive) { return }

    throw new Error("Error posting transaction. Target contract not part of AMPnet platform!")
}

async function checkContractData(unpackedTx, txInfo) {
    switch(txInfo.type) {
        case TxType.ORG_CREATE:
            if (unpackedTx.code != contracts.getOrgCompiled().bytecode) {
                throw new Error(`Error posting Organization create transaction. Unexpected bytecode provided. Aborting.`)
            }
            if (txInfo.callData.arguments[0].value != contracts.getCoopAddress()) {
                throw new Error(`Error posting Organization create transaction. Attempt to create Organization with wrong Cooperative contract address as argument!`)
            }
            break
        case TxType.PROJ_CREATE:
            if (unpackedTx.code != contracts.getProjCompiled().bytecode) {
                throw new Error(`Error posting Project create transaction. Unexpected bytecode provided. Aborting.`)
            }
            let organizationAddress = txInfo.callData.arguments[0].value
            let isOrganizationActive = await isWalletActive(organizationAddress)
            if (!isOrganizationActive) {
                throw new Error(`Error posting Project create transaction. Attempt to create Project with wrong Organization contract address as argument!`)
            }
            break
        default:
            throw new Error(`Error posting transaction. Expected contract create transaction but got transaction of type ${type}. Aborting.`)
    }
    if (unpackedTx.amount != 0) {
        throw new Error(`Error posting Contract create transaction. Amount field has to be set to 0 but ${unpackedTx.acmount} provided!`)
    }
    if (unpackedTx.deposit != 0) {
        throw new Error(`Error posting Contract create transaction. Deposit field has to be set to 0 but ${unpackedTx.deposit} provided!`)
    }
}

async function getTransactionType(unpackedTx) {
    let callData
    let type
    switch(unpackedTx.txType) {
        case 'contractCallTx':
            contract = await contracts.getContractFromAddress(unpackedTx.tx.contractId)
            fn = (await codec.decodeDataByBytecode(contract.bytecode, unpackedTx.tx.callData)).function
            callData = await codec.decodeDataBySource(contract.source, fn, unpackedTx.tx.callData)
            type = enums.fromFunctionName(fn)
            break
        case 'contractCreateTx':
            switch (unpackedTx.tx.code) {
                case contracts.getOrgCompiled().bytecode:
                    callData = await codec.decodeDataBySource(contracts.orgSource, "init", unpackedTx.tx.callData)
                    type = TxType.ORG_CREATE
                    break
                case contracts.getProjCompiled().bytecode:
                    callData = await codec.decodeDataBySource(contracts.projSource, "init", unpackedTx.tx.callData)
                    type = TxType.PROJ_CREATE
                    break
                default:
                    throw new Error("Unknown transaction type. Aborting.")
            }
            break
        default: throw new Error("Unknown transaction type. Aborting.")
    }
    return {
        type: type,
        callData: callData
    }
}

async function persistTransaction(tx, hash, txInfo) {
    let record
    switch (txInfo.type) {
        case TxType.WALLET_CREATE:
            let address = txInfo.callData.arguments[0].value
            record = {
                hash: hash,
                from_wallet: tx.callerId,
                to_wallet: address,
                input: tx.callData,
                state: TxState.PENDING,
                type: TxType.WALLET_CREATE,
                wallet: address,
                created_at: new Date()
            }
            break
        case TxType.ORG_CREATE:
            let ownerTxHash = (await repo.findByWallet(tx.ownerId)).hash
            record = {
                hash: hash,
                from_wallet: ownerTxHash,
                to_wallet: hash,
                input: tx.callData,
                state: TxState.PENDING,
                type: TxType.ORG_CREATE,
                created_at: new Date()
            }
            break
        case TxType.DEPOSIT:
            let toAddress = txInfo.callData.arguments[0].value
            let amount = txInfo.callData.arguments[1].value
            let toTxHash = (await repo.findByWallet(toAddress)).hash
            record = {
                hash: hash,
                from_wallet: tx.callerId,
                to_wallet: toTxHash,
                input: tx.callData,
                state: TxState.PENDING,
                type: TxType.DEPOSIT,
                created_at: new Date(),
                amount: (util.tokenToEur(amount))
            }
            break
        case TxType.APPROVE:
            break
        case TxType.PENDGING_ORG_WITHDRAW:
            break
        case TxType.PENDING_PROJ_WITHDRAW:
            break
        case TxType.WITHDRAW:
            break
        case TxType.INVEST:
            break
        case TxType.TRANSFER:
            break
        case TxType.ORG_ADD_MEMBER:
            break
        case TxType.PROJ_CREATE:
            break
        case TxType.ORG_ACTIVATE:
            break
        case TxType.START_REVENUE_PAYOUT:
            break
        case TxType.REVENUE_PAYOUT:
            break
        case TxType.SHARE_PAYOUT:
            break
        case TxType.WITHDRAW_INVESTMENT:
            break
    }
    await repo.saveTransaction(record)
}

async function isWalletActive(wallet) {
    let address = await util.enforceAkPrefix(wallet)
    let result = await client.contractCallStatic(
        contracts.coopSource, 
        contracts.getCoopAddress(), 
        enums.functions.coop.isWalletActive,
        [ address ]
    )
    return result.decode()
}

async function updateTransactionState(hash) {
    client.instance().poll(hash).then(pollInfo => {
        client.instance().getTxInfo(hash).then(info => {
            repo.updateTransactionState(hash, info, pollInfo.tx.type)
        }).catch(console.log)
    }).catch(console.log)
}

module.exports = { postTransaction }