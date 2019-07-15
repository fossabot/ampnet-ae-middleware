let axios = require('axios')

let contracts = require('./contracts')
let config = require('../env.json')[process.env.NODE_ENV || 'development']

async function encodeAddWallet(wallet) {
    let response = await axios.post(`${config.compiler.host}/encode-calldata`, {
        "function" : "add_wallet",
        "arguments" : [ wallet ],
        "source" : contracts.coopSource
    }).catch(function(error) {
        console.log(error)
    })
    return response.data.calldata
}

async function decodeCallData(source, fn, calldata) {
    let response = await axios.post(`${config.compiler.host}/decode-calldata/source`, {
        "source" : source,
        "function" : fn,
        "calldata" : calldata
    }).catch(function(error) {
        console.log(error)
    })
    return response.data
}

module.exports = {
    coop: {
        encodeAddWallet
    },
    decodeCallData
}