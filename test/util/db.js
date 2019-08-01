let environment = process.env.ENVIRONMENT || 'development';
let config = require('../../knexfile.js')[environment];
let knex = require('knex')(config)

async function truncate() {
    return new Promise(resolve => {
        knex.raw('TRUNCATE TABLE transaction CASCADE').then(_ => {
            resolve()
        })
    })
}

async function insert(data) {
    return new Promise(resolve => {
        knex('transaction')
            .insert(data)
            .then(_ => {
                resolve()
            })
    })
}

module.exports = {
    insert,
    truncate
}
