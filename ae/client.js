let { Transaction, MemoryAccount, ChainNode, ContractCompilerAPI, Contract } = require('@aeternity/aepp-sdk')

let config = require('../config')

async function init() {
    let ContractWithAE = await Contract
        .compose(ContractCompilerAPI)
        .compose(Transaction, MemoryAccount, ChainNode)

    aeInstance = await ContractWithAE({
        url: config.get().node.url,
        keypair: config.get().supervisor,
        networkId: config.get().networkId,
        compilerUrl: config.get().compilerUrl
    })
}

function instance() {
    return aeInstance
}

module.exports = {
    init,
    instance
}