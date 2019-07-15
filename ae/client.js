let { Universal: Ae, ChainNode: ChainNode } = require('@aeternity/aepp-sdk')

let config = require('../env.json')[process.env.NODE_ENV || 'development']

let aeInstance
let nodeInstance

async function init() {
    if (typeof aeInstance !== 'undefined') {
        throw new Error('Attempt to initialize Ae client which is already active.')
    }

    aeInstance = await Ae({
        url: config.node.host,
        internalUrl: config.node.internalHost,
        keypair: config.node.keypair,
        nativeMode: true,
        networkId: 'ae_devnet',
        compilerUrl: config.compiler.host
    })

    nodeInstance = await ChainNode({
        url: config.node.host
    })
}

function instance() {
    if (typeof aeInstance === 'undefined') {
        throw new Error('Attempt to get Aeternity client instance without calling init() first.')
    }
    return aeInstance
}

function node() {
    if (typeof nodeInstance === 'undefined') {
        throw new Error('Attempt to get Aeternity Node client instance without calling init() first.')
    }
    return nodeInstance
}

module.exports = {
    init,
    node,
    instance
}