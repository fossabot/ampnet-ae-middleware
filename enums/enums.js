let config = require('../env.json')[process.env.NODE_ENV || 'development']
let util = require('../ae/util')

let txType = {
    WALLET_CREATE: "WALLET_CREATE",
    ORG_CREATE: "ORG_CREATE",
    DEPOSIT: "DEPOSIT",
    APPROVE_INVESTMENT: "APPROVE_INVESTMENT",
    APPROVE_USER_WITHDRAW: "APPROVE_USER_WITHDRAW",
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

let events = new Map([
    [util.blake2b('WalletAdded'), txType.WALLET_CREATE],
    [util.blake2b('RevenueSharePayout'), txType.START_REVENUE_PAYOUT]
])

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

let contractType = {
    COOP: "COOP",
    EUR: "EUR",
    ORG: "ORG",
    PROJ: "PROJ"
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
        invest: "invest",
        startRevenueSharesPayout: "start_revenue_shares_payout",
        payoutRevenueSharesBatch: "payout_revenue_shares"
    }
}

let txTypeValues = Object.values(txType)
let txStateValues = Object.values(txState)
let walletTypeValues = Object.values(walletType)
let supervisorStatusValues = Object.values(supervisorStatus)

function fromFunctionCall(fn, callData) {
    switch(fn) {
        case "add_wallet": return txType.WALLET_CREATE
        case "mint": return txType.DEPOSIT
        case "approve":
            if (callData.arguments[0].value == config.contracts.eur.owner) {
                return txType.APPROVE_USER_WITHDRAW
            } else {
                return txType.APPROVE_INVESTMENT
            }
        case "withdraw": return txType.PENDING_PROJ_WITHDRAW
        case "burn": return txType.WITHDRAW
        case "invest": return txType.INVEST
        case "transfer": return txType.TRANSFER
        case "add_member": return txType.ORG_ADD_MEMBER
        case "start_revenue_shares_payout": return txType.START_REVENUE_PAYOUT
        case "payout_revenue_shares": return txType.REVENUE_PAYOUT
    }  
}

function fromEvent(event) {
    let eventHex = util.bigNumberToHex(event)
    if (events.has(eventHex)) {
        return events.get(eventHex)
    } else {
        throw new Error(`Could not convert event ${event} to transaction type!`)
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
    contractType,
    walletTypeValues,
    functions,
    fromFunctionCall,
    fromEvent
}