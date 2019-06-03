// requirements
const path = require('path')
const protoLoader = require('@grpc/proto-loader')
const grpc = require('grpc')

// services
const txSvc = require('./service/transaction')
const coopSvc = require('./service/coop')

// client
const client = require('./ae/client')

// knex
const environment = process.env.ENVIRONMENT || 'development'
const config = require('./knexfile.js')[environment];
const knex = require('knex')(config)

// grpc service definition
const protoDefinition = protoLoader.loadSync('./proto/blockchain-service.proto')
const packageDefinition = grpc.loadPackageDefinition(protoDefinition).com.ampnet.crowdfunding.proto

// main
function main() {
  // initialize Aeternity client
  client.init().then(() => {
    // initialize Grpc server
    const server = new grpc.Server();

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

    // gRPC server
    server.bind('localhost:50051', grpc.ServerCredentials.createInsecure());
    server.start();
    console.log('gRPC server running at http://127.0.0.1:50051');
  })


}

main();