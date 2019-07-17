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
    ORG_ADD_PROJECT: "ORG_ADD_PROJECT",
    ORG_ACTIVATE: "ORG_ACTIVATE",
    START_REVENUE_PAYOUT: "START_REVENUE_PAYOUT",
    REVENUE_PAYOUT: "REVENUE_PAYOUT",
    SHARE_PAYOUT: "SHARE_PAYOUT",
    WITHDRAW_INVESTMENT: "WITHDRAW_INVESTMENT"
}

let grpcTxType = {
    WALLET_CREATE: 0,
    ORG_CREATE: 1,
    DEPOSIT: 2,
    APPROVE: 3,
    PENDING_ORG_WITHDRAW: 4,
    PENDING_PROJ_WITHDRAW: 5,
    WITHDRAW: 6,
    INVEST: 7,
    TRANSFER: 8,
    ORG_ADD_MEMBER: 9,
    ORG_ADD_PROJECT: 10,
    ORG_ACTIVATE: 11,
    START_REVENUE_PAYOUT: 12,
    REVENUE_PAYOUT: 13,
    SHARE_PAYOUT: 14,
    WITHDRAW_INVESTMENT: 15
}

let txState = {
    MINED: "MINED",
    PENDING: "PENDING",
    FAILED: "FAILED"
}

let functions = {
    coop: {
        addWallet: "add_wallet",
        isWalletActive: "is_wallet_active"
    }
}

let txTypeValues = Object.values(txType)
let txStateValues = Object.values(txState)

function fromGrpcType(type) {
    switch (type) {
        case grpcTxType.WALLET_CREATE:  return txType.WALLET_CREATE
        case grpcTxType.ORG_CREATE:  return txType.ORG_CREATE
        case grpcTxType.DEPOSIT:  return txType.DEPOSIT
        case grpcTxType.APPROVE:  return txType.APPROVE
        case grpcTxType.PENDING_ORG_WITHDRAW:  return txType.PENDING_ORG_WITHDRAW
        case grpcTxType.PENDING_PROJ_WITHDRAW:  return txType.PENDING_PROJ_WITHDRAW
        case grpcTxType.WITHDRAW:  return txType.WITHDRAW
        case grpcTxType.INVEST:  return txType.INVEST
        case grpcTxType.TRANSFER:  return txType.TRANSFER
        case grpcTxType.ORG_ADD_MEMBER:  return txType.ORG_ADD_MEMBER
        case grpcTxType.ORG_ADD_PROJECT: return txType.ORG_ADD_PROJECT
        case grpcTxType.ORG_ACTIVATE: return txType.ORG_ACTIVATE
        case grpcTxType.START_REVENUE_PAYOUT: return txType.START_REVENUE_PAYOUT
        case grpcTxType.REVENUE_PAYOUT: return txType.REVENUE_PAYOUT
        case grpcTxType.SHARE_PAYOUT: return txType.SHARE_PAYOUT
        case grpcTxType.WITHDRAW_INVESTMENT: return txType.WITHDRAW_INVESTMENT
    }
}

function functionNameFromGrpcType(grpcTxType) {
    switch (grpcTxType) {
        case 0:  return "add_wallet"
        case 1:  return "add_wallet" // TODO: rethink about merging WALLET_CREATE and ORG_CREATE in one tx type (it is the same fn call after all)
        case 2:  return "mint"
        case 3:  return "approve"
        case 4:  return "unimplemented" // TODO
        case 5:  return "withdraw"
        case 6:  return "burn"
        case 7:  return "invest"
        case 8:  return "transfer"
        case 9:  return "add_member"
        case 10: return "unimplemented" // TODO
        case 11: return "unimplemented" // TODO: probably not needed since actiavtion is actually add_wallet action
        case 12: return "start_revenue_shares_payout"
        case 13: return "payout_revenue_shares"
        case 14: return "unimplemented" // TODO: rethink how to handle this manually created tx
        case 15: return "withdraw"
    }
}

module.exports = {
    txType,
    grpcTxType,
    txState,
    txTypeValues,
    txStateValues,
    fromGrpcType,
    functionNameFromGrpcType,
    functions
}