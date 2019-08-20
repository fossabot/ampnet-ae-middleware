let client = require('../ae/client')
let codec = require('../ae/codec')
let contracts = require('../ae/contracts')
let repo = require('../persistence/repository')
let util = require('../ae/util')
let err = require('../error/errors')
let functions = require('../enums/enums').functions

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

async function getInfo(call, callback) {
    try {
        console.log(`\nReceived request to fetch statuses for projects: ${call.request.projectTxHashes}`)
        let walletToHashMap = new Map()
        let projectWallets = await Promise.all(
            call.request.projectTxHashes.map(async (projectTxHash) => {
                return new Promise(resolve => {
                    repo.findByHashOrThrow(projectTxHash).then(tx => { 
                        walletToHashMap.set(tx.wallet, projectTxHash)
                        resolve(tx.wallet) 
                    })
                })
            })
        )        
        console.log(`Addresses represented by given hashes: ${projectWallets}`)

        let projectInfoResults = await Promise.all(
            projectWallets.map(wallet => {
                return new Promise(resolve => {
                    client.instance().contractCallStatic(
                        contracts.projSource,
                        util.enforceCtPrefix(wallet),
                        functions.proj.getInfo,
                        [ ]
                    ).then(result => {
                        result.decode().then(decoded => {
                            resolve({
                                projectTxHash: walletToHashMap.get(wallet),
                                totalFundsRaised: util.tokenToEur(decoded[0]),
                                investmentCap: util.tokenToEur(decoded[1]),
                                minPerUserInvestment: util.tokenToEur(decoded[2]),
                                maxPerUserInvestment: util.tokenToEur(decoded[3]),
                                endsAt: decoded[4]
                            })
                        })
                    })
                })
            })
        )
        console.log("Projects info response", projectInfoResults)

        callback(null, { projects: projectInfoResults })
    } catch(error) {
        console.log(`Error while fetching statuses for given projects list: ${error}`)
        err.handle(error, callback)
    }
}

module.exports = { createProject, startRevenueSharesPayout, getInfo }