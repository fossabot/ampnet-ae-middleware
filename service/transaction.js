const client = require('../ae/client')
const { TxBuilder: Builder } = require('@aeternity/aepp-sdk')

// knex
const environment = process.env.ENVIRONMENT || 'development'
const config = require('../knexfile.js')[environment];
const knex = require('knex')(config)

module.exports = {
    postTx: function(call, callback) {
        let tx = call.request.data
        client.instance().sendTransaction(tx)
            .then(function(result) {
                console.log(result)
            })
            .catch(function(error) {
                console.log("error", error)
                console.log("validation", error.errorData.validation)
            })
    },
    postVaultTx: function(call, callback) {
        console.log(call.request)
    }
}