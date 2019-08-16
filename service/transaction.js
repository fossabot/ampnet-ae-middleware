let { TxBuilder: TxBuilder } = require('@aeternity/aepp-sdk')

let client = require('../ae/client')
let repo = require('../persistence/repository')
let enums = require('../enums/enums')
let contracts = require('../ae/contracts')
let config = require('../config')
let codec = require('../ae/codec')
let util = require('../ae/util')
let err = require('../error/errors')
let ErrorType = err.type

let { TxState, TxType, WalletType, SupervisorStatus } = require('../enums/enums')

async function postTransaction(call, callback) {
    console.log(`\nReceived request to post transaction: ${call.request.data}`)
    try {
        let tx = call.request.data
        await performSecurityChecks(tx)
        let result = await client.instance().sendTransaction(tx, { waitMined: false })
        processTransaction(result.hash)
        console.log(`Transaction successfully broadcasted! Tx hash: ${result.hash}`)
        callback(null, { txHash: result.hash })
    } catch(error) {
        console.log("Error while posting transaction", error)
        err.handle(error, callback)
    }
}

async function getPortfolio(call, callback) {
    console.log(`\nReceived request to fetch portfolio for user with wallet txHash ${call.request.txHash}`)
    try {
        let tx = await repo.findByHashOrThrow(call.request.txHash)
        console.log(`Address represented by given hash: ${tx.wallet}\n`)
        
        let portfolioMap = new Map()
        let records = await repo.get({
            from_wallet: tx.wallet,
            type: TxType.INVEST
        })
        let recordsLength = records.length

        for (var i = 0; i < recordsLength; i++) {
            tx = await repo.findByWalletOrThrow(records[i].to_wallet)
            project = tx.hash
            amount = records[i].amount
            if (portfolioMap.has(project)) { 
                portfolioMap.set(project, Number(portfolioMap.get(project)) + Number(amount)).toString()
            } else {
                portfolioMap.set(project, amount)
            }
        }

        let portfolio = Array.from(portfolioMap).map(entry => {
            return {
                projectTxHash: entry[0],
                amount: entry[1]
            }
        })
        console.log("Successfully fetched portfolio: ", portfolio)
        callback(null, { portfolio: portfolio })
    } catch (error) {
        console.log(`Error while fetching portfolio: ${error}`)
        err.handle(error, callback)
    }
}

async function getTransactions(call, callback) {
    console.log(`\nReceived request to fetch transactions for user with wallet txHash ${call.request.txHash}`)
    try {
        let tx = await repo.findByHashOrThrow(call.request.txHash)
        console.log(`Address represented by given hash: ${tx.wallet}\n`)
        let types = new Set([TxType.DEPOSIT, TxType.WITHDRAW, TxType.INVEST, TxType.SHARE_PAYOUT])
        let transactionsPromisified = (await repo.getUserTransactions(tx.wallet))
            .filter(r => { return types.has(r.type) }) 
            .map(r => {
                switch (r.type) {
                    case TxType.DEPOSIT:
                    case TxType.WITHDRAW:
                        return new Promise(resolve => {
                            resolve({
                                amount: r.amount,
                                type: enums.txTypeToGrpc(r.type)
                            })
                        })
                    case TxType.INVEST:
                        return new Promise(async (resolve) => {
                            repo.findByWalletOrThrow(r.to_wallet).then(project => {
                                resolve({
                                    fromTxHash: call.request.txHash,
                                    toTxHash: project.hash,
                                    amount: r.amount,
                                    type: enums.txTypeToGrpc(r.type)
                                })
                            })
                        })
                    case TxType.SHARE_PAYOUT:
                        return new Promise(async (resolve) => {
                            repo.findByWalletOrThrow(r.from_wallet).then(project => {
                                resolve({
                                    fromTxHash: project.hash,
                                    toTxHash: call.request.txHash,
                                    amount: r.amount,
                                    type: enums.txTypeToGrpc(r.type)
                                })
                            })                            
                        })
                }
            })
        let transactions = await Promise.all(transactionsPromisified)
        console.log("Successfully fetched user's transactions", transactions)
        callback(null, { transactions: transactions })
    } catch (error) {
        console.log(`Error while fetching transactions: ${error}`)
        err.handle(error, callback)
    }
}

async function processTransaction(hash) {
    await repo.saveHash(hash)
    let poll = await client.instance().poll(hash)
    let info = await client.instance().getTxInfo(hash)
    if (info.returnType == 'ok') {
        handleTransactionMined(info, poll)
    } else {
        handleTransactionFailed(info, hash)
    }
}

async function handleTransactionMined(info, poll) {
        for (event of info.log) {
            type = enums.fromEvent(event.topics[0], poll)
            tx = await updateTransactionState(info, poll, type)
            if (tx.supervisor_status == SupervisorStatus.REQUIRED) {
                handleSupervisorAction(tx)
            }
        }
}

async function handleTransactionFailed(txInfo, hash) {
    decodedError = await err.decode(txInfo)
    repo.update(hash, {
        state: TxState.FAILED,
        error_message: decodedError
    })
}

async function handleSupervisorAction(tx) {
    switch (tx.type) {
        case TxType.WALLET_CREATE:
            if (tx.wallet_type == WalletType.USER) {
                await client.instance().spend(300000000000000000, tx.wallet).catch(console.log)
                console.log(`Transferred 0.3AE to user with wallet ${tx.wallet} (welcome gift)`)
                await repo.update(tx.hash, { supervisor_status: SupervisorStatus.PROCESSED })
            }
            break
        case TxType.APPROVE_INVESTMENT:
            contract = util.enforceCtPrefix(tx.to_wallet)
            result = await client.instance().contractCall(
                contracts.projSource,
                contract,
                enums.functions.proj.invest,
                [ tx.from_wallet ]
            ).catch(console.log)
            await repo.update(tx.hash, { supervisor_status: SupervisorStatus.PROCESSED })
            console.log(`Processed approve investment transaction by calling invest() on Project ${contract} for investor ${tx.from_wallet}`)
            processTransaction(result.hash)
            break 
        case TxType.START_REVENUE_PAYOUT:
            console.log("handle special case start revenue payout")
            contract = util.enforceCtPrefix(tx.to_wallet)
            batchCount = 1 
            do {
                batchPayout = await client.instance().contractCall(
                    contracts.projSource,
                    contract,
                    enums.functions.proj.payoutRevenueSharesBatch,
                    [ ]
                ).catch(console.log)
                shouldPayoutAnotherBatch = await batchPayout.decode()
                console.log(`Payed out batch ${batchCount} for investors in Project ${contract}. Should pay another batch: ${shouldPayoutAnotherBatch}`)
                batchCount++
                processTransaction(batchPayout.hash)
            } while(shouldPayoutAnotherBatch)
            await repo.update(tx.hash, { supervisor_status: SupervisorStatus.PROCESSED })
            console.log(`All batches payed out.`)
            break
    }
}

async function updateTransactionState(info, poll, type) {
    switch (type) {
        case TxType.WALLET_CREATE:
            address = util.decodeAddress(event.topics[1])
            walletType = await repo.getWalletTypeOrThrow(address)
            supervisorStatus = (walletType == WalletType.USER) ? SupervisorStatus.REQUIRED : SupervisorStatus.NOT_REQUIRED
            return repo.update(poll.hash, {
                from_wallet: info.callerId,
                to_wallet: address,
                input: poll.tx.callData,
                state: TxState.MINED,
                supervisor_status: supervisorStatus,
                type: TxType.WALLET_CREATE,
                wallet: address,
                wallet_type: walletType,
                processed_at: new Date()
            })
        case TxType.ORG_CREATE:
            return repo.update(poll.hash, {
                from_wallet: info.callerId,
                to_wallet: util.enforceAkPrefix(info.contractId),
                input: poll.tx.callData,
                state: TxState.MINED,
                supervisor_status: SupervisorStatus.NOT_REQUIRED,
                type: TxType.ORG_CREATE,
                processed_at: new Date()
            })
        case TxType.PROJ_CREATE:
            return repo.update(poll.hash, {
                from_wallet: info.callerId,
                to_wallet: util.enforceAkPrefix(info.contractId),
                input: poll.tx.callData,
                state: TxState.MINED,
                supervisor_status: SupervisorStatus.NOT_REQUIRED,
                type: TxType.PROJ_CREATE,
                processed_at: new Date()
            })
        case TxType.DEPOSIT:
            address = util.decodeAddress(event.topics[1])
            amount = util.tokenToEur(event.topics[2])
            return repo.update(poll.hash, {
                from_wallet: info.callerId,
                to_wallet: address,
                input: poll.tx.callData,
                state: TxState.MINED,
                supervisor_status: SupervisorStatus.NOT_REQUIRED,
                type: TxType.DEPOSIT,
                amount: amount,
                processed_at: new Date()
            })
        case TxType.APPROVE:
            spender = util.decodeAddress(event.topics[1])
            amount = util.tokenToEur(event.topics[2])
            type = (spender == config.get().contracts.eur.owner) ? TxType.APPROVE_USER_WITHDRAW : TxType.APPROVE_INVESTMENT
            supervisorStatus = (type == TxType.APPROVE_INVESTMENT) ? SupervisorStatus.REQUIRED : SupervisorStatus.NOT_REQUIRED
            return repo.update(poll.hash, {
                from_wallet: info.callerId,
                to_wallet: spender,
                input: poll.tx.callData,
                state: TxState.MINED,
                supervisor_status: supervisorStatus,
                type: type,
                amount: amount,
                processed_at: new Date()
            })
        case TxType.WITHDRAW:
            withdrawFrom = util.decodeAddress(event.topics[1])
            amount = util.tokenToEur(event.topics[2])
            return repo.update(poll.hash, {
                from_wallet: withdrawFrom,
                to_wallet: info.callerId,
                input: poll.tx.callData,
                state: TxState.MINED,
                supervisor_status: SupervisorStatus.NOT_REQUIRED,
                type: TxType.WITHDRAW,
                amount: amount,
                processed_at: new Date()
            })
        case TxType.INVEST:
            investor = util.decodeAddress(event.topics[1])
            amount = util.tokenToEur(event.topics[2])
            return repo.update(poll.hash, {
                from_wallet: investor,
                to_wallet: util.enforceAkPrefix(info.contractId),
                input: poll.tx.callData,
                state: TxState.MINED,
                supervisor_status: SupervisorStatus.NOT_REQUIRED,
                type: TxType.INVEST,
                amount: amount,
                processed_at: new Date()
            })
        case TxType.START_REVENUE_PAYOUT:
            amount = util.tokenToEur(event.topics[1])
            return repo.update(poll.hash, {
                from_wallet: info.callerId,
                to_wallet: util.enforceAkPrefix(info.contractId),
                input: poll.tx.callData,
                state: TxState.MINED,
                supervisor_status: SupervisorStatus.REQUIRED,
                type: TxType.START_REVENUE_PAYOUT,
                amount: amount,
                processed_at: new Date()
            })
        case TxType.SHARE_PAYOUT:
            investor = util.decodeAddress(event.topics[1])
            share = util.tokenToEur(event.topics[2])
            return repo.update(poll.hash, {
                from_wallet: util.enforceAkPrefix(info.contractId),
                to_wallet: investor,
                input: poll.tx.callData,
                state: TxState.MINED,
                supervisor_status: SupervisorStatus.NOT_REQUIRED,
                type: TxType.SHARE_PAYOUT,
                amount: share,
                processed_at: new Date()
            })
        default:
            throw new Error(`Unknown transaction processed! Hash: ${poll.hash}`)
    }
}

async function performSecurityChecks(data) {
    let txMetadata = TxBuilder.unpackTx(data)
    if (txMetadata.txType != 'signedTx') {
        throw err.generate(ErrorType.TX_NOT_SIGNED)
    }
    let unpackedTx = txMetadata.tx.encodedTx

    switch (unpackedTx.txType) {
        case 'contractCallTx':
            await checkTxCaller(unpackedTx.tx.callerId)
            await checkTxCallee(unpackedTx.tx.contractId)
            break
        case 'contractCreateTx':
            await checkTxCaller(unpackedTx.tx.ownerId)
            await checkContractData(unpackedTx.tx)
            break
        default:
            throw err.generate(ErrorType.GENERIC_ERROR, `Error posting transaction. Expected transaction of type contractCall or contractCreate but got ${unpackedTx.txType}. Aborting.`)
    }
}

async function checkTxCaller(callerId) {
    let coopAuthorityId = config.get().contracts.coop.owner
    let issuingAuthorityId = config.get().contracts.eur.owner
    
    // if caller is coop or token authority return normally
    if(callerId == coopAuthorityId || callerId == issuingAuthorityId) {
        return
    }

    // if caller not found in repo or caller's wallet still not mined exception is thrown
    return repo.findByWalletOrThrow(callerId)
}

async function checkTxCallee(calleeId) {
    if (calleeId == config.get().contracts.coop.address || calleeId == config.get().contracts.eur.address) { return }
    
    let walletActive = await isWalletActive(calleeId)
    if (walletActive) { return }
    
    throw err.generate(ErrorType.TX_INVALID_CONTRACT_CALLED)
}

async function checkContractData(tx) {
    switch (tx.code) {
        case contracts.getOrgCompiled().bytecode:
            callData = await codec.decodeDataBySource(contracts.orgSource, "init", tx.callData)
            if (callData.arguments[0].value != config.get().contracts.coop.address) {
                throw err.generate(ErrorType.GROUP_INVALID_COOP_ARG)
            }
            break
        case contracts.getProjCompiled().bytecode:
            callData = await codec.decodeDataBySource(contracts.projSource, "init", tx.callData)
            orgAddress = callData.arguments[0].value
            isOrgActive = await isWalletActive(orgAddress)
            if (!isOrgActive) {
                throw err.generate(ErrorType.PROJ_INVALID_GROUP_ARG)
            }
            break
        default:
            throw err.generate(ErrorType.MALFORMED_CONTRACT_CODE)
    }

    if (tx.amount != 0) {
        throw err.generate(ErrorType.GENERIC_ERROR, `Error posting Contract create transaction. Amount field has to be set to 0 but ${tx.amount} provided!`)
    }
    if (tx.deposit != 0) {
        throw err.generate(ErrorType.GENERIC_ERROR, `Error posting Contract create transaction. Deposit field has to be set to 0 but ${tx.deposit} provided!`)
    }
}

async function isWalletActive(wallet) {
    let address = await util.enforceAkPrefix(wallet)
    let result = await client.instance().contractCallStatic(
        contracts.coopSource, 
        config.get().contracts.coop.address, 
        enums.functions.coop.isWalletActive,
        [ address ]
    )
    return result.decode()
}

module.exports = { 
    postTransaction, 
    getPortfolio, 
    getTransactions 
}