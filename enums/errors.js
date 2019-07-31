let grpcErrors = require('grpc-errors')

let type = {
    TX_NOT_SIGNED: "01",
    TX_INVALID_CONTRACT_CALLED: "02",
    GROUP_INVALID_COOP_ARG: "10",
    PROJ_INVALID_GROUP_ARG: "20"
    
}

let DefaultMessages = new Map([
    [type.TX_NOT_SIGNED, "Transaction not signed. Aborting."],
    [type.TX_INVALID_CONTRACT_CALLED, "Invalid contract called! Contract not part of Cooperative contracts collection."],
    [type.GROUP_INVALID_COOP_ARG, "Error while creating Group. Invalid Coop contract provided as argument!"],
    [type.PROJ_INVALID_GROUP_ARG, "Error while creating Project. Invalid Group contract provided as argument!"]
])

function generate(errorType, message = DefaultMessages.get(errorType)) {
    let errorData = `${errorType} > ${message}`
    switch (errorType) {
        case type.TX_NOT_SIGNED: return new grpcErrors.FailedPreconditionError(errorData)
        case type.TX_INVALID_CONTRACT_CALLED:
        case type.GROUP_INVALID_COOP_ARG:
        case type.PROJ_INVALID_GROUP_ARG: return new grpcErrors.InvalidArgumentError(errorData)
    }
}

module.exports = { generate, type }

/**
 * getBalance
 * addWallet
 * generateAddOrganizationTx
 * generateAddOrganizationProjectTx
 * postVaultTx
 * activateOrg
 * generateInvestmentTx
 * generateConfirmInvestmentTx
 * generateMintTx
 * generateBurnTx
 */