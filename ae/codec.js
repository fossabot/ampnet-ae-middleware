let client = require('./client')
let contracts = require('./contracts')
let functions = require('../enums/enums').functions

async function encodeAddWallet(wallet) {
    let encoded = await client.instance().contractEncodeCall(contracts.coopSource, functions.coop.addWallet, [ wallet ])
    return encoded
}

async function decodeData(source, fn, value) {
    let decoded = await client.instance().contractDecodeCallDataBySourceAPI(source, fn, value)
    return decoded
}

module.exports = {
    coop: {
        encodeAddWallet
    },
    decodeData
}