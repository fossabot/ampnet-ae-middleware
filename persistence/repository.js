const environment = process.env.ENVIRONMENT || 'development';
const config = require('../knexfile.js')[environment];
const knex = require('knex')(config)

async function checkWalletOrThrow(wallet) {
    knex('transaction')
        .where({ wallet: wallet })
        .then( rows => {
            if (rows.length == 0) { throw new Error(`No tx records found with wallet ${wallet}`) }
            if (rows.length > 1) throw new Error(`Incosistent data. Multiple tx records found with wallet ${wallet}`)

            let record = rows[0]
            console.log(record)
        })

}

async function findByWallet(wallet) {
    return new Promise( resolve => {
        knex('transaction')
        .where({ wallet: wallet })
        .then((rows) => {
            if (rows.length == 0) { throw new Error(`No tx records found with wallet ${wallet}`) }
            if (rows.length > 1) throw new Error(`Incosistent data. Multiple tx records found with wallet ${wallet}`)
            
            let record = rows[0]
            
            resolve(rows[0])
        })
    })
}

async function saveTransaction(tx) {
    console.log("saveTXXXXXXXXX", tx)
    return new Promise( resolve => {
        knex('transaction')
            .insert(tx)
            .then(() => {
                console.log("saved")
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

module.exports = {
    checkWalletOrThrow,
    findByWallet,
    saveTransaction,
    getAll
}