let client = require('../../ae/client')

let environment = process.env.ENVIRONMENT || 'development';
let config = require('../../knexfile.js')[environment];
let knex = require('knex')(config)


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitMined(txHash) {
    return new Promise(async (resolve) => {
        client.instance().poll(txHash).then(async _ => {
            client.instance().getTxInfo(txHash).then(async (info) => {
                console.log(`\nTransaction ${txHash} mined! Status: ${info.returnType}`)
                await sleep(1000)
                resolve()
            })
        })
    })
}

function enforceAkPrefix(address) {
    return address.replace("ct_", "ak_")
}

async function wipeDb() {
    return new Promise(resolve => {
        knex.raw('TRUNCATE TABLE transaction CASCADE').then(_ => {
            resolve()
        })
    })
}

function assertDbRecord(
    actualRecord, 
    expectedHash, 
    expectedFromWallet, 
    expectedToWallet, 
    expectedState, 
    expectedType,
    expectedAmount,
    expectedWallet
) 
{
    


}

module.exports = { waitMined, enforceAkPrefix, wipeDb }