let client = require('../ae/client')
let codec = require('../ae/codec')
let contracts = require('../ae/contracts')
let repo = require('../persistence/repository')
let util = require('../ae/util')
let err = require('../error/errors')

async function createProject(call, callback) {
    console.log(`\nReceived request to generate createProject transaction.\Caller: ${call.request.fromTxHash}`)
    try {
        let fromWallet = (await repo.findByHashOrThrow(call.request.fromTxHash)).wallet
        console.log(`Caller address represented by given hash: ${fromWallet}`)
        let orgContract = util.enforceCtPrefix(
            (await repo.findByHashOrThrow(call.request.organizationTxHash)).wallet
        )
        console.log(`Address of organization which controls this project: ${orgContract}`)
        let callData = await codec.proj.encodeCreateProject(
            orgContract,
            util.eurToToken(call.request.minInvestmentPerUser),
            util.eurToToken(call.request.maxInvestmentPerUser),
            util.eurToToken(call.request.investmentCap),
            call.request.endInvestmentTime
        )
        let result = await client.instance().contractCreateTx({
            ownerId: fromWallet,
            code: contracts.getProjCompiled().bytecode,
            vmVersion: 3,
            abiVersion: 1,
            deposit: 0,
            amount: 0,
            gas: 50000,
            callData: callData
        })
        console.log(`Successfully generated createProject transaction!`)
        callback(null, { tx: result.tx })
    } catch (error) {
        console.log(`Error generating createProject transaction: ${error}`)
        err.handle(error, callback)
    }
}

async function startRevenueSharesPayout(call, callback) {
    try {
        console.log(`\nReceived request to generate startRevenueSharesPayout transaction.\Caller: ${call.request.fromTxHash} wants to payout ${call.request.revenue} tokens to project with hash ${call.request.projectTxHash}`)
        let fromWallet = (await repo.findByHashOrThrow(call.request.fromTxHash)).wallet
        console.log(`Caller wallet: ${fromWallet}`)
        let revenue = util.eurToToken(call.request.revenue)
        console.log(`Revenue: ${revenue}`)
        let projectWallet = (await repo.findByHashOrThrow(call.request.projectTxHash)).wallet
        console.log(`Project: ${projectWallet}`)
        let callData = await codec.proj.encodeStartRevenueSharesPayout(revenue)
        let tx = await client.instance().contractCallTx({
            callerId: fromWallet,
            contractId: util.enforceCtPrefix(projectWallet),
            abiVersion: 1,
            amount: 0,
            gas: 10000,
            callData: callData
        })
        console.log(`Successfully generated startRevenueSharesPayout transaction: ${tx}`)
        callback(null, { tx: tx })
    } catch(error) {
        console.log(`Error while generating startRevenueSharesPayout transaction: ${error}`)
        err.handle(error, callback)
    }
}



module.exports = { createProject, startRevenueSharesPayout }