const chai = require('chai');
const assert = chai.assert;

let grpcServer = require('../grpc/server')
let grpcClient = require('./grpc/client')
let deployer = require('./ae/deployer')
let accounts = require('./ae/accounts')
let clients = require('./ae/clients')

let client = require('../ae/client')

let repo = require('../persistence/repository')
let util = require('./util/util')
let { grpcTxType: GrpcTxType } = require('../enums/enums')

const { TxBuilder: TxBuilder } = require('@aeternity/aepp-sdk')


describe('Main tests', function() {

    before(async () => {
        await clients.init()
        await grpcServer.start()
        await grpcClient.start()
    })

    beforeEach(async() => {
        await deployer.deploy()
        await util.wipeDb()
    })

    it('Should be possible to run one complete life-cycle of a project to be funded', async () => {
        let addBobWalletTx = await grpcClient.generateAddWalletTx(accounts.bob.publicKey)
        let addBobWalletTxSigned = await clients.coop().signTransaction(addBobWalletTx)
        let addBobWalletTxHash = await grpcClient.postTransaction(addBobWalletTxSigned)
        await util.waitMined(addBobWalletTxHash)

        let createOrgTx = await grpcClient.generateCreateOrganizationTx(addBobWalletTxHash)
        let createOrgTxSigned = await clients.bob().signTransaction(createOrgTx)
        let createOrgTxHash = await grpcClient.postTransaction(createOrgTxSigned)
        await util.waitMined(createOrgTxHash)

        let addOrgWalletTx = await grpcClient.generateAddWalletTx(createOrgTxHash)
        let addOrgWalletTxSigned = await clients.coop().signTransaction(addOrgWalletTx)
        let addOrgWalletTxHash = await grpcClient.postTransaction(addOrgWalletTxSigned)
        await util.waitMined(addOrgWalletTxHash)

        let mintToBobTx = await grpcClient.generateMintTx(addBobWalletTxHash, 10000)
        let mintToBobTxSigned = await clients.eur().signTransaction(mintToBobTx)
        let mintToBobTxHash = await grpcClient.postTransaction(mintToBobTxSigned)
        await util.waitMined(mintToBobTxHash)

        // let approveBobWithdrawTx = await grpcClient.generateApproveWithdrawTx(addBobWalletTxHash, 1000)
        // let approveBobWithdrawTxSigned = await clients.bob().signTransaction(approveBobWithdrawTx)
        // let approveBobWithdrawTxHash = await grpcClient.postTransaction(approveBobWithdrawTxSigned)
        // await util.waitMined(approveBobWithdrawTxHash)

        // let burnFromBobTx = await grpcClient.generateBurnFromTx(addBobWalletTxHash)
        // let burnFromBobTxSigned = await clients.eur().signTransaction(burnFromBobTx)
        // let burnFromBobTxHash = await grpcClient.postTransaction(burnFromBobTxSigned)
        // await util.waitMined(burnFromBobTxHash)

        let createProjTx = await grpcClient.generateCreateProjectTx(
            addBobWalletTxHash,
            addOrgWalletTxHash,
            10000,                              // min 100$ per user
            100000,                             // max 1000$ per user
            100000,                             // 1000$ investment cap
            util.currentTimeWithDaysOffset(10)  // expires in 10 days
        )
        let createProjTxSigned = await clients.bob().signTransaction(createProjTx)
        let createProjTxHash = await grpcClient.postTransaction(createProjTxSigned)
        await util.waitMined(createProjTxHash)
        
        let addProjWalletTx = await grpcClient.generateAddWalletTx(createProjTxHash)
        let addProjWalletTxSigned = await clients.coop().signTransaction(addProjWalletTx)
        let addProjWalletTxHash = await grpcClient.postTransaction(addProjWalletTxSigned)
        await util.waitMined(addProjWalletTxHash)

        let investTx = await grpcClient.generateInvestTx(addBobWalletTxHash, addProjWalletTxHash, 10000)
        let investTxSigned = await clients.bob().signTransaction(investTx)
        let investTxHash = await grpcClient.postTransaction(investTxSigned)
        await util.waitMined(investTxHash)

        let records = await repo.getAll()
        console.log(records)
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