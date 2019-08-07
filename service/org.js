let client = require('../ae/client')
let codec = require('../ae/codec')
let contracts = require('../ae/contracts')
let repo = require('../persistence/repository')
let err = require('../error/errors')

async function createOrganization(call, callback) {
    try {
        console.log(`\nReceived request to generate createOrganization transaction.\nCaller: ${call.request.fromTxHash}`)
        let walletTx = await repo.findByHashOrThrow(call.request.fromTxHash)
        console.log(`Address represented by given hash: ${walletTx.wallet}\n`)
        let callData = await codec.org.encodeCreateOrganization()
        let result = await client.instance().contractCreateTx({
            ownerId: walletTx.wallet,
            code: contracts.getOrgCompiled().bytecode,
            vmVersion: 3,
            abiVersion: 1,
            deposit: 0,
            amount: 0,
            gas: 50000,
            callData: callData
        })
        console.log(`Successfully generated createOrganization transaction!`)
        callback(null, { tx: result.tx })
    } catch (error) {
        console.log(`Error while generating organization create transaction: ${error}`)
        err.handle(error, callback)
    }
}

module.exports = { createOrganization }