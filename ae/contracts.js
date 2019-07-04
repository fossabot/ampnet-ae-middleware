let config = require('../env.json')[process.env.NODE_ENV || 'development']

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

module.exports = {
    setCoopAddress,
    setEurAddress,
    getCoopAddress,
    getEurAddress
}