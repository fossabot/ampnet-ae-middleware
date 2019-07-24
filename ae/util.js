const tokenFactor = 10000000000000000n

function enforceAkPrefix(address) {
    return address.replace("ct_", "ak_")
}

function enforceCtPrefix(address) {
    return address.replace("ak_", "ct_")
}

function eurToToken(amount) {
    return (BigInt(amount) * tokenFactor).toString()
}

function tokenToEur(amount) {
    return (BigInt(amount) / tokenFactor).toString()
}

module.exports = { 
    enforceAkPrefix,
    enforceCtPrefix,
    eurToToken,
    tokenToEur
}