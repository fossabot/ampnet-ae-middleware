let { Transaction, MemoryAccount, ChainNode, ContractCompilerAPI, Contract } = require('@aeternity/aepp-sdk')

let config = require('../env.json')[process.env.NODE_ENV || 'development']

async function init() {
    if (typeof aeInstance !== 'undefined') {
        throw new Error('Attempt to initialize Ae client which is already active.')
    }

    let ContractWithAE = await Contract
        .compose(ContractCompilerAPI)
        .compose(Transaction, MemoryAccount, ChainNode)

    aeInstance = await ContractWithAE({
        url: config.node.host,
        internalUrl: config.node.internalHost,
        keypair: config.node.keypair,
        nativeMode: true,
        networkId: 'ae_devnet',
        compilerUrl: config.compiler.host
    })
}

function instance() {
    if (typeof aeInstance === 'undefined') {
        throw new Error('Attempt to get Aeternity client instance without calling init() first.')
    }
    return aeInstance
}

module.exports = {
    init,
    instance
}