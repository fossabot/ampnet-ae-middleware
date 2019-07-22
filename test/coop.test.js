const chai = require('chai');
const assert = chai.assert;

let grpcServer = require('../grpc/server')
let grpcClient = require('./grpc/client')
let deployer = require('./ae/deployer')
let accounts = require('./ae/accounts')
let clients = require('./ae/clients')

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
        let addBobWalletTx = await grpcClient.generateAddWalletTx(accounts.coop.publicKey, accounts.bob.publicKey)
        let addBobWalletTxSigned = await clients.coop().signTransaction(addBobWalletTx)
        let addBobWalletTxHash = await grpcClient.postTransaction(addBobWalletTxSigned)
        await util.waitMined(addBobWalletTxHash)

        let createOrgTx = await grpcClient.generateCreateOrganizationTx(addBobWalletTxHash)
        let createOrgTxSigned = await clients.bob().signTransaction(createOrgTx)
        let createOrgTxHash = await grpcClient.postTransaction(createOrgTxSigned)
        await util.waitMined(createOrgTxHash)

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