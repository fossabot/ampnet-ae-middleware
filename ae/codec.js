let client = require('./client')
let contracts = require('./contracts')
let functions = require('../enums/enums').functions

async function encodeAddWallet(wallet) {
    let encoded = await client.instance().contractEncodeCall(contracts.coopSource, functions.coop.addWallet, [ wallet ])
    return encoded
}

async function encodeCreateOrganization() {
    let encoded = await contracts.getOrgCompiled().encodeCall("init", [ contracts.getCoopAddress() ])
    //let encoded = await client.instance().contractEncodeCall(contracts.getOrgCompiled().bytecode, "init", [ contracts.getCoopAddress() ])
    return encoded
}

async function decodeDataBySource(source, fn, value) {
    let decoded = await client.instance().contractDecodeCallDataBySourceAPI(source, fn, value)
    return decoded
}

async function decodeDataByBytecode(bytecode, data) {
    let decoded = await client.instance().contractDecodeCallDataByCodeAPI(bytecode, data)
    return decoded
}

module.exports = {
    coop: {
        encodeAddWallet
    },
    org: {
        encodeCreateOrganization
    },
    decodeDataBySource,
    decodeDataByBytecode
}