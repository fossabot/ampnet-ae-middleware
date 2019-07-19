const { TxBuilder: TxBuilder } = require('@aeternity/aepp-sdk')

const client = require('../ae/client')
const repo = require('../persistence/repository')
const enums = require('../enums/enums')
const contracts = require('../ae/contracts')
const config = require('../env.json')[process.env.NODE_ENV || 'development']
const codec = require('../ae/codec')

const TX_STATE = enums.txState
const TX_TYPE = enums.txType

async function postTransaction(call, callback) {
    console.log(`\nReceived request to post ${enums.fromGrpcType(call.request.txType)} transaction: ${call.request.data}`)
    try {
        let tx = call.request.data
        let type = call.request.txType
        
        await performSecurityChecks(tx, type)


        let txUnpacked = TxBuilder.unpackTx(tx).tx.encodedTx.tx
        let callingContractSource = await contracts.getContractSourceFromAddress(txUnpacked.contractId)
        let expectedFunctionName = enums.functionNameFromGrpcType(type)
        let txType = enums.fromGrpcType(type)
        let callData = await codec.decodeData(callingContractSource, expectedFunctionName, txUnpacked.callData) 
        await checkTxCaller(txUnpacked)
        await checkTxType(expectedFunctionName, callData.function)
        let result = await client.instance().sendTransaction(tx, { waitMined: false })
        await persistTransaction(txUnpacked, result.hash, callData, txType)
        updateTransactionState(result.hash)
        console.log(`Transaction successfully broadcasted! Tx hash: ${result.hash}`)
        callback(null, { txHash: result.hash })
    } catch(err) {
        console.log(`Error while posting transaction: ${err}`)
        callback(err, null)
    }
}

async function performSecurityChecks(tx, grpcType) {
    let unpackedTx = TxBuilder.unpackTx(tx)
    let type = enums.fromGrpcType(grpcType)

    switch (unpackedTx.txType) {
        case 'contractCallTx':
            checkTxCaller(unpackedTx.callerId)
            
            break
        case 'contractCreateTx':
            checkTxCaller(unpackedTx.ownerId)
            checkContractData(unpackedTx, type)
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

async function checkContractData(unpackedTx, type) {
    switch(type) {
        case TX_TYPE.ORG_CREATE:
            if (unpackedTx.code != contracts.getOrgCompiled().bytecode) {
                throw new Error(`Error posting Organization create transaction. Unexpected bytecode provided. Aborting.`)
            }
            let decodedCallData = codec.decodeData(contracts.orgSource, "init", unpackedTx.callData)
            if (decodedCallData.arguments[0].value != contracts.getCoopAddress()) {
                throw new Error(`Error posting Organization create transaction. Attempt to create Organization with wrong Cooperative contract address as argument!`)
            }
            break
        case TX_TYPE.PROJ_CREATE:
            if (unpackedTx.code != contracts.getProjCompiled().bytecode) {
                throw new Error(`Error posting Project create transaction. Unexpected bytecode provided. Aborting.`)
            }
            let decodedCallData = codec.decodeData(contracts.orgSource, "init", unpackedTx.callData)
            let organizationAddress = decodedCallData.arguments[0].value
            let isOrganizationActive = await client.contractCallStatic(
                contracts.coopSource, 
                contracts.getCoopAddress(), 
                enums.functions.coop.isWalletActive,
                [ organizationAddress ]
            )
            let isOrganizationActiveDecoded = await isOrganizationActive.decode()
            if (!isOrganizationActiveDecoded) {
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

async function checkTxType(expectedFunctionName, actualFunctionName) {
    if (expectedFunctionName != actualFunctionName) {
        throw new Error("Signed transaction does not match provided tx type.")
    }
}

async function persistTransaction(tx, hash, calldata, type) {
    let record
    switch (type) {
        case TX_TYPE.WALLET_CREATE:
            let address = calldata.arguments[0].value
            record = {
                hash: hash,
                from_wallet: tx.callerId,
                to_wallet: address,
                input: tx.callData,
                state: TX_STATE.PENDING,
                type: TX_TYPE.WALLET_CREATE,
                wallet: address,
                created_at: new Date()
            }
        case TX_TYPE.ORG_CREATE:
            break
        case TX_TYPE.DEPOSIT:
            break
        case TX_TYPE.APPROVE:
            break
        case TX_TYPE.PENDGING_ORG_WITHDRAW:
            break
        case TX_TYPE.PENDING_PROJ_WITHDRAW:
            break
        case TX_TYPE.WITHDRAW:
            break
        case TX_TYPE.INVEST:
            break
        case TX_TYPE.TRANSFER:
            break
        case TX_TYPE.ORG_ADD_MEMBER:
            break
        case TX_TYPE.PROJ_CREATE:
            break
        case TX_TYPE.ORG_ACTIVATE:
            break
        case TX_TYPE.START_REVENUE_PAYOUT:
            break
        case TX_TYPE.REVENUE_PAYOUT:
            break
        case TX_TYPE.SHARE_PAYOUT:
            break
        case TX_TYPE.WITHDRAW_INVESTMENT:
            break
    }
    await repo.saveTransaction(record)
}

async function updateTransactionState(hash) {
    client.instance().poll(hash).then(_ => {
        client.instance().getTxInfo(hash).then(info => {
            repo.updateTransactionState(hash, info.returnType)
        }).catch(console.log)
    }).catch(console.log)
}



module.exports = { postTransaction }