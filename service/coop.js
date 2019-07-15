let client = require('../ae/client')
let compiler = require('../ae/compiler')
let contracts = require('../ae/contracts')

async function addWallet(call, callback) {
    console.log(`Received request to generate addWallet transaction. Caller: ${call.request.from} Wallet: ${call.request.wallet}`)
    try {
        let callData = await compiler.coop.encodeAddWallet(call.request.wallet)
        let coopAddress = contracts.getCoopAddress()    
        let tx = await client.instance().contractCallTx({
            callerId : call.request.from,
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
        callback(err, null)
    }
}

module.exports = { addWallet }