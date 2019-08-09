let { Universal: Ae } = require('@aeternity/aepp-sdk')
let contracts = require('../../ae/contracts')

let Environment = {
    LOCAL: "local",
    TESTNET: "testnet",
    MAINNET: "mainnet"
}

async function get() {
    process.env.NODE_ENV = process.env.NODE_ENV || Environment.LOCAL
    let node = {
        url: getNodeUrl(),
        compilerUrl: getCompilerUrl(),
        networkId: getNetworkId()
    }
    let supervisorKeypair = getSupervisorKeypair()
    let contracts = await getContracts(node, supervisorKeypair)
    let grpc = getGrpc()
    return {
        node: node,
        supervisor: supervisorKeypair,
        contracts: contracts,
        grpc: grpc
    }
}

function getNodeUrl() {
    if (process.env.NODE_URL) { return process.env.NODE_URL }
    switch (process.env.NODE_ENV) {
        case Environment.LOCAL: return "http://localhost:3001/"
        case Environment.TESTNET: return "https://sdk-testnet.aepps.com/"
        case Environment.MAINNET: return "https://sdk-mainnet.aepps.com"
    }
}

function getCompilerUrl() {
    if (process.env.COMPILER_URL) { return process.env.COMPILER_URL }
    switch (process.env.NODE_ENV) {
        case Environment.LOCAL: return "http://localhost:3080"
        case Environment.TESTNET: return "https://compiler.aepps.com"
        case Environment.MAINNET: return "https://compiler.aepps.com"
    }
}

function getNetworkId() {
    if (process.env.NETWORK_ID) { return process.env.NETWORK_ID }
    switch (process.env.NODE_ENV) {
        case Environment.LOCAL: return "ae_devnet"
        case Environment.TESTNET: return "ae_uat"
        case Environment.MAINNET: return "ae_mainnet"
    }
}

function getSupervisorKeypair() {
    let forgaeFirstKeypair = {
        publicKey: "ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk",
        secretKey: "7c6e602a94f30e4ea7edabe4376314f69ba7eaa2f355ecedb339df847b6f0d80575f81ffb0a297b7725dc671da0b1769b1fc5cbe45385c7b5ad1fc2eaf1d609d"
    }
    if (process.env.SUPERVISOR_PUBLIC_KEY && process.env.SUPERVISOR_PRIVATE_KEY) {
        return {
            publicKey: process.env.SUPERVISOR_PUBLIC_KEY,
            secretKey: process.env.SUPERVISOR_PRIVATE_KEY
        }
    }
    switch (process.env.NODE_ENV) {
        case Environment.LOCAL: return forgaeFirstKeypair
        case Environment.TESTNET: return forgaeFirstKeypair
        case Environment.MAINNET: throw new Error("When deploying to mainnet, supervisor keypair should be provided as environment vars!")
    }
}

async function getContracts(node, supervisorKeypair) {
    client = await Ae({
        url: node.url,
        keypair: supervisorKeypair,
        networkId: node.networkId,
        compilerUrl: node.compilerUrl
    })
    if (process.env.COOP_ADDRESS && process.env.EUR_ADDRESS) {
        console.log("Base contracts pre-deployed.")
        console.log(`Coop: ${process.env.COOP_ADDRESS}`)
        console.log(`EUR: ${process.env.EUR_ADDRESS}`)
        coopInstance = await client.getContractInstance(contracts.coopSource, {
            contractAddress: process.env.COOP_ADDRESS
        })
        coopOwner = await (await coopInstance.call('owner', [])).decode()
        eurInstance = await client.getContractInstance(contracts.eurSource, {
            contractAddress: process.env.EUR_ADDRESS
        })
        eurOwner = await (await eurInstance.call('owner', [])).decode()
        contracts.setCoopAddress(process.env.COOP_ADDRESS)
        contracts.setEurAddress(process.env.EUR_ADDRESS)
        console.log(`Fetched Coop owner: ${coopOwner}`)
        console.log(`Fetched EUR owner: ${eurOwner}`)
        return {
            coop: {
                address: process.env.COOP_ADDRESS,
                owner: coopOwner
            },
            eur: {
                address: process.env.EUR_ADDRESS,
                owner: eurOwner
            }
        }
    } else {
        console.log("Base contracts not deployed. Starting deployment.")
        
        coopInstance = await client.getContractInstance(contracts.coopSource)
        coop = await coopInstance.deploy()
        console.log(`Coop deployed at: ${coop.address}`)

        eurInstance = await client.getContractInstance(contracts.eurSource)
        eur = await eurInstance.deploy([coop.address])
        console.log(`EUR deployed at: ${eur.address}`)

        await coopInstance.call('set_token', [eur.address])
        console.log(`EUR token registered in Coop contract`)
 
        if (process.env.COOP_OWNER) {
            console.log(`Transferring Coop contract ownership to ${process.env.COOP_OWNER}`)
            coopInstance.call('transfer_ownership', [process.env.COOP_OWNER])
            console.log(`Ownership transferred.`)
        }

        if (process.env.EUR_OWNER) {
            console.log(`Transferring EUR contract ownership to ${process.env.EUR_OWNER}`)
            eurInstance.call('transfer_ownership', [process.env.EUR_OWNER])
            console.log(`Ownership transferred.`)
        }

        coopOwner = await (await coopInstance.call('owner', [])).decode()
        eurOwner = await (await eurInstance.call('owner', [])).decode()

        return {
            coop: {
                address: coop.address,
                owner: coopOwner
            },
            eur: {
                address: eur.address,
                owner: eurOwner
            }
        }
    }
}

function getGrpc() {
    if (process.env.GRPC_URL) {
        return {
            url: process.env.GRPC_URL
        }
    }
    return {
        url: "localhost:50055"
    }
}

// function get() { return config }

module.exports = { get }