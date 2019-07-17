let grpcServer = require('../grpc/server')
let grpcClient = require('./grpc/client')
let deployer = require('./ae/deployer')
let accounts = require('./ae/accounts')
let clients = require('./ae/clients')

let client = require('../ae/client')
let contracts = require('../ae/contracts')
const config = require('../env.json')[process.env.NODE_ENV || 'development']

let repo = require('../persistence/repository')
let util = require('./ae/util')
let { grpcTxType: GrpcTxType } = require('../enums/enums')

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
        let contractInstance = await client.instance().getContractInstance(contracts.coopSource, {
            contractAddress: config.contracts.coop.address
        })
        let walletActive = await contractInstance.call("is_wallet_active", [ config.contracts.coop.owner ])
        console.log("wallet active", walletActive)
        // let isWalletActive = await contractInstance.is_wallet_active([config.contracts.coop.owner])
        // console.log("isWalletActive", isWalletActive)

        // let addBobWalletTx = await grpcClient.generateAddWalletTx(accounts.coop.publicKey, accounts.bob.publicKey)
        // let addBobWalletTxSigned = await clients.coop().signTransaction(addBobWalletTx.tx)
        // let addBobWalletTxPost = await grpcClient.postTransaction(addBobWalletTxSigned, GrpcTxType.WALLET_CREATE)
        // await util.waitMined(addBobWalletTxPost)
        // let bobWalletActive = await grpcClient.isWalletActive(addBobWalletTxPost.txHash)
        // console.log(bobWalletActive)
    })

    // it('Should fail if tx type is wrong', async () => {

    // })

    // it('Should fail if caller not registered on platform', async () => {

    // })

    // it('Should fail if callee not one of ampnet smart contracts', async () => {

    // })

    // it('Should fail if caller tries to generate some transaction but his wallet not yet active (not mined)', async () => {

    // })

    after(async() => {
        await grpcServer.stop()
    })

})