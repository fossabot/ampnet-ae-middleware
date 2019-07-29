let repo = require('../persistence/repository')
let contracts = require('../ae/contracts')
let client = require('../ae/client')
let util = require('../ae/util')
let { txType } = require('../enums/enums')

async function getContractFromAddress(address) {
    if (address == contracts.getCoopAddress()) {
        return {
            source: contracts.coopSource,
            bytecode: contracts.getCoopCompiled().bytecode
        }
    } else if (address == contracts.getEurAddress()) {
        return {
            source: contracts.eurSource,
            bytecode: contracts.getEurCompiled().bytecode
        }
    } else {
        let bytecodeResponse = await client.instance().getContractByteCode(address).catch(error => { })
        if (typeof bytecodeResponse === 'undefined') {
            throw new Error(`Could not fetch bytecode for contract ${contractAddress}`)
        }
        switch (bytecodeResponse.bytecode) {
            case contracts.getOrgCompiled().bytecode:
                return {
                    source: contracts.orgSource,
                    bytecode: contracts.getOrgCompiled().bytecode
                }
            case contracts.getProjCompiled().bytecode:
                return {
                    source: contracts.projSource,
                    bytecode: contracts.getProjCompiled().bytecode  
                }
            default:
                throw new Error(`Unknown bytecode fetched for contract ${contractAddress}`)
        }
    }    
}

module.exports = { getContractFromAddress }
