let fs = require('fs')
let path = require('path')

let contracts = require('../../ae/contracts')
let clients = require('./clients')

let deploy = async () => {

    // Get Coop contract instance
    
	let coopSource = fs.readFileSync(path.resolve(__dirname, '../../contracts/Coop.aes')).toString('utf-8')
	let coopContract = await clients.coop().getContractInstance(coopSource)
	

	// Get EUR contract instance

	let eurSource = fs.readFileSync(path.resolve(__dirname, '../../contracts/EUR.aes')).toString('utf-8')
	let eurContract = await clients.eur().getContractInstance(eurSource)


	// Deploy and wire contracts

	let coop = await coopContract.deploy()
	console.log(`Coop deployed at: ${coop.address}`)

	let eur = await eurContract.deploy([coop.address])
	console.log(`EUR deployed at: ${eur.address}`)

	await coopContract.call('set_token', [eur.address])
	console.log('EUR token registered in Coop contract')


	// Update contract addresses in env file

	contracts.setCoopAddress(coop.address)
	contracts.setEurAddress(eur.address)
};

module.exports = {
	deploy
};