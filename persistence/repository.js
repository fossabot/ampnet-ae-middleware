const environment = process.env.ENVIRONMENT || 'development';
const config = require('../knexfile.js')[environment];
const knex = require('knex')(config)

async function findByWallet(wallet) {
    return new Promise( resolve => {
        knex('transaction')
        .where({ wallet: wallet })
        .then((rows) => {
            if (rows.length == 0) { throw new Error(`No tx records found with wallet ${wallet}`) }
            if (rows.length > 1) throw new Error(`Incosistent data. Multiple tx records found with wallet ${wallet}`)
            resolve(rows[0])
        })
        .catch( error => {
            throw new Error(error)
        })
    })
}

module.exports = {
    findByWallet: findByWallet
}