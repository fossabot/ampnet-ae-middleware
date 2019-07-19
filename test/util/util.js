let client = require('../../ae/client')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitMined(txHash) {
    return new Promise(async (resolve) => {
        client.instance().poll(txHash).then(async _ => {
            client.instance().getTxInfo(txHash).then(async (info) => {
                console.log(`\nTransaction ${txHash} mined! Status: ${info.returnType}`)
                await sleep(750)
                resolve()
            })
        })
    })
}

function enforceAkPrefix(address) {
    return address.replace("ct_", "ak_")
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

module.exports = { waitMined, enforceAkPrefix }