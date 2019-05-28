// requirements
const path = require('path');
const protoLoader = require('@grpc/proto-loader');
const grpc = require('grpc');

// knex
const environment = process.env.ENVIRONMENT || 'development';
const config = require('./knexfile.js')[environment];
const knex = require('knex')(config);

// grpc service definition
const protoPath = path.join(__dirname, '..', 'protos', 'blockchain-service.proto');
const protoDefinition = protoLoader.loadSync(protoPath);
// const productPackageDefinition = grpc.loadPackageDefinition(productProtoDefinition).product; ??

// main
function main() {
  const server = new grpc.Server();
  // gRPC services
//   server.addService(productPackageDefinition.ProductService.service, {
//   });

  // gRPC server
  server.bind('localhost:50051', grpc.ServerCredentials.createInsecure());
  server.start();
  console.log('gRPC server running at http://127.0.0.1:50051');
}

main();