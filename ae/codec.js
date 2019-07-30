let client = require('./client')
let contracts = require('./contracts')
let functions = require('../enums/enums').functions

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
    decodeDataBySource,
    decodeDataByBytecode
}