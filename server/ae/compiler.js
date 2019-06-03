let config = require('../env.json')[process.env.NODE_ENV || 'development']
let fs = require('fs')
let path = require('path')
let axios = require('axios')

let coopSource = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'Coop.aes')).toString()
let eurSource = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'EUR.aes')).toString()
let orgSource = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'Organization.aes')).toString()
let projSource = fs.readFileSync(path.join(__dirname, '..', 'contracts', 'Project.aes')).toString()

module.exports = {
    coop: {
        encodeAddWallet: async function(wallet) {
            return axios.post(`${config.compiler.host}/encode-calldata`, {
                "function" : "add_wallet",
                "arguments" : [ wallet ],
                "source" : coopSource
            })
        }
    }
}