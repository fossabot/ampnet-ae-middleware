let fs = require('fs')
let path = require('path')
let client = require('./client')
let repo = require('../persistence/repository')
let txType = require('../enums/enums').txType

let config = require('../env.json')[process.env.NODE_ENV || 'development']

let coopSource = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'Coop.aes')).toString()
let eurSource = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'EUR.aes')).toString()
let orgSource = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'Organization.aes')).toString()
let projSource = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'Project.aes')).toString()

let coopCompiled
let eurCompiled
let orgCompiled
let projCompiled

let coopAddress
let eurAddress

async function compile() {
    coopCompiled = await client.instance().contractCompile(coopSource)
    eurCompiled = await client.instance().contractCompile(eurSource)
    orgCompiled = await client.instance().contractCompile(orgSource)
    projCompiled = await client.instance().contractCompile(projSource)
}

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

async function getContractFromAddress(address) {
    if (address == getCoopAddress()) {
        return {
            source: coopSource,
            bytecode: coopCompiled.bytecode
        }
    } else if (address == getEurAddress()) {
        return {
            source: eurSource,
            bytecode: eurCompiled.bytecode
        }
    } else {
        let record = await repo.findByWallet(address)
        if (record.type == txType.ORG_CREATE) {
            return {
                source: orgSource,
                bytecode: orgCompiled.bytecode
            }
        } else if (record.type == txType.PROJ_CREATE) {
            return {
                source: projSource,
                bytecode: projCompiled.bytecode
            }
        } else {
            throw new Error("Could not convert deployed contract address to source file.")
        }
    }
}

function getCoopCompiled() { return coopCompiled }
function getEurCompiled() { return eurCompiled }
function getOrgCompiled() { return orgCompiled }
function getProjCompiled() { return projCompiled }

module.exports = {
    setCoopAddress,
    setEurAddress,
    getCoopAddress,
    getEurAddress,
    coopSource,
    eurSource,
    orgSource,
    projSource,
    getCoopCompiled,
    getEurCompiled,
    getOrgCompiled,
    getProjCompiled,
    getContractFromAddress,
    compile
}