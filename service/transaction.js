const { TxBuilder: TxBuilder } = require('@aeternity/aepp-sdk')
const client = require('../ae/client')
const repo = require('../persistence/repository')
const enums = require('../enums/enums')
const TX_STATE = enums.txState
const TX_TYPE = enums.txType
const contracts = require('../ae/contracts')
const config = require('../env.json')[process.env.NODE_ENV || 'development']
const compiler = require('../ae/compiler')

async function checkTxCaller(tx) {
    let callerId = tx.callerId
    console.log("config", config)
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
    console.log("persist tx")
    console.log("type", type)
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

module.exports = {
    postTx: async function(call, callback) {
        let tx = call.request.data
        let type = call.request.txType
        let txUnpacked = TxBuilder.unpackTx(tx).tx.encodedTx.tx
        console.log("txUnpacked", txUnpacked)
        console.log("grpc type", type)
        try {
            let callingContractSource = await contracts.getContractSourceFromAddress(txUnpacked.contractId)
            let expectedFunctionName = enums.functionNameFromGrpcType(type)
            let txType = enums.fromGrpcType(type)
            console.log('expected function name', expectedFunctionName)
            let callData = await compiler.decodeCalldata(callingContractSource, expectedFunctionName, txUnpacked.callData) 
            console.log('calldata', callData)
            await checkTxCaller(txUnpacked)
            await checkTxType(expectedFunctionName, callData.function)
            let result = await client.instance().sendTransaction(tx, { waitMined: false })
            await persistTransaction(txUnpacked, result.hash, callData, txType)
            callback(null, { txHash: result.hash })
        } catch(err) {
            console.log("err", err)
            callback(err, null)
        }
    },
    postVaultTx: function(call, callback) {
        console.log(call.request)
    }
}