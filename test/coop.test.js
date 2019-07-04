let chai = require('chai')
let path = require('path')

let grpcServer = require('../grpc/server')
let grpcClient = require('./grpc/client')
let deployer = require('./ae/deployer')
let accounts = require('./ae/accounts')
let clients = require('./ae/clients')

let config = require('../env.json')[process.env.NODE_ENV || 'development']
let contracts = require('../ae/contracts')

describe('Cooperative contract tests', function() {

    before(async () => {
        await clients.init()
        await grpcServer.start()
        await grpcClient.start()
    })

    beforeEach(async() => {
        await deployer.deploy()
    })

    it('basic test', async () => {
        let addBobWalletTx = await grpcClient.generateAddWalletTx(accounts.coop.publicKey, accounts.bob.publicKey)
        console.log("addBobWalletTx", addBobWalletTx.tx)
        let addBobWalletTxSigned = await clients.coop().signTransaction(addBobWalletTx.tx)
        console.log("addBobWalletTxSigned", addBobWalletTxSigned)
        let addBobWalletTxPost = await grpcClient.postTransaction(addBobWalletTxSigned, 1)
        console.log(addBobWalletTxPost)
    })

    after(async() => {
        grpcServer.stop()
    })

})