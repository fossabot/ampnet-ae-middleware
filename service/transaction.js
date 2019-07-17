const { TxBuilder: TxBuilder } = require('@aeternity/aepp-sdk')

const client = require('../ae/client')
const repo = require('../persistence/repository')
const enums = require('../enums/enums')
const contracts = require('../ae/contracts')
const config = require('../env.json')[process.env.NODE_ENV || 'development']
const codec = require('../ae/codec')

const TX_STATE = enums.txState
const TX_TYPE = enums.txType

async function checkTxCaller(tx) {
    let callerId = tx.callerId

    let coopAuthorityId = config.contracts.coop.owner
    let issuingAuthorityId = config.contracts.eur.owner
    
    // if caller is coop or token authority return normally
    if(callerId == coopAuthorityId || callerId == issuingAuthorityId) {
        return
    }

    // if caller not found in repo exception is thrown
    return repo.findByWallet(callerId)
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
        case TX_TYPE.ORG_ADD_PROJECT:
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

module.exports = {
    postTx: async function(call, callback) {
        let tx = call.request.data
        let type = call.request.txType
        let txUnpacked = TxBuilder.unpackTx(tx).tx.encodedTx.tx
        try {
            let callingContractSource = await contracts.getContractSourceFromAddress(txUnpacked.contractId)
            let expectedFunctionName = enums.functionNameFromGrpcType(type)
            let txType = enums.fromGrpcType(type)
            let callData = await codec.decodeData(callingContractSource, expectedFunctionName, txUnpacked.callData) 
            await checkTxCaller(txUnpacked)
            await checkTxType(expectedFunctionName, callData.function)
            let result = await client.instance().sendTransaction(tx, { waitMined: false })
            await persistTransaction(txUnpacked, result.hash, callData, txType)
            updateTransactionState(result.hash)
            callback(null, { txHash: result.hash })
        } catch(err) {
            callback(err, null)
        }
    }
}