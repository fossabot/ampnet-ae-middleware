let client = require('./client')
let contracts = require('./contracts')
let functions = require('../enums/enums').functions
let { Crypto } = require('@aeternity/aepp-sdk')
let { BigNumber } = require('bignumber.js')

async function encodeAddWallet(wallet) {
    return contracts.getCoopCompiled().encodeCall(functions.coop.addWallet, [ wallet ])
}

async function encodeCreateOrganization() {
    return contracts.getOrgCompiled().encodeCall("init", [ contracts.getCoopAddress() ])
}

async function encodeCreateProject(org, minInvestment, maxInvestment, investmentCap, endsAt) {
    return contracts.getProjCompiled().encodeCall(
        "init", 
        [
            org,
            minInvestment,
            maxInvestment,
            investmentCap,
            endsAt
        ]
    )
}

async function encodeStartRevenueSharesPayout(revenue) {
    return contracts.getProjCompiled().encodeCall(
        functions.proj.startRevenueSharesPayout,
        [ revenue ]
    )
}

async function encodeMint(address, amount) {
    return contracts.getEurCompiled().encodeCall(functions.eur.mint, [ address, amount ])
}

async function encodeApprove(spender, amount) {
    return contracts.getEurCompiled().encodeCall(functions.eur.approve, [ spender, amount ])
}

async function encodeBurnFrom(address, amount) {
    return contracts.getEurCompiled().encodeCall(functions.eur.burnFrom, [ address, amount ])
}

async function decodeDataBySource(source, fn, value) {
    return client.instance().contractDecodeCallDataBySourceAPI(source, fn, value)
}

async function decodeDataByBytecode(bytecode, data) {
    return client.instance().contractDecodeCallDataByCodeAPI(bytecode, data)
}

function decodeAddress(data) {
    return Crypto.toBytes(data, true)
}

function blake2b(data) {
    return Crypto.hash(data).toString('hex')
}

function bigNumberToByteArray(num) {
    let bigNum = BigNumber(num)
    let hexString = bigNum.toString(16)
    if (hexString.length % 2 > 0) hexString = '0' + hexString
    return hexString
}

module.exports = {
    coop: {
        encodeAddWallet
    },
    org: {
        encodeCreateOrganization
    },
    eur: {
        encodeMint,
        encodeApprove,
        encodeBurnFrom
    },
    proj: {
        encodeCreateProject,
        encodeStartRevenueSharesPayout
    },
    decodeAddress,
    blake2b,
    bigNumberToByteArray,
    decodeDataBySource,
    decodeDataByBytecode
}