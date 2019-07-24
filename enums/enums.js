let txType = {
    WALLET_CREATE: "WALLET_CREATE",
    ORG_CREATE: "ORG_CREATE",
    DEPOSIT: "DEPOSIT",
    APPROVE: "APPROVE",
    PENDING_ORG_WITHDRAW: "PENDGING_ORG_WITHDRAW",
    PENDING_PROJ_WITHDRAW: "PENDING_PROJ_WITHDRAW",
    WITHDRAW: "WITHDRAW",
    INVEST: "INVEST",
    TRANSFER: "TRANSFER",
    ORG_ADD_MEMBER: "ORG_ADD_MEMBER",
    PROJ_CREATE: "PROJ_CREATE",
    ORG_ACTIVATE: "ORG_ACTIVATE",
    START_REVENUE_PAYOUT: "START_REVENUE_PAYOUT",
    REVENUE_PAYOUT: "REVENUE_PAYOUT",
    SHARE_PAYOUT: "SHARE_PAYOUT",
    WITHDRAW_INVESTMENT: "WITHDRAW_INVESTMENT"
}

let txState = {
    MINED: "MINED",
    PENDING: "PENDING",
    FAILED: "FAILED"
}

let walletType = {
    USER: "USER",
    ORGANIZATION: "ORGANIZATION",
    PROJECT: "PROJECT"
}

let supervisorStatus = {
    NOT_REQUIRED: "NOT_REQUIRED",
    REQUIRED: "REQUIRED",
    PROCESSED: "PROCESSED"
}

let functions = {
    coop: {
        addWallet: "add_wallet",
        isWalletActive: "is_wallet_active"
    },
    eur: {
        mint: "mint",
        allowance: "allowance",
        balanceOf: "balance_of",
        burnFrom: "burn",
        approve: "approve"
    },
    proj: {
        invest: "invest"
    }
}

let txTypeValues = Object.values(txType)
let txStateValues = Object.values(txState)
let walletTypeValues = Object.values(walletType)
let supervisorStatusValues = Object.values(supervisorStatus)

function fromFunctionName(name) {
    switch(name) {
        case "add_wallet": return txType.WALLET_CREATE
        case "mint": return txType.DEPOSIT
        case "approve": return txType.APPROVE
        case "withdraw": return txType.PENDING_PROJ_WITHDRAW
        case "burn": return txType.WITHDRAW
        case "invest": return txType.INVEST
        case "transfer": return txType.TRANSFER
        case "add_member": return txType.ORG_ADD_MEMBER
        case "start_revenue_shares_payout": return txType.START_REVENUE_PAYOUT
        case "payout_revenue_shares": return txType.REVENUE_PAYOUT
    }  
}

module.exports = {
    txType,
    txState,
    txTypeValues,
    txStateValues,
    supervisorStatus,
    supervisorStatusValues,
    walletType,
    walletTypeValues,
    functions,
    fromFunctionName
}