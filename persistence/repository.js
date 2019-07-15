let environment = process.env.ENVIRONMENT || 'development';
let config = require('../knexfile.js')[environment];
let knex = require('knex')(config)

let TxState = require('../enums/enums').txState

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

async function updateTransactionState(hash, state) {
    let newState
    if (state == "ok") {
        newState = TxState.MINED
    } else if (state == "revert") {
        newState = TxState.FAILED
    } else {
        throw new Error(`Invalid transaction update state. Expected ok/revert state but got ${state} for transaction with hash ${hash}`)
    }
    return new Promise(resolve => {
        knex('transaction')
            .where({ hash: hash })
            .update({ state: newState })
            .then(result => {
                resolve()
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

module.exports = {
    checkWalletOrThrow,
    findByWallet,
    saveTransaction,
    getAll,
    updateTransactionState
}