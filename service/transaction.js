const { TxBuilder: Builder } = require('@aeternity/aepp-sdk')

const client = require('../ae/client')
const repo = require('../persistence/repository')
const config = require('../env.json')[process.env.NODE_ENV || 'development']

async function checkTxCaller(tx) {
    let callerId = tx.callerId
    console.log("config", config)
    let coopAuthorityId = config.contracts.coop.owner
    let issuingAuthorityId = config.contracts.eur.owner
    
    // if caller is coop or token authority return normally
    // if(callerId == coopAuthorityId || callerId == issuingAuthorityId) {
    //     return
    // }

    // if caller not found in repo exception is thrown
    return repo.findByWallet(callerId)
}

function checkTxType(tx, type) {
    console.log("checkTxType() - tx", tx)
    console.log("checkTxType() - type", type)
}

function persistTransaction(tx) {
    console.log("persistTransaction() - tx", tx)
}

module.exports = {
    postTx: async function(call, callback) {
        let tx = call.request.data
        let type = call.request.txType
        let txUnpacked = Builder.unpackTx(tx).tx.encodedTx.tx
        try {
            await checkTxCaller(txUnpacked)
            checkTxType(txUnpacked, type)
            let result = await client.instance().sendTransaction(tx)
            persistTransaction(result)
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