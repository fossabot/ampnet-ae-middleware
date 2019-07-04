const client = require('../ae/client')
const compiler = require('../ae/compiler')
const contracts = require('../ae/contracts')
const { AEProtocol } = require('airgap-coin-lib')
let config = require('../env.json')[process.env.NODE_ENV || 'development']

module.exports = {
    addWallet: async function(call, callback) {
        let callData = await compiler.coop.encodeAddWallet(call.request.wallet)
        let coopAddress = contracts.getCoopAddress()    
        let tx = await client.instance().contractCallTx({
            callerId : call.request.from,
            contractId : coopAddress,
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