let path = require('path')
let protoLoader = require('@grpc/proto-loader')
let grpc = require('grpc')

let config = require('../../env.json')[process.env.NODE_ENV || 'development']

let client

module.exports = {
    start: async function() {
        let protoPath = path.resolve(__dirname, '../../proto/blockchain-service.proto');
        let protoDefinition = protoLoader.loadSync(protoPath);
        let packageDefinition = grpc.loadPackageDefinition(protoDefinition).com.ampnet.crowdfunding.proto;
        client = await new packageDefinition.BlockchainService(config.grpc.url, grpc.credentials.createInsecure());
        return client
    },
    generateAddWalletTx: async function(fromTxHash, wallet) {
        return new Promise(resolve => {
            client.generateAddWalletTx({
                fromTxHash: fromTxHash,
                wallet: wallet
            }, (err, result) => {
                if (err != null) {
                    throw new Error(err)
                } else {
                    resolve(result.tx)
                }
            })
        })
    },
    generateCreateOrganizationTx: async function(fromTxHash) {
        return new Promise(resolve => {
            client.generateCreateOrganizationTx({
                fromTxHash: fromTxHash
            }, (err, result) => {
                if (err != null) {
                    throw new Error(err)
                } else {
                    resolve(result.tx)
                }
            })
        })
    },
    isWalletActive: async function(walletTxHash) {
        return new Promise(resolve => {
            client.isWalletActive({
                walletTxHash: walletTxHash
            }, (err, result) => {
                if (err != null) {
                    console.log("err", err)
                    throw new Error(err)
                } else {
                    resolve(result.active)
                }
            })
        })
    },
    postTransaction: async function(data) {
        return new Promise(resolve => {
            client.postTransaction({
                data: data
            }, (err, result) => {
                if (err != null) {
                    throw new Error(err)
                } else {
                    resolve(result.txHash)
                }
            })
        })
    }
}