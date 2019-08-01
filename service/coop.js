let client = require('../ae/client')
let codec = require('../ae/codec')
let contracts = require('../ae/contracts')
let functions = require('../enums/enums').functions
let repo = require('../persistence/repository')
let util = require('../ae/util')
let err = require('../enums/errors')
let ErrorType = err.type

let config = require('../env.json')[process.env.NODE_ENV || 'development']

async function addWallet(call, callback) {
    console.log(`\nReceived request to generate addWallet transaction.\nWallet: ${call.request.wallet}`)
    try {
        if (call.request.wallet.startsWith("th")) {
            let txInfo = await client.instance().getTxInfo(call.request.wallet)
            address = util.enforceAkPrefix(txInfo.contractId)
        } else {
            address = call.request.wallet
        }
        let callData = await codec.coop.encodeAddWallet(address)
        let coopAddress = contracts.getCoopAddress()
        let tx = await client.instance().contractCallTx({
            callerId : config.contracts.coop.owner,
            contractId : coopAddress,
            abiVersion : 1,
            amount : 0,
            gas : 10000,
            callData : callData
        })
        console.log(`Successfully generated addWallet transaction: ${tx}`)
        callback(null, { tx: tx })
    } catch (error) {
        console.log(`Error generating addWallet transaction: ${error}`)
        if (typeof error.response !== 'undefined') {
            callback(err.generate(ErrorType.AEPP_SDK_ERROR, error.response.data.reason), null)
        } else if (typeof error.message !== 'undefined' && typeof error.code !== 'undefined') {
            calllback(error, null)
        } else {
            callback(err.generate(ErrorType.GENERIC_ERROR), null)
        }
    }
}

async function walletActive(call, callback) {
    console.log(`\nReceived request to check is wallet with txHash ${call.request.walletTxHash} active.`)
    try {
        let tx = await repo.getWalletOrThrow(call.request.walletTxHash)
        console.log(`Address represented by given hash: ${tx.wallet}\n`)
        let result = await client.instance().contractCallStatic(
            contracts.coopSource, 
            contracts.getCoopAddress(),
            functions.coop.isWalletActive, 
            [ tx.wallet ]
        )
        let resultDecoded = await result.decode()
        console.log(`Wallet active: ${resultDecoded}`)
        callback(null, { active: resultDecoded })
    } catch (error) {
        console.log(`Error fetching wallet active status: ${error}`)
        if (typeof error.response !== 'undefined') {
            callback(err.generate(ErrorType.AEPP_SDK_ERROR, error.response.data.reason), null)
        } else if (typeof error.message !== 'undefined' && typeof error.code !== 'undefined') {
            callback(error, null)
        } else {
            callback(err.generate(ErrorType.GENERIC_ERROR), null)
        }
    }
}

module.exports = { 
    addWallet,
    walletActive
}