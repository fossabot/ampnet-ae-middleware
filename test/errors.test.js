const chai = require('chai');
const assert = chai.assert;

let grpcClient = require('./grpc/client')
let deployer = require('./ae/deployer')
let accounts = require('./ae/accounts')
let clients = require('./ae/clients')
let util = require('./util/util')

let grpcServer = require('../grpc/server')
let client = require('../ae/client')
let codec = require('../ae/codec')
let contracts = require('../ae/contracts')
let repo = require('../persistence/repository')


let err = require('../enums/errors')
let ErrorType = err.type

describe('Error handling tests', function() {

    before(async () => {
        await clients.init()
        await grpcServer.start()
        await grpcClient.start()
    })

    beforeEach(async() => {
        await deployer.deploy()
        await util.wipeDb()
    })

    it('Should fail with correct error message if transaction broadcasted but not signed', async () => {
        addBobWalletTx = await grpcClient.generateAddWalletTx(accounts.bob.publicKey)
        errResponse = await grpcClient.postTransaction(addBobWalletTx)
        assert.strictEqual(errResponse.details, err.generate(ErrorType.TX_NOT_SIGNED).message)
    }) 

    it('Should fail with correct error message if invalid contract is called', async () => {
        addBobWalletTx = await grpcClient.generateAddWalletTx(accounts.bob.publicKey)
        addBobWalletTxSigned = await clients.coop().signTransaction(addBobWalletTx)
        addBobWalletTxHash = await grpcClient.postTransaction(addBobWalletTxSigned)
        await util.waitMined(addBobWalletTxHash)

        randomContractId = 'ct_RYkcTuYcyxQ6fWZsL2G3Kj3K5WCRUEXsi76bPUNkEsoHc52Wp'
        randomCallData = await codec.org.encodeCreateOrganization()
        randomContractCallTx = await client.instance().contractCallTx({
            callerId: accounts.bob.publicKey,
            contractId: randomContractId,
            abiVersion: 1,
            amount: 0,
            gas: 10000,
            callData:  randomCallData
        })
        randomContractCallTxSigned = await clients.bob().signTransaction(randomContractCallTx)
    
        errResponse = await grpcClient.postTransaction(randomContractCallTxSigned)
        assert.strictEqual(errResponse.details, err.generate(ErrorType.TX_INVALID_CONTRACT_CALLED).message)
    })

    it('Should fail with correct error message if Org is created with invalid Coop as argument', async () => {
        addBobWalletTx = await grpcClient.generateAddWalletTx(accounts.bob.publicKey)
        addBobWalletTxSigned = await clients.coop().signTransaction(addBobWalletTx)
        addBobWalletTxHash = await grpcClient.postTransaction(addBobWalletTxSigned)
        await util.waitMined(addBobWalletTxHash)

        badCoopAddr = 'ct_RYkcTuYcyxQ6fWZsL2G3Kj3K5WCRUEXsi76bPUNkEsoHc52Wp'
        callData = await contracts.getOrgCompiled().encodeCall("init", [ badCoopAddr ])
        badTx = await client.instance().contractCreateTx({
            ownerId: accounts.bob.publicKey,
            code: contracts.getOrgCompiled().bytecode,
            vmVersion: 3,
            abiVersion: 1,
            deposit: 0,
            amount: 0,
            gas: 50000,
            callData: callData
        })
        console.log("badTx", badTx.tx)
        badTxSigned = await clients.bob().signTransaction(badTx.tx)
        console.log("badTxSigned", badTxSigned)
        errResponse = await grpcClient.postTransaction(badTxSigned)
        assert.strictEqual(errResponse.details, err.generate(ErrorType.GROUP_INVALID_COOP_ARG).message)
    }) 

    it('Should fail with correct error message if Proj is created with invalid Org as argument', async () => {
        addBobWalletTx = await grpcClient.generateAddWalletTx(accounts.bob.publicKey)
        addBobWalletTxSigned = await clients.coop().signTransaction(addBobWalletTx)
        addBobWalletTxHash = await grpcClient.postTransaction(addBobWalletTxSigned)
        await util.waitMined(addBobWalletTxHash)

        badOrgAddr = 'ct_RYkcTuYcyxQ6fWZsL2G3Kj3K5WCRUEXsi76bPUNkEsoHc52Wp'
        callData = await codec.proj.encodeCreateProject(
            badOrgAddr,
            '1000',
            '1000000',
            '1000000',
            '999999999'
        )
        badTx = await client.instance().contractCreateTx({
            ownerId: accounts.bob.publicKey,
            code: contracts.getProjCompiled().bytecode,
            vmVersion: 3,
            abiVersion: 1,
            deposit: 0,
            amount: 0,
            gas: 50000,
            callData: callData
        })
        badTxSigned = await clients.bob().signTransaction(badTx.tx)

        errResponse = await grpcClient.postTransaction(badTxSigned)
        assert.strictEqual(errResponse.details, err.generate(ErrorType.PROJ_INVALID_GROUP_ARG).message)
    })



    after(async() => {
        await grpcServer.stop()
    })

})