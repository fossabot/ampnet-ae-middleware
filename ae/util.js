function enforceAkPrefix(address) {
    return address.replace("ct_", "ak_")
}

module.exports = { enforceAkPrefix }