let chai = require('chai')
let path = require('path')

const { ChainNode: ChainNode } = require('@aeternity/aepp-sdk') 

let grpcServer = require('../grpc/server')
let grpcClient = require('./grpc/client')
let deployer = require('./ae/deployer')
let accounts = require('./ae/accounts')
let clients = require('./ae/clients')
const repo = require('../persistence/repository')
const enums = require('../enums/enums')

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
        console.log("txTypeValues", enums.txTypeValues)
        console.log("txStateValues", enums.txStateValues)
        
        let node = await ChainNode({
            url: config.node.host
        })
        console.log(node)
        let addBobWalletTx = await grpcClient.generateAddWalletTx(accounts.coop.publicKey, accounts.bob.publicKey)
        console.log("addBobWalletTx", addBobWalletTx.tx)
        let addBobWalletTxSigned = await clients.coop().signTransaction(addBobWalletTx.tx)
        console.log("addBobWalletTxSigned", addBobWalletTxSigned)
        let addBobWalletTxPost = await grpcClient.postTransaction(addBobWalletTxSigned, 0)

        console.log(addBobWalletTxPost)
        let status = await node.poll(addBobWalletTxPost.txHash)
        console.log("status", status)

        let records = await repo.getAll()
        console.log("records", records)
    })

    after(async() => {
        grpcServer.stop()
    })

})