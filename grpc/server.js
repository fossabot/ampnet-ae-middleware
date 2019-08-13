// requirements
let path = require('path')
let protoLoader = require('@grpc/proto-loader')
let grpc = require('grpc')
let express = require('express')
let actuator = require('express-actuator')

// config
let config = require('../config')

// services
let txSvc = require('../service/transaction')
let coopSvc = require('../service/coop')
let eurSvc = require('../service/eur')
let orgSvc = require('../service/org')
let projSvc = require('../service/project')

// repository
let repo = require('../persistence/repository')

// client
let client = require('../ae/client')

// contracts
let contracts = require('../ae/contracts')

// grpc service definition
let protoDefinition = protoLoader.loadSync(path.resolve(__dirname, '../proto/blockchain-service.proto'))
let packageDefinition = grpc.loadPackageDefinition(protoDefinition).com.ampnet.crowdfunding.proto

// holds running grpc server instance
let server

module.exports = {
    start: async function() {
        // Initialize config
        console.log("initializing config")
        await config.init()
        console.log("Config initialized")
        console.log(config.get())

        // Initialize database and run migrations
        repo.init()
        await repo.runMigrations()

        // Initiallize Aeternity client
        await client.init()
        await contracts.compile()

        // Initialize Grpc server
        server = new grpc.Server();

        // gRPC services
        server.addService(packageDefinition.BlockchainService.service, {
            generateAddWalletTx: coopSvc.addWallet,
            isWalletActive: coopSvc.walletActive,
            generateMintTx: eurSvc.mint,
            generateBurnFromTx: eurSvc.burnFrom,
            generateApproveWithdrawTx: eurSvc.approveWithdraw,
            getBalance: eurSvc.balance,
            generateCreateOrganizationTx: orgSvc.createOrganization,
            generateCreateProjectTx: projSvc.createProject,
            generateInvestTx: eurSvc.invest,
            generateStartRevenueSharesPayoutTx: projSvc.startRevenueSharesPayout,
            postTransaction: txSvc.postTransaction
        });

        server.bind(config.get().grpc.url, grpc.ServerCredentials.createInsecure());
        await server.start()

        expr = express()
        expr.use(actuator())
        expr.listen(50056, "localhost")
    },
    stop: async function() {
        return server.forceShutdown()
    }
}




