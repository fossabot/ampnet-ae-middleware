let config = require('../env.json')[process.env.NODE_ENV || 'development']
let repository = require('../persistence/repository')
let fs = require('fs')
let path = require('path')

let coopSource = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'Coop.aes')).toString()
let eurSource = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'EUR.aes')).toString()
let orgSource = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'Organization.aes')).toString()
let projSource = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'Project.aes')).toString()

let coopAddress
let eurAddress

function setCoopAddress(address) {
    coopAddress = address
}

function setEurAddress(address) {
    eurAddress = address
}

function getCoopAddress() {
    if (typeof coopAddress === 'undefined') {
        return config.contracts.coop.address
    } else {
        return coopAddress
    }
}

function getEurAddress() {
    if (typeof eurAddress === 'undefined') {
        return config.contracts.eur.address
    } else {
        return eurAddress
    }
}

async function getContractSourceFromAddress(address) {
    console.log("getContractSourceFromAddress")
    console.log("address", address)
    console.log("getCoopAddress", getCoopAddress())
    console.log("getEurAddress", getEurAddress())
    if (address == getCoopAddress()) {
        return coopSource
    } else if (address == getEurAddress()) {
        return eurSource
    } else {
        
    }
}

module.exports = {
    setCoopAddress,
    setEurAddress,
    getCoopAddress,
    getEurAddress,
    coopSource,
    eurSource,
    orgSource,
    projSource,
    getContractSourceFromAddress
}