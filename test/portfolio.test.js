let chai = require('chai');
let assert = chai.assert;

let grpcServer = require('../grpc/server')
let { TxType, TxState, SupervisorStatus, WalletType } = require('../enums/enums')

let clients = require('./ae/clients')
let grpcClient = require('./grpc/client')
let db = require('./util/db')


describe('Main tests', function() {

    beforeEach(async() => {
        await grpcServer.start()
        await grpcClient.start()
        await clients.init()
        await db.init()
    })

    afterEach(async() => {
        await grpcServer.stop()
    })

    it('Should fetch portfolio correctly', async () => {
        userWallet = "ak_user_wallet"
        userWalletHash = "th_user_hash"
        await db.insert({
            hash: userWalletHash,
            state: TxState.MINED,
            type: TxType.WALLET_CREATE,
            wallet: userWallet,
            wallet_type: WalletType.USER,
            created_at: new Date()
        })

        projectWallet = "ak_project_wallet"
        projectWalletHash = "th_project_hash"
        await db.insert({
            hash: projectWalletHash,
            state: TxState.MINED,
            type: TxType.WALLET_CREATE,
            wallet: projectWallet,
            wallet_type: WalletType.PROJECT,
            created_at: new Date()
        })
        
        let firstInvestmentAmount = 100
        let secondInvestmentAmount = 100
        await db.insert({
            hash: "random-hash-2",
            state: TxState.MINED,
            type: TxType.INVEST,
            from_wallet: userWallet,
            to_wallet: projectWallet,
            amount: firstInvestmentAmount,
            created_at: new Date()
        })
        await db.insert({
            hash: "random-hash-3",
            state: TxState.MINED,
            type: TxType.INVEST,
            from_wallet: userWallet,
            to_wallet: projectWallet,
            amount: secondInvestmentAmount,
            created_at: new Date()
        })

        let portfolio = await grpcClient.getPortfolio(userWalletHash)
        let portfolioCount = portfolio.length
        assert.strictEqual(portfolioCount, 1)
        assert.strictEqual(portfolio[0].projectTxHash, projectWalletHash)
        assert.equal(portfolio[0].amount, firstInvestmentAmount + secondInvestmentAmount)
    })

})