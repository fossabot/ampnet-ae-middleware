let { Transaction, MemoryAccount, ChainNode, ContractCompilerAPI, Contract } = require('@aeternity/aepp-sdk')

let config = require('../env.json')[process.env.NODE_ENV || 'development']

async function init() {
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

    supervisorInstance = await ContractWithAE({
        url: config.node.host,
        internalUrl: config.node.internalHost,
        keypair: config.supervisor,
        nativeMode: true,
        networkId: 'ae_devnet',
        compilerUrl: config.compiler.host
    })
}

function instance() {
    return aeInstance
}

function supervisor() {
    return supervisorInstance
}

module.exports = {
    init,
    instance,
    supervisor
}