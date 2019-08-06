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

async function getAll() { return getBy({}) }

async function getBy(constraints) {
    return new Promise( resolve => {
        knex('transaction')
            .where(constraints)
            .then(rows => {
                resolve(rows)
            })
    })
}

async function destroy() {
    return knex.destroy()
}

module.exports = {
    insert,
    truncate,
    destroy,
    getAll,
    getBy
}
