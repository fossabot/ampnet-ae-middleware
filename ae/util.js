let { Crypto } = require('@aeternity/aepp-sdk')
let { BigNumber } = require('bignumber.js')

let client = require('../ae/client')

const tokenFactor = 10000000000000000n

function enforceAkPrefix(address) {
    return address.replace("ct_", "ak_")
}

function enforceCtPrefix(address) {
    return address.replace("ak_", "ct_")
}

function decodeAddress(data) {
    return Crypto.addressFromDecimal(data)
}

function blake2b(data) {
    return Crypto.hash(data).toString('hex')
}

function bigNumberToHex(num) {
    let bigNum = BigNumber(num)
    let hexString = bigNum.toString(16)
    if (hexString.length % 2 > 0) hexString = '0' + hexString
    return hexString
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
    tokenToEur,
    decodeAddress,
    blake2b,
    bigNumberToHex
}