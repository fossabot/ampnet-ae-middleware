let environment = process.env.ENVIRONMENT || 'development';
let config = require('../knexfile.js')[environment];
let util = require('../ae/util')
let client = require('../ae/client')
let knex = require('knex')(config)
let contracts = require('../ae/contracts')

let { txState: TxState, txType: TxType, walletType: WalletType, supervisorStatus: SupervisorStatus } = require('../enums/enums')

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

async function walletExists(wallet) {
    return new Promise(resolve => {
        knex('transaction')
        .where({ wallet: wallet })
        .then(rows => {
            resolve(rows.length > 0)
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

async function update(hash, data) {
    return new Promise(resolve => {
        knex('transaction')
            .where({ hash: hash })
            .update(data)
            .then( _ => {
                resolve()
            })
            .catch(error => {
                console.log("save tx error", error)
            })
    })
}

async function saveHash(hash) {
    return new Promise(resolve => {
        knex('transaction')
            .insert({
                hash: hash,
                state: TxState.PENDING,
                supervisor_status: SupervisorStatus.NOT_REQUIRED, // TODO: rethink about this
                created_at: new Date()
            })
            .then(_ => {
                resolve()
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
                        if(record[0].type == TxType.ORG_CREATE) resolve(WalletType.ORGANIZATION)
                        else resolve(WalletType.PROJECT)
                        break
                    default:
                        throw new Error("Expected at max 1 row for searching org/proj creation with given wallet.")
                }
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

async function updateTransactionState(hash, info, txInfo) {
    let newStateJson = await getUpdatedStateJson(hash, info, txInfo)
    return new Promise(resolve => {
        knex('transaction')
            .where({ hash: hash })
            .update(newStateJson)
            .then(result => {
                resolve()
            })
    })
}

async function getUpdatedStateJson(hash, info, txInfo) {
    let newState
    if (info.returnType == "ok") {
        newState = TxState.MINED
    } else if (info.returnType == "revert" || info.returnType == "error") {
        newState = TxState.FAILED
    } else {
        throw new Error(`Invalid transaction update state. Expected ok/revert state but got ${info.returnType} for transaction with hash ${hash}`)
    }

    switch (txInfo.type) {
        case TxType.WALLET_CREATE:
            let wallet = txInfo.callData.arguments[0].value
            let bytecodeResponse = await client.instance().getContractByteCode(util.enforceCtPrefix(wallet)).catch(error => { })
            walletType = WalletType.USER
            if (typeof bytecodeResponse !== 'undefined') {
                switch (bytecodeResponse.bytecode) {
                    case contracts.getOrgCompiled().bytecode:
                        walletType = WalletType.ORGANIZATION
                        break
                    case contracts.getProjCompiled().bytecode:
                        walletType = WalletType.PROJECT
                        break
                    default:
                        throw new Error(`Wallet with address ${wallet} represents unknown Contract!`)
                }
            }

            let alreadyExists = await walletExists(wallet)
            if (!alreadyExists) {
                return {
                    state: newState,
                    processed_at: new Date(),
                    wallet: wallet,
                    wallet_type: walletType
                }
            }
        default:
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
    getRecord,
    walletExists,
    update,
    saveHash,
    getWalletTypeOrThrow
}