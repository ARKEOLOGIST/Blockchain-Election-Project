const path = require('path');
const fs = require('fs');
const solc = require('solc');

const contract = path.resolve(__dirname,'contracts','Election.sol');
const source = fs.readFileSync(contract,'utf8');


module.exports = solc.compile(source,1).contracts[':Election'];