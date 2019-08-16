let config = require('../config')
let util = require('../ae/util')
let err = require('../error/errors')
let ErrorType = err.type

let { TxState, TxType, WalletType } = require('../enums/enums')

let knex

function init() {
    knex = require('knex')(config.get().db)
}

async function findByHashOrThrow(txHash) {
    return new Promise((resolve, reject) => {
        knex('transaction')
        .where({ hash: txHash })
        .then(rows => {
            if (rows.length == 0) { reject(err.generate(ErrorType.WALLET_NOT_FOUND)) }
            else {
                let record = rows[0]
                switch (record.type) {
                    case TxType.WALLET_CREATE:
                        switch (record.state) {
                            case TxState.MINED:
                                resolve(record)
                                break
                            case TxState.PENDING:
                                reject(err.generate(ErrorType.WALLET_CREATION_PENDING))
                                break
                            case TxState.FAILED:
                                reject(err.generate(ErrorType.WALLET_CREATION_FAILED))
                        }
                        break
                    default:
                        reject(err.generate(ErrorType.GENERIC_ERROR, "Given hash does not represent wallet creation transaction!"))
                }
            }

        })
    })
}

async function findByWalletOrThrow(wallet) {
    let akWallet = util.enforceAkPrefix(wallet)
    return new Promise( (resolve, reject) => {
        knex('transaction')
        .where({ wallet: akWallet })
        .then((rows) => {
            if (rows.length == 0) { reject(err.generate(ErrorType.WALLET_NOT_FOUND)) }
            else if (rows.length > 1) { reject(err.generate(ErrorType.GENERIC_ERROR, `Incosistent data. Multiple tx records found with wallet ${akWallet}`)) }
            else {
                record = rows[0]
                switch (record.state) {
                    case TxState.MINED:
                        resolve(record)
                    case TxState.PENDING:
                        reject(err.generate(ErrorType.WALLET_CREATION_PENDING))
                    case TxState.FAILED:
                        reject(err.generate(ErrorType.WALLET_CREATION_FAILED))
                }
            }
        })
    })
}

async function getWalletTypeOrThrow(address) {
    return new Promise(resolve => {
        knex('transaction')
            .where('type', 'in', [TxType.ORG_CREATE, TxType.PROJ_CREATE])
            .andWhere({to_wallet: address})
            .then(rows => {
                switch (rows.length) {
                    case 0:
                        resolve(WalletType.USER)
                        break
                    case 1:
                        if(rows[0].type == TxType.ORG_CREATE) resolve(WalletType.ORGANIZATION)
                        else resolve(WalletType.PROJECT)
                        break
                    default:
                        throw new Error("Expected at max 1 row for searching org/proj creation with given wallet.")
                }
            })
    })
}

async function saveHash(hash) {
    return new Promise(resolve => {
        knex('transaction')
            .insert({
                hash: hash,
                state: TxState.PENDING,
                created_at: new Date()
            })
            .then(_ => {
                resolve()
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

async function get(filter) {
    return new Promise(resolve => {
        knex('transaction')
            .where(filter)
            .then(records => {
                resolve(records)
            })
            .catch(error => {
                console.log("save tx error", error)
            })
    })
}

async function getUserTransactions(wallet) {
    return new Promise(resolve => {
        knex('transaction')
            .where({ from_wallet: wallet })
            .orWhere({ to_wallet: wallet })
            .then(records => {
                resolve(records)
            })
            .catch(error => {
                console.log("get user transactions error", error)
            })
    })
}

async function update(hash, data) {
    return new Promise(resolve => {
        knex('transaction')
            .returning('*')
            .where({ hash: hash })
            .update(data)
            .then(rows => {
                resolve(rows[0])
            })
            .catch(error => {
                console.log("save tx error", error)
            })
    })
}

async function runMigrations() {
    return knex.migrate.latest()
}

module.exports = {
    findByHashOrThrow,
    findByWalletOrThrow,
    getWalletTypeOrThrow,
    get,
    getUserTransactions,
    saveTransaction,
    update,
    saveHash,
    runMigrations,
    init
}