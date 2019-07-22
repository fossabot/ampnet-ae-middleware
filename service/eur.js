let client = require('../ae/client')
let codec = require('../ae/codec')
let contracts = require('../ae/contracts')
let functions = require('../enums/enums').functions
let repo = require('../persistence/repository')
let util = require('../ae/util')

let config = require('../env.json')[process.env.NODE_ENV || 'development']

async function mint(call, callback) {
    console.log(`\nReceived request to generate minting of ${call.request.amount} tokens to wallet with txHash ${call.request.toTxHash}`)
    try {
        let record = await repo.getWalletOrThrow(call.request.toTxHash)
        console.log(`Address represented by given hash: ${record.wallet}`)
        let callData = await codec.eur.encodeMint(record.wallet, util.eurToToken(call.request.amount))
        let tx = await client.instance().contractCallTx({
            callerId: config.contracts.eur.owner,
            contractId: contracts.getEurAddress(),
            abiVersion: 1,
            amount: 0,
            gas: 10000,
            callData: callData
        })
        console.log(`Successfully generated addWallet transaction: ${tx}`)
        callback(null, { tx: tx })
    } catch (error) {
        console.log(`Error while generating mint transaction: ${error}`)
        callback(error, null)
    }
}

async function approve(call, callback) {
    
}

async function burn(call, callback) {

}

module.exports = { mint, approve, burn }