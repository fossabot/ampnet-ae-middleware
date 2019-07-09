let txType = {
    WALLET_CREATE: "WALLET_CREATE",
    ORG_CREATE: "ORG_CREATE",
    DEPOSIT: "DEPOSIT",
    APPROVE: "APPROVE",
    PENDGING_ORG_WITHDRAW: "PENDGING_ORG_WITHDRAW",
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

let txState = {
    MINED: "MINED",
    PENDING: "PENDING",
    FAILED: "FAILED"
}

let txTypeValues = Object.values(txType)
let txStateValues = Object.values(txState)

function fromGrpcType(grpcTxType) {
    switch (grpcTxType) {
        case 0:  return txType.WALLET_CREATE
        case 1:  return txType.ORG_CREATE
        case 2:  return txType.DEPOSIT
        case 3:  return txType.APPROVE
        case 4:  return txType.PENDING_ORG_WITHDRAW
        case 5:  return txType.PENDING_PROJ_WITHDRAW
        case 6:  return txType.WITHDRAW
        case 7:  return txType.INVEST
        case 8:  return txType.TRANSFER
        case 9:  return txType.ORG_ADD_MEMBER
        case 10: return txType.ORG_ADD_PROJECT
        case 11: return txType.ORG_ACTIVATE
        case 12: return txType.START_REVENUE_PAYOUT
        case 13: return txType.REVENUE_PAYOUT
        case 14: return txType.SHARE_PAYOUT
        case 15: return txType.WITHDRAW_INVESTMENT
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
    txState,
    txTypeValues,
    txStateValues,
    fromGrpcType,
    functionNameFromGrpcType
}