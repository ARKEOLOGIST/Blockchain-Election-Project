const Web3 = require('web3');
const web3 = new Web3(Web3.givenProvider || "https://rinkeby.infura.io/v3/9cc9a569b98d47e8823b9afa14a6ff04");

module.exports = web3;