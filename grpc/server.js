// requirements
let path = require('path')
let protoLoader = require('@grpc/proto-loader')
let grpc = require('grpc')

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
        // Run database migrations
        await repo.runMigrations()

        // Initialize config
        await config.init()
        console.log("Config initialized")
        console.log(config.get())

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
        return server.start();
    },
    stop: async function() {
        return server.forceShutdown()
    }
}




