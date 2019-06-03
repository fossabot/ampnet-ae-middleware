const client = require('../ae/client')
const { TxBuilder: Builder } = require('@aeternity/aepp-sdk')

module.exports = {
    postTx: function(call, callback) {
        let callData = client.encode
        console.log(client.instance())
        console.log(call.request)
        let test = Builder.unpackTx(call.request.data)
        console.log(test.tx.encodedTx.tx)
    },
    postVaultTx: function(call, callback) {
        console.log(call.request)
    }
}