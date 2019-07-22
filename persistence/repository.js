let environment = process.env.ENVIRONMENT || 'development';
let config = require('../knexfile.js')[environment];
let util = require('../ae/util')
let knex = require('knex')(config)

let { txState: TxState, txType: TxType } = require('../enums/enums')

async function getWalletOrThrow(txHash) {
    return new Promise(resolve => {
        knex('transaction')
        .where({ hash: txHash })
        .then( rows => {
            if (rows.length == 0) { throw new Error (`No wallet found for given txHash: ${txHash}`) }
            let record = rows[0]
            switch (record.type) {
                case TxType.WALLET_CREATE:
                case TxType.ORG_CREATE:
                case TxType.PROJ_CREATE: // TODO - project creating logic now different, apply changes
                    switch (record.state) {
                        case TxState.MINED:
                            resolve(record)
                            break
                        case TxState.PENDING:
                            throw new Error(`Wallet creation transaction with txHash ${txHash} not yet mined!`)
                        case TxState.FAILED:
                            throw new Error(`Wallet creation transaction with txHash ${txHash} failed! Create wallet again.`)
                    }
                    break
                default:
                    throw new Error(`Given txHash does not represent wallet creation transaction. Aborting.`)
            }
        })
    })
}

async function getRecord(txHash) {
    return new Promise(resolve => {
        knex('transaction')
        .where({ hash: txHash })
        .then(rows => {
            if (rows.length == 0) { throw new Error(`No record found for given txHash: ${txHash}`)}
            resolve(rows[0])
        })
    })
}

async function checkWalletOrThrow(wallet) {
    let akWallet = util.enforceAkPrefix(wallet)
    knex('transaction')
        .where({ wallet: akWallet })
        .then(rows => {
            if (rows.length == 0) { throw new Error(`No tx records found with wallet ${akWallet}`) }
            if (rows.length > 1) throw new Error(`Incosistent data. Multiple tx records found with wallet ${akWallet}`)
            console.log(rows[0])
        })
}

async function findByWallet(wallet) {
    let akWallet = util.enforceAkPrefix(wallet)
    return new Promise( resolve => {
        knex('transaction')
        .where({ wallet: akWallet })
        .then((rows) => {
            if (rows.length == 0) { throw new Error(`No tx records found with wallet ${akWallet}`) }
            if (rows.length > 1) throw new Error(`Incosistent data. Multiple tx records found with wallet ${akWallet}`)
            resolve(rows[0])
        })
    })
}

async function saveTransaction(tx) {
    return new Promise( resolve => {
        knex('transaction')
            .insert(tx)
            .then(() => {
                resolve()
            })
            .catch(error => {
                console.log("save tx error", error)
            })
    })
}

async function getAll() {
    return new Promise( resolve => {
        knex('transaction')
            .then(data => {
                resolve(data)
            })
    })
}

async function updateTransactionState(hash, info, type) {
    let newStateJson = await getUpdatedStateJson(hash, info, type)
    return new Promise(resolve => {
        knex('transaction')
            .where({ hash: hash })
            .update(newStateJson)
            .then(result => {
                resolve()
            })
    })
}

async function getUpdatedStateJson(hash, info, type) {
    let newState
    if (info.returnType == "ok") {
        newState = TxState.MINED
    } else if (info.returnType == "revert") {
        newState = TxState.FAILED
    } else {
        throw new Error(`Invalid transaction update state. Expected ok/revert state but got ${state} for transaction with hash ${hash}`)
    }

    if (type == 'ContractCreateTx') {
        return {
            state: newState,
            processed_at: new Date(),
            wallet: util.enforceAkPrefix(info.contractId)
        }
    } else {
        return {
            state: newState,
            processed_at: new Date()
        }
    }
}

module.exports = {
    getWalletOrThrow,
    checkWalletOrThrow,
    findByWallet,
    saveTransaction,
    getAll,
    updateTransactionState,
    getRecord
}