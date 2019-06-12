let { Universal: Ae } = require('@aeternity/aepp-sdk')
let config = require('../env.json')[process.env.NODE_ENV || 'development']

let ae

async function init() {
    if (typeof ae !== 'undefined') {
        throw new Error('Attempt to initialize Ae client which is already active.')
    }

    ae = await Ae({
        url: config.node.host,
        internalUrl: config.node.internalHost,
        keypair: config.node.keypair,
        nativeMode: true,
        networkId: 'ae_devnet'
    })
}

function instance() {
    if (typeof ae === 'undefined') {
        throw new Error('Attempt to get Aeternity client instance without calling init() first.')
    }
    return ae
}

module.exports = {
    init: init,
    instance: instance
}