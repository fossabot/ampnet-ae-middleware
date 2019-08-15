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
let protoDefinition = protoLoader.loadSync(path.resolve(__dirname, '../proto/blockchain_service.proto'))
let packageDefinition = grpc.loadPackageDefinition(protoDefinition).com.ampnet.crowdfunding.proto

// holds running grpc server instance
let grpcServer
let httpServer

module.exports = {
    start: async function() {
        // Initialize config
        console.log("Initializing config")
        await config.init()
        console.log("Config initialized")
        console.log(config.get())

        // Initialize database and run migrations
        console.log("Initializing repo")
        repo.init()
        console.log("Repo initialized")
        console.log("Running migrations")
        await repo.runMigrations()
        console.log("Migrations processed")
        // Initiallize Aeternity client
        await client.init()
        await contracts.compile()

        // Initialize Grpc server
        grpcServer = new grpc.Server();

        // gRPC services
        grpcServer.addService(packageDefinition.BlockchainService.service, {
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

        grpcServer.bind(config.get().grpc.url, grpc.ServerCredentials.createInsecure());
        await grpcServer.start()

        let expr = express()
        expr.use(actuator())
        httpServer = expr.listen(config.get().http.port)
    },
    stop: async function() {
        await httpServer.close()
        return grpcServer.forceShutdown()
    }
}




