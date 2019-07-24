let client = require('../ae/client')
let codec = require('../ae/codec')
let contracts = require('../ae/contracts')
let functions = require('../enums/enums').functions
let repo = require('../persistence/repository')
let util = require('../ae/util')

let config = require('../env.json')[process.env.NODE_ENV || 'development']

async function mint(call, callback) {
    console.log(`\nReceived request to generate minting of ${call.request.amount} tokens to wallet with txHash ${call.request.toTxHash}`)
    try {
        let record = await repo.getWalletOrThrow(call.request.toTxHash)
        console.log(`Address represented by given hash: ${record.wallet}`)
        let callData = await codec.eur.encodeMint(record.wallet, util.eurToToken(call.request.amount))
        let tx = await client.instance().contractCallTx({
            callerId: config.contracts.eur.owner,
            contractId: contracts.getEurAddress(),
            abiVersion: 1,
            amount: 0,
            gas: 10000,
            callData: callData
        })
        console.log(`Successfully generated mint transaction: ${tx}`)
        callback(null, { tx: tx })
    } catch (error) {
        console.log(`Error while generating mint transaction: ${error}`)
        callback(error, null)
    }
}

async function approveWithdraw(call, callback) {
    console.log(`\nReceived request to generate withdraw approval of ${call.request.amount} tokens from wallet with txHash ${call.request.fromTxHash}`)
    try {
        let record = await repo.getWalletOrThrow(call.request.fromTxHash)
        console.log(`Address represented by given hash: ${record.wallet}`)
        let amount = util.eurToToken(call.request.amount)
        let callData = await codec.eur.encodeApprove(config.contracts.eur.owner, amount)
        let tx = await client.instance().contractCallTx({
            callerId: record.wallet,
            contractId: contracts.getEurAddress(),
            abiVersion: 1,
            amount: 0,
            gas: 10000,
            callData: callData
        })
        console.log(`Successfully generated approve withdraw transaction: ${tx}`)
        callback(null, { tx: tx })
    } catch (error) {
        console.log(`Error while withdraw approve transaction: ${error}`)
        callback(error, null)
    }
}

async function burnFrom(call, callback) {
    console.log(`\nReceived request to generate burning of tokens from wallet with txHash ${call.request.burnFromTxHash}`)
    try {
        let record = await repo.getWalletOrThrow(call.request.burnFromTxHash)
        console.log(`Address represented by given hash: ${record.wallet}`)
        let amount = await allowance(record.wallet)
        console.log(`Amount to burn: ${amount}`)
        let callData = await codec.eur.encodeBurnFrom(record.wallet, amount)
        let tx = await client.instance().contractCallTx({
            callerId: config.contracts.eur.owner,
            contractId: contracts.getEurAddress(),
            abiVersion: 1,
            amount: 0,
            gas: 10000,
            callData: callData
        })
        console.log(`Successfully generated burn transaction: ${tx}`)
        callback(null, { tx: tx })
    } catch (error) {
        console.log(`Error while generating burn transaction: ${error}`)
        callback(error, null)
    }
}

async function balance(call, callback) {
    console.log(`\nReceived request to fetch balance of wallet with txHash ${call.request.walletTxHash}`)
    try {
        let tx = await repo.getWalletOrThrow(call.request.walletTxHash)
        console.log(`Address represented by given hash: ${tx.wallet}\n`)
        let result = await client.instance().contractCallStatic(
            contracts.eurSource,
            contracts.getEurAddress(),
            functions.eur.balanceOf,
            [ tx.wallet ]
        )
        let resultDecoded = await result.decode()
        let resultInEur = util.tokenToEur(resultDecoded)
        callback(null, { balance: resultInEur })
    } catch (error) {
        console.log(`Error while fetching balance: ${error}`)
        callback(error, null)
    }
}

async function invest(call, callback) {
    console.log(`\nReceived request to generate invest transaction.\Caller: ${call.request.fromTxHash}\nProject: ${call.request.projectTxHash}\nAmount: ${amount}`)
    try {
        let investor = (await repo.getWalletOrThrow(call.request.fromTxHash)).wallet
        console.log(`Investor address: ${investor}`)
        let project = (await repo.getWalletOrThrow(call.request.projectTxHash)).wallet
        console.log(`Project address: ${project}`)
        let amount = util.eurToToken(call.request.amount)
        let callData = await codec.eur.encodeApprove(project, amount)
        let tx = await client.instance().contractCallTx({
            callerId: investor,
            contractId: contracts.getEurAddress(),
            abiVersion: 1,
            amount: 0,
            gas: 10000,
            callData: callData
        })
        console.log(`Successfully generated invest tx: ${tx}`)
        callback(null, { tx: tx })
    } catch (error) {
        console.log(`Error while generating invest transaction: ${error}`)
        callback(error, null)
    }
}

async function allowance(owner) {
    let result = await client.instance().contractCallStatic(
        contracts.eurSource,
        contracts.getEurAddress(),
        functions.eur.allowance,
        [ owner, config.contracts.eur.owner ]
    )
    return result.decode()
}

module.exports = { mint, approveWithdraw, burnFrom, balance, invest }