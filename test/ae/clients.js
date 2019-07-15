let { Universal: Ae } = require('@aeternity/aepp-sdk')
let config = require('../../env.json')[process.env.NODE_ENV || 'development']
let accounts = require('./accounts')

let coopClient
let eurClient
let bobClient
let aliceClient

async function init() {
    let networkId = 'ae_devnet'

    coopClient = await Ae({
        url: config.node.host,
        internalUrl: config.node.internalHost,
        keypair: accounts.coop,
        nativeMode: true,
        networkId: networkId,
        compilerUrl: config.compiler.host
    })

    eurClient = await Ae({
        url: config.node.host,
        internalUrl: config.node.internalHost,
        keypair: accounts.eur,
        nativeMode: true,
        networkId: networkId,
        compilerUrl: config.compiler.host
    })

    bobClient = await Ae({
        url: config.node.host,
        internalUrl: config.node.internalHost,
        keypair: accounts.bob,
        nativeMode: true,
        networkId: networkId,
        compilerUrl: config.compiler.host
    })

    aliceClient = await Ae({
        url: config.node.host,
        internalUrl: config.node.internalHost,
        keypair: accounts.alice,
        nativeMode: true,
        networkId: networkId,
        compilerUrl: config.compiler.host
    })
}

module.exports = {
    init: init,
    coop: function() { return coopClient },
    eur: function() { return eurClient },
    bob: function() { return bobClient },
    alice: function() { return aliceClient }
}