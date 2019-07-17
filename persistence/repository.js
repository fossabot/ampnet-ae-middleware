let environment = process.env.ENVIRONMENT || 'development';
let config = require('../knexfile.js')[environment];
let knex = require('knex')(config)
let client = require('../ae/client')

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
                case TxType.ORG_ADD_PROJECT: // TODO - project creating logic now different, apply changes
                    switch (record.state) {
                        case TxState.MINED:
                            resolve(record)
                        case TxState.PENDING:
                            throw new Error(`Wallet creation transaction with txHash ${txHash} not yet mined!`)
                        case TxState.FAILED:
                            throw new Error(`Wallet creation transaction with txHash ${txHash} failed! Create wallet again.`)
                    }
                default:
                    throw new Error(`Given txHash does not represent wallet creation transaction. Aborting.`)
            }
        })
    })
}

async function getRecord(txHash) {
    knex('transaction')
        .where({ hash: txHash })
        .then(rows => {
            if (rows.length == 0) { throw new Error(`No record found for given txHash: ${txHash}`)}
            return rows[0]
        })
}

async function checkWalletOrThrow(wallet) {
    knex('transaction')
        .where({ wallet: wallet })
        .then(rows => {
            if (rows.length == 0) { throw new Error(`No tx records found with wallet ${wallet}`) }
            if (rows.length > 1) throw new Error(`Incosistent data. Multiple tx records found with wallet ${wallet}`)
            console.log(rows[0])
        })

}

async function findByWallet(wallet) {
    return new Promise( resolve => {
        knex('transaction')
        .where({ wallet: wallet })
        .then((rows) => {
            if (rows.length == 0) { throw new Error(`No tx records found with wallet ${wallet}`) }
            if (rows.length > 1) throw new Error(`Incosistent data. Multiple tx records found with wallet ${wallet}`)
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

async function updateTransactionState(hash, state) {
    let newStateJson = await getUpdatedStateJson(hash, state)
    return new Promise(resolve => {
        knex('transaction')
            .where({ hash: hash })
            .update(newStateJson)
            .then(result => {
                resolve()
            })
    })
}

async function getUpdatedStateJson(hash, state) {
    let newState
    if (state == "ok") {
        newState = TxState.MINED
    } else if (state == "revert") {
        newState = TxState.FAILED
    } else {
        throw new Error(`Invalid transaction update state. Expected ok/revert state but got ${state} for transaction with hash ${hash}`)
    }

    // TODO: Add implementation for contract deployment address!

    return { state: newState }
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