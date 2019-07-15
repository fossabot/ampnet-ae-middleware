let grpcServer = require('../grpc/server')
let grpcClient = require('./grpc/client')
let deployer = require('./ae/deployer')
let accounts = require('./ae/accounts')
let clients = require('./ae/clients')
let repo = require('../persistence/repository')
let enums = require('../enums/enums')

describe('Main tests', function() {

    before(async () => {
        await clients.init()
        await grpcServer.start()
        await grpcClient.start()
    })

    beforeEach(async() => {
        await deployer.deploy()
    })

    it('Happy path', async () => {        
        let addBobWalletTx = await grpcClient.generateAddWalletTx(accounts.coop.publicKey, accounts.bob.publicKey)
        let addBobWalletTxSigned = await clients.coop().signTransaction(addBobWalletTx.tx)
        let addBobWalletTxPost = await grpcClient.postTransaction(addBobWalletTxSigned, 0)
    })

    after(async() => {
        await grpcServer.stop()
    })

})