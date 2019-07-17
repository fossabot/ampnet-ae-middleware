let client = require('../../ae/client')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitMined(postTxResponse) {
    return new Promise(async (resolve) => {
        await client.instance().poll(postTxResponse.txHash)
        console.log(`Transaction ${postTxResponse.txHash} mined!`)
        console.log("sleep 5 seconds")
        await sleep(5000)
        resolve()
    })
}

module.exports = { waitMined }