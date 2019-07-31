// requirements
let path = require('path')
let protoLoader = require('@grpc/proto-loader')
let grpc = require('grpc')

// config
let config = require('../env.json')[process.env.NODE_ENV || 'development']

// services
let txSvc = require('../service/transaction')
let coopSvc = require('../service/coop')
let eurSvc = require('../service/eur')
let orgSvc = require('../service/org')
let projSvc = require('../service/project')

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
        // Initiallize Aeternity client
        await client.init()
        await contracts.compile()

        // initialize Grpc server
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
            // generateCancelPendingInvestmentTx: generateCancelPendingInvestmentTx,
            // generateTransferTx: generateTransferTx,
            // activateOrganization: activateOrganization,
            // generateWithdrawOrganizationFundsTx: generateWithdrawOrganizationFundsTx,
            // generateAddOrganizationMemberTx: generateAddOrganizationMemberTx,
            // generateAddOrganizationProjectTx: generateAddOrganizationProjectTx,
            // isOrganizationVerified: isOrganizationVerified,
            // getAllOrganizationProjects: getAllOrganizationProjects,
            // getAllOrganizationMembers: getAllOrganizationMembers,
            // generateConfirmInvestmentTx: generateConfirmInvestmentTx,
            generateStartRevenueSharesPayoutTx: projSvc.startRevenueSharesPayout,
            // generatePayoutRevenueSharesTx: generatePayoutRevenueSharesTx,
            // generateWithdrawInvestmentTx: generateWithdrawInvestmentTx,
            // generateWithdrawProjectFundsTx: generateWithdrawProjectFundsTx,
            // getProjectMaxInvestmentPerUser: getProjectMaxInvestmentPerUser,
            // getProjectMinInvestmentPerUser: getProjectMinInvestmentPerUser,
            // getProjectInvestmentCap: getProjectInvestmentCap,
            // getProjectCurrentTotalInvestment: getProjectCurrentTotalInvestment,
            // getProjectTotalInvestmentForUser: getProjectTotalInvestmentForUser,
            // isProjectCompletelyFunded: isProjectCompletelyFunded,
            postTransaction: txSvc.postTransaction
        });

        server.bind(config.grpc.url, grpc.ServerCredentials.createInsecure());
        return server.start();
    },
    stop: async function() {
        return server.forceShutdown()
    }
}




