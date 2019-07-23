let client = require('../ae/client')
let codec = require('../ae/codec')
let contracts = require('../ae/contracts')
let functions = require('../enums/enums').functions
let repo = require('../persistence/repository')

let config = require('../env.json')[process.env.NODE_ENV || 'development']

async function addWallet(call, callback) {
    console.log(`\nReceived request to generate addWallet transaction.\nWallet: ${call.request.wallet}`)
    try {
        let callData = await codec.coop.encodeAddWallet(call.request.wallet)
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
        callback(error, null)
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
        callback(error, null)
    }
}

module.exports = { 
    addWallet,
    walletActive
}