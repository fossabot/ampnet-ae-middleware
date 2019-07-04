// requirements
const path = require('path')
const protoLoader = require('@grpc/proto-loader')
const grpc = require('grpc')

// config
let config = require('../env.json')[process.env.NODE_ENV || 'development']

// services
const txSvc = require('../service/transaction')
const coopSvc = require('../service/coop')

// client
const client = require('../ae/client')

// grpc service definition
const protoDefinition = protoLoader.loadSync(path.resolve(__dirname, '../proto/blockchain-service.proto'))
const packageDefinition = grpc.loadPackageDefinition(protoDefinition).com.ampnet.crowdfunding.proto

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
            // isWalletActive: isWalletActive,
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
            postTransaction: txSvc.postTx,
            postVaultTransaction: txSvc.postVaultTx
        });

        server.bind(config.grpc.url, grpc.ServerCredentials.createInsecure());
        return server.start();
    },
    stop: async function() {
        return server.forceShutdown()
    }
}




