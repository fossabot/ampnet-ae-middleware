const client = require('../ae/client')
const compiler = require('../ae/compiler')
const { TxBuilder: Builder } = require('@aeternity/aepp-sdk')

module.exports = {
    addWallet: function(call, callback) {
        compiler.coop.encodeAddWallet(call.request.wallet).then((data) => {
            console.log(data)
        })
    }
}