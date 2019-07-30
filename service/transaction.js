const { TxBuilder: TxBuilder } = require('@aeternity/aepp-sdk')

const client = require('../ae/client')
const repo = require('../persistence/repository')
const enums = require('../enums/enums')
const contracts = require('../ae/contracts')
const config = require('../env.json')[process.env.NODE_ENV || 'development']
const codec = require('../ae/codec')
const util = require('../ae/util')
const contractUtil = require('../ae/contract-util')

const TxState = enums.txState
const TxType = enums.txType
const WalletType = enums.walletType
const SupervisorStatus = enums.supervisorStatus

async function postTransaction(call, callback) {
    console.log(`\nReceived request to post transaction: ${call.request.data}`)
    try {
        let tx = call.request.data
        let txUnpacked = TxBuilder.unpackTx(tx).tx.encodedTx
        let txInfo = await getTransactionType(txUnpacked)
        
        await performSecurityChecks(txUnpacked, txInfo)
        let result = await client.instance().sendTransaction(tx, { waitMined: false })
        processTransaction(result.hash)


        // await persistTransaction(txUnpacked.tx, result.hash, txInfo)

        // updateTransactionState(result.hash, txInfo)

        // console.log(`Transaction successfully broadcasted! Tx hash: ${result.hash}`)
        callback(null, { txHash: result.hash })
    } catch(err) {
        console.log("err", err)
        console.log(`Error while posting transaction: ${err}`)
        callback(err, null)
    }
}

async function processTransaction(hash) {
    await repo.saveHash(hash)
    let poll = await client.instance().poll(hash)
    console.log("poll", poll)
    let info = await client.instance().getTxInfo(hash)
    console.log("info", info)
    if (info.returnType == 'ok') {
        // handle success
        for (event of info.log) {
            console.log("event", event)
            type = enums.fromEvent(event.topics[0], poll)
            console.log("type", type)
            switch (type) {
                case TxType.WALLET_CREATE:
                    address = util.decodeAddress(event.topics[1])
                    walletType = await repo.getWalletTypeOrThrow(address)
                    supervisorStatus = (walletType == WalletType.USER) ? SupervisorStatus.REQUIRED : SupervisorStatus.NOT_REQUIRED
                    tx = await repo.update(hash, {
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
                    break
                case TxType.ORG_CREATE:
                    tx = await repo.update(hash, {
                        from_wallet: info.callerId,
                        to_wallet: util.enforceAkPrefix(info.contractId),
                        input: poll.tx.callData,
                        state: TxState.MINED,
                        supervisor_status: SupervisorStatus.NOT_REQUIRED,
                        type: TxType.ORG_CREATE,
                        processed_at: new Date()
                    })
                    break
                case TxType.PROJ_CREATE:
                    tx = await repo.update(hash, {
                        from_wallet: info.callerId,
                        to_wallet: util.enforceAkPrefix(info.contractId),
                        input: poll.tx.callData,
                        state: TxState.MINED,
                        supervisor_status: SupervisorStatus.NOT_REQUIRED,
                        type: TxType.PROJ_CREATE,
                        processed_at: new Date()
                    })
                    break
                case TxType.DEPOSIT:
                    address = util.decodeAddress(event.topics[1])
                    amount = util.tokenToEur(event.topics[2])
                    tx = await repo.update(hash, {
                        from_wallet: info.callerId,
                        to_wallet: address,
                        input: poll.tx.callData,
                        state: TxState.MINED,
                        supervisor_status: SupervisorStatus.NOT_REQUIRED,
                        type: TxType.DEPOSIT,
                        amount: amount,
                        processed_at: new Date()
                    })
                    break
                case TxType.APPROVE:
                    spender = util.decodeAddress(event.topics[1])
                    amount = util.tokenToEur(event.topics[2])
                    type = (spender == config.contracts.eur.owner) ? TxType.APPROVE_USER_WITHDRAW : TxType.APPROVE_INVESTMENT
                    supervisorStatus = (type == TxType.APPROVE_INVESTMENT) ? SupervisorStatus.REQUIRED : SupervisorStatus.NOT_REQUIRED
                    tx = await repo.update(hash, {
                        from_wallet: info.callerId,
                        to_wallet: spender,
                        input: poll.tx.callData,
                        state: TxState.MINED,
                        supervisor_status: supervisorStatus,
                        type: type,
                        amount: amount,
                        processed_at: new Date()
                    })
                    break
                case TxType.WITHDRAW:
                    withdrawFrom = util.decodeAddress(event.topics[1])
                    amount = util.tokenToEur(event.topics[2])
                    tx = await repo.update(hash, {
                        from_wallet: withdrawFrom,
                        to_wallet: info.callerId,
                        input: poll.tx.callData,
                        state: TxState.MINED,
                        supervisor_status: SupervisorStatus.NOT_REQUIRED,
                        type: TxType.WITHDRAW,
                        amount: amount,
                        processed_at: new Date()
                    })
                    break
                case TxType.INVEST:
                    investor = util.decodeAddress(event.topics[1])
                    amount = util.tokenToEur(event.topics[2])
                    tx = await repo.update(hash, {
                        from_wallet: investor,
                        to_wallet: util.enforceAkPrefix(info.contractId),
                        input: poll.tx.callData,
                        state: TxState.MINED,
                        supervisor_status: SupervisorStatus.NOT_REQUIRED,
                        type: TxType.INVEST,
                        amount: amount,
                        processed_at: new Date()
                    })
                    break
                case TxType.START_REVENUE_PAYOUT:
                    amount = util.tokenToEur(event.topics[1])
                    tx = await repo.update(hash, {
                        from_wallet: info.callerId,
                        to_wallet: util.enforceAkPrefix(info.contractId),
                        input: poll.tx.callData,
                        state: TxState.MINED,
                        supervisor_status: SupervisorStatus.REQUIRED,
                        type: TxType.START_REVENUE_PAYOUT,
                        amount: amount,
                        processed_at: new Date()
                    })
                    console.log("saved start revenue payout", tx)
                    break
                case TxType.SHARE_PAYOUT:
                    investor = util.decodeAddress(event.topics[1])
                    share = util.tokenToEur(event.topics[2])
                    tx = await repo.update(hash, {
                        from_wallet: util.enforceAkPrefix(info.contractId),
                        to_wallet: investor,
                        input: poll.tx.callData,
                        state: TxState.MINED,
                        supervisor_status: SupervisorStatus.NOT_REQUIRED,
                        type: TxType.SHARE_PAYOUT,
                        amount: share,
                        processed_at: new Date()
                    })
                    break
                default:
                    continue
            }

            if (tx.supervisor_status == SupervisorStatus.REQUIRED) {
                switch (tx.type) {
                    case TxType.WALLET_CREATE:
                        if (tx.wallet_type == WalletType.USER) {
                            await client.supervisor().spend(300000000000000000, tx.wallet).catch(console.log)
                            console.log(`Transferred 0.3AE to user with wallet ${tx.wallet} (welcome gift)`)
                            await repo.update(tx.hash, { supervisor_status: SupervisorStatus.PROCESSED })
                        }
                        break
                    case TxType.APPROVE_INVESTMENT:
                        contract = util.enforceCtPrefix(tx.to_wallet)
                        result = await client.supervisor().contractCall(
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
                            batchPayout = await client.supervisor().contractCall(
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
        }
    } else {
        // handle failure
    }
}

async function performSecurityChecks(unpackedTx, txInfo) {
    switch (unpackedTx.txType) {
        case 'contractCallTx':
            await checkTxCaller(unpackedTx.tx.callerId)
            await checkTxCallee(unpackedTx.tx.contractId)
            break
        case 'contractCreateTx':
            await checkTxCaller(unpackedTx.tx.ownerId)
            await checkContractData(unpackedTx.tx, txInfo)
            break
        default:
            throw new Error(`Error posting transaction. Expected transaction of type contractCall or contractCreate but got ${unpackedTx.txType}. Aborting.`)
    }
}

async function checkTxCaller(callerId) {
    let coopAuthorityId = config.contracts.coop.owner
    let issuingAuthorityId = config.contracts.eur.owner
    
    // if caller is coop or token authority return normally
    if(callerId == coopAuthorityId || callerId == issuingAuthorityId) {
        return
    }

    // if caller not found in repo or caller's wallet still not mined exception is thrown
    return repo.findByWallet(callerId)
}

async function checkTxCallee(calleeId) {
    if (calleeId == contracts.getCoopAddress() || calleeId == contracts.getEurAddress()) { return }
    
    let walletActive = await isWalletActive(calleeId)
    if (walletActive) { return }

    throw new Error("Error posting transaction. Target contract not part of AMPnet platform!")
}

async function checkContractData(unpackedTx, txInfo) {
    switch(txInfo.type) {
        case TxType.ORG_CREATE:
            if (unpackedTx.code != contracts.getOrgCompiled().bytecode) {
                throw new Error(`Error posting Organization create transaction. Unexpected bytecode provided. Aborting.`)
            }
            if (txInfo.callData.arguments[0].value != contracts.getCoopAddress()) {
                throw new Error(`Error posting Organization create transaction. Attempt to create Organization with wrong Cooperative contract address as argument!`)
            }
            break
        case TxType.PROJ_CREATE:
            if (unpackedTx.code != contracts.getProjCompiled().bytecode) {
                throw new Error(`Error posting Project create transaction. Unexpected bytecode provided. Aborting.`)
            }
            let organizationAddress = txInfo.callData.arguments[0].value
            let isOrganizationActive = await isWalletActive(organizationAddress)
            if (!isOrganizationActive) {
                throw new Error(`Error posting Project create transaction. Attempt to create Project with wrong Organization contract address as argument!`)
            }
            break
        default:
            throw new Error(`Error posting transaction. Expected contract create transaction but got transaction of type ${type}. Aborting.`)
    }
    if (unpackedTx.amount != 0) {
        throw new Error(`Error posting Contract create transaction. Amount field has to be set to 0 but ${unpackedTx.acmount} provided!`)
    }
    if (unpackedTx.deposit != 0) {
        throw new Error(`Error posting Contract create transaction. Deposit field has to be set to 0 but ${unpackedTx.deposit} provided!`)
    }
}

async function getTransactionType(unpackedTx) {
    let callData
    let type
    switch(unpackedTx.txType) {
        case 'contractCallTx':
            contract = await contractUtil.getContractFromAddress(unpackedTx.tx.contractId)
            fn = (await codec.decodeDataByBytecode(contract.bytecode, unpackedTx.tx.callData)).function
            callData = await codec.decodeDataBySource(contract.source, fn, unpackedTx.tx.callData)
            type = enums.fromFunctionCall(fn, callData)
            break
        case 'contractCreateTx':
            switch (unpackedTx.tx.code) {
                case contracts.getOrgCompiled().bytecode:
                    callData = await codec.decodeDataBySource(contracts.orgSource, "init", unpackedTx.tx.callData)
                    type = TxType.ORG_CREATE
                    break
                case contracts.getProjCompiled().bytecode:
                    callData = await codec.decodeDataBySource(contracts.projSource, "init", unpackedTx.tx.callData)
                    type = TxType.PROJ_CREATE
                    break
                default:
                    throw new Error("Unknown transaction type. Aborting.")
            }
            break
        default: throw new Error("Unknown transaction type. Aborting.")
    }
    return {
        type: type,
        callData: callData
    }
}

async function persistTransaction(tx, hash, txInfo) {
    let record
    switch (txInfo.type) {
        case TxType.WALLET_CREATE:
            address = txInfo.callData.arguments[0].value
            record = {
                hash: hash,
                from_wallet: tx.callerId,
                to_wallet: address,
                input: tx.callData,
                state: TxState.PENDING,
                supervisor_status: SupervisorStatus.NOT_REQUIRED,
                type: TxType.WALLET_CREATE,
                created_at: new Date()
            }
            break
        case TxType.ORG_CREATE:
            ownerTxHash = (await repo.findByWallet(tx.ownerId)).hash
            record = {
                hash: hash,
                from_wallet: ownerTxHash,
                to_wallet: hash,
                input: tx.callData,
                state: TxState.PENDING,
                supervisor_status: SupervisorStatus.NOT_REQUIRED,
                type: TxType.ORG_CREATE,
                created_at: new Date()
            }
            break
        case TxType.DEPOSIT:
            toAddress = txInfo.callData.arguments[0].value
            amount = util.tokenToEur(txInfo.callData.arguments[1].value)
            toTxHash = (await repo.findByWallet(toAddress)).hash
            record = {
                hash: hash,
                from_wallet: tx.callerId,
                to_wallet: toTxHash,
                input: tx.callData,
                state: TxState.PENDING,
                supervisor_status: SupervisorStatus.NOT_REQUIRED,
                type: TxType.DEPOSIT,
                created_at: new Date(),
                amount: amount
            }
            break
        case TxType.APPROVE_USER_WITHDRAW:
            fromTxHash = (await repo.findByWallet(tx.callerId)).hash
            amount = util.tokenToEur(txInfo.callData.arguments[1].value)
            spender = txInfo.callData.arguments[0].value
            record = {
                hash: hash,
                from_wallet: fromTxHash,
                to_wallet: spender,
                input: tx.callData,
                state: TxState.PENDING,
                supervisor_status: SupervisorStatus.NOT_REQUIRED,
                type: TxType.APPROVE_USER_WITHDRAW,
                created_at: new Date(),
                amount: amount
            }
            break
        case TxType.APPROVE_INVESTMENT:
            fromTxHash = (await repo.findByWallet(tx.callerId)).hash
            amount = util.tokenToEur(txInfo.callData.arguments[1].value)
            project = txInfo.callData.arguments[0].value
            projectWalletTxHash = (await repo.findByWallet(project)).hash
            record = {
                hash: hash,
                from_wallet: fromTxHash,
                to_wallet: projectWalletTxHash,
                input: tx.callData,
                state: TxState.PENDING,
                supervisor_status: SupervisorStatus.REQUIRED,
                type: TxType.APPROVE_INVESTMENT,
                created_at: new Date(),
                amount: amount
            }
            break
        case TxType.PENDGING_ORG_WITHDRAW:
            break
        case TxType.PENDING_PROJ_WITHDRAW:
            break
        case TxType.WITHDRAW:
            withdrawFrom = txInfo.callData.arguments[0].value
            amount = util.tokenToEur(txInfo.callData.arguments[1].value)
            withdrawFromTxHash = (await repo.findByWallet(withdrawFrom)).hash
            record = {
                hash: hash,
                from_wallet: withdrawFromTxHash,
                to_wallet: tx.callerId,
                input: tx.callData,
                state: TxState.PENDING,
                supervisor_status: SupervisorStatus.NOT_REQUIRED,
                type: TxType.WITHDRAW,
                created_at: new Date(),
                amount: amount
            }
            break
        case TxType.INVEST:
            break
        case TxType.TRANSFER:
            break
        case TxType.ORG_ADD_MEMBER:
            break
        case TxType.PROJ_CREATE:
            ownerTxHash = (await repo.findByWallet(tx.ownerId)).hash
            record = {
                hash: hash,
                from_wallet: ownerTxHash,
                to_wallet: hash,
                input: tx.callData,
                state: TxState.PENDING,
                supervisor_status: SupervisorStatus.NOT_REQUIRED,
                type: TxType.PROJ_CREATE,
                created_at: new Date()
            }
            break
        case TxType.ORG_ACTIVATE:
            break
        case TxType.START_REVENUE_PAYOUT:
            callerTxHash = (await repo.findByWallet(tx.callerId)).hash
            projectTxHash = (await repo.findByWallet(util.enforceCtPrefix(tx.contractId))).hash
            revenue = util.tokenToEur(txInfo.callData.arguments[0].value)
            record = {
                hash: hash,
                from_wallet: callerTxHash,
                to_wallet: projectTxHash,
                input: tx.callData,
                state: TxState.PENDING,
                supervisor_status: SupervisorStatus.REQUIRED,
                type: TxType.START_REVENUE_PAYOUT,
                created_at: new Date()
            }
            break
        case TxType.REVENUE_PAYOUT:
            break
        case TxType.SHARE_PAYOUT:
            break
        case TxType.WITHDRAW_INVESTMENT:
            break
    }
    await repo.saveTransaction(record)
}

async function isWalletActive(wallet) {
    let address = await util.enforceAkPrefix(wallet)
    let result = await client.instance().contractCallStatic(
        contracts.coopSource, 
        contracts.getCoopAddress(), 
        enums.functions.coop.isWalletActive,
        [ address ]
    )
    return result.decode()
}

async function updateTransactionState(hash, txInfo) {
    let poll = await client.instance().poll(hash)
    console.log("poll", poll)
    let info = await client.instance().getTxInfo(hash)
    await repo.updateTransactionState(hash, info, txInfo)

    // handle special cases
    if (info.returnType == "ok") {
        if (txInfo.type == TxType.APPROVE && txInfo.callData.arguments[0].value != config.contracts.eur.owner) {

        }
    }
    // handle invest part of approve->invest procedure automatically (worker calls invest() on Project contract and stores tx in db)
    if (info.returnType == "ok") {
        if (txInfo.type == TxType.APPROVE_INVESTMENT) {
            handleApproveInvestmentTransaction(hash, info, txInfo)
        } else if (txInfo.type == TxType.START_REVENUE_PAYOUT) {
            handleRevenueSharesPayout(hash, info, txInfo)
        }
    }
}

async function handleApproveInvestmentTransaction(hash, info, txInfo) {
    let spender = txInfo.callData.arguments[0].value
    if (spender != config.contracts.eur.owner) {
        let spenderRecord = (await repo.findByWallet(spender))
        if (spenderRecord.wallet_type == WalletType.PROJECT) {
            let confirmInvestResult = await client.supervisor().contractCall(
                contracts.projSource,
                util.enforceCtPrefix(spenderRecord.wallet),
                enums.functions.proj.invest,
                [ info.callerId ]
            ).catch(error => {
                console.log(error)
            })
            if (confirmInvestResult.returnType == "ok") {
                repo.update(hash, { supervisor_status: SupervisorStatus.PROCESSED })
            }
        }
    }
}

async function handleRevenueSharesPayout(hash, info, txInfo) {
    var shouldPayoutAnotherBatch
    do {
        batchPayout = await client.supervisor().contractCall(
            contracts.projSource,
            info.contractId,
            enums.functions.proj.payoutRevenueSharesBatch,
            [ ]
        )
        console.log("batchPayout", batchPayout)
        console.log("batchPayout - log", batchPayout.result.log)
        shouldPayoutAnotherBatch = await batchPayout.decode()
        console.log("shouldPayoutAnotherBatch", shouldPayoutAnotherBatch)
    } while(shouldPayoutAnotherBatch)
}

module.exports = { postTransaction }