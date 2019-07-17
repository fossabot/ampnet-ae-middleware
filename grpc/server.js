// requirements
let path = require('path')
let protoLoader = require('@grpc/proto-loader')
let grpc = require('grpc')

// config
let config = require('../env.json')[process.env.NODE_ENV || 'development']

// services
let txSvc = require('../service/transaction')
let coopSvc = require('../service/coop')

// client
let client = require('../ae/client')

// grpc service definition
let protoDefinition = protoLoader.loadSync(path.resolve(__dirname, '../proto/blockchain-service.proto'))
let packageDefinition = grpc.loadPackageDefinition(protoDefinition).com.ampnet.crowdfunding.proto

// holds running grpc server instance
let server

module.exports = {
    start: async function() {
        // Initiallize Aeternity client
        await client.init()

        // initialize Grpc server
        server = new grpc.Server();

        // gRPC services
        server.addService(packageDefinition.BlockchainService.service, {
            generateAddWalletTx: coopSvc.addWallet,
            // generateAddOrganizationTx: generateAddOrganizationTx,
            // getOrganizations: getOrganizations,
            isWalletActive: coopSvc.walletActive,
            // organizationExists: organizationExists,
            // generateMintTx: generateMintTx,
            // generateBurnFromTx: generateBurnFromTx,
            // generateApproveWithdrawTx: generateApproveWithdrawTx,
            // generateInvestmentTx: generateInvestmentTx,
            // generateCancelPendingInvestmentTx: generateCancelPendingInvestmentTx,
            // getBalance: getBalance,
            // generateTransferTx: generateTransferTx,
            // activateOrganization: activateOrganization,
            // generateWithdrawOrganizationFundsTx: generateWithdrawOrganizationFundsTx,
            // generateAddOrganizationMemberTx: generateAddOrganizationMemberTx,
            // generateAddOrganizationProjectTx: generateAddOrganizationProjectTx,
            // isOrganizationVerified: isOrganizationVerified,
            // getAllOrganizationProjects: getAllOrganizationProjects,
            // getAllOrganizationMembers: getAllOrganizationMembers,
            // generateConfirmInvestmentTx: generateConfirmInvestmentTx,
            // generateStartRevenuePayoutTx: generateStartRevenuePayoutTx,
            // generatePayoutRevenueSharesTx: generatePayoutRevenueSharesTx,
            // generateWithdrawInvestmentTx: generateWithdrawInvestmentTx,
            // generateWithdrawProjectFundsTx: generateWithdrawProjectFundsTx,
            // getProjectMaxInvestmentPerUser: getProjectMaxInvestmentPerUser,
            // getProjectMinInvestmentPerUser: getProjectMinInvestmentPerUser,
            // getProjectInvestmentCap: getProjectInvestmentCap,
            // getProjectCurrentTotalInvestment: getProjectCurrentTotalInvestment,
            // getProjectTotalInvestmentForUser: getProjectTotalInvestmentForUser,
            // isProjectCompletelyFunded: isProjectCompletelyFunded,
            postTransaction: txSvc.postTx
        });

        server.bind(config.grpc.url, grpc.ServerCredentials.createInsecure());
        return server.start();
    },
    stop: async function() {
        return server.forceShutdown()
    }
}




