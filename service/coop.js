const client = require('../ae/client')
const compiler = require('../ae/compiler')
const { AEProtocol } = require('airgap-coin-lib')
let config = require('../env.json')[process.env.NODE_ENV || 'development']

module.exports = {
    addWallet: async function(call, callback) {
        let callData = await compiler.coop.encodeAddWallet(call.request.wallet)
        console.log("callerId", call.request.from)
        console.log("contractId", config.contracts.coop)
        console.log("callData", callData)
        
        let tx = await client.instance().contractCallTx({
            callerId : call.request.from,
            contractId : config.contracts.coop,
            abiVersion : 1,
            amount : 0,
            gas : 10000,
            callData : callData
        }).catch(function(error) {
            console.log(error)
        })
        callback(null, { tx: tx })
    }
}