let chai = require('chai')
let path = require('path')
let protoLoader = require('@grpc/proto-loader')
let grpc = require('grpc')

let server = require('../grpc/server')
let config = require('../env.json')[process.env.NODE_ENV || 'development']

describe('Cooperative contract tests', function() {

    let client

    before(async () => {
        // start the grpc server
        console.log("starting grpc server")
        await server.start()
        console.log("grpc server started")
        
        // start the grpc client
        const productProtoPath = path.resolve(__dirname, '../proto/blockchain-service.proto');
        const productProtoDefinition = protoLoader.loadSync(productProtoPath);
        const productPackageDefinition = grpc.loadPackageDefinition(productProtoDefinition).com.ampnet.crowdfunding.proto;
        const client = new productPackageDefinition.BlockchainService('localhost:50051', grpc.credentials.createInsecure());
        console.log("grpc client started")
    })

    beforeEach(async() => {

    })

    it('basic test', function () {
        console.log("yo")
    })

    after(async() => {
        console.log("stopping grpc server")
        server.stop()
        console.log("grpc server stopped")
    })

})