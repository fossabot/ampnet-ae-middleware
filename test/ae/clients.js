let { Universal: Ae } = require('@aeternity/aepp-sdk')
let config = require('../../config')
let accounts = require('./accounts')

let coopClient
let eurClient
let bobClient
let aliceClient
let emptyClient

async function init() {
    coopClient = await Ae({
        url: config.get().node.url,
        keypair: accounts.coop,
        networkId: config.get().node.networkId,
        compilerUrl: config.get().node.compilerUrl
    })

    eurClient = await Ae({
        url: config.get().node.url,
        keypair: accounts.eur,
        networkId: config.get().node.networkId,
        compilerUrl: config.get().node.compilerUrl
    })

    bobClient = await Ae({
        url: config.get().node.url,
        keypair: accounts.bob,
        networkId: config.get().node.networkId,
        compilerUrl: config.get().node.compilerUrl
    })

    aliceClient = await Ae({
        url: config.get().node.url,
        keypair: accounts.alice,
        networkId: config.get().node.networkId,
        compilerUrl: config.get().node.compilerUrl
    })

    emptyClient = await Ae({
        url: config.get().node.url,
        keypair: accounts.empty,
        networkId: config.get().node.networkId,
        compilerUrl: config.get().node.compilerUrl
    })
}

module.exports = {
    init,
    coop: function() { return coopClient },
    eur: function() { return eurClient },
    bob: function() { return bobClient },
    alice: function() { return aliceClient },
    empty: function() { return emptyClient }
}