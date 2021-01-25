const { validationResult } = require('express-validator');
const Tx = require('ethereumjs-tx').Transaction;

const User = require('../models/user');
const { web3, provider } = require('../models/blockchain');
const { interface, bytecode } = require('../compile');
let inbox;
//let deployedAddress;
let superAdmin;

const setBlockchain = async (blockchain) => {
    inbox = blockchain.inbox;
    superAdmin = blockchain.superAdmin;
}

const funcDeploy = async (name,admin) => {
      let superAdmin;
      let inbox;
      let accounts;
      let obj;
      accounts = await web3.eth.getAccounts();
      inbox = await new web3.eth.Contract(JSON.parse(interface)).deploy({ data: '0x'+bytecode, arguments: [name] }).send({ from: accounts[parseInt(admin)], gas: '5000000' });
      inbox.setProvider(provider);
      superAdmin = accounts[parseInt(admin)];
      obj = {inbox: inbox,superAdmin: superAdmin};
      return obj;
}

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ res: 'Invalid inputs passed, please check your data'});
    }
    const { name,address,phone_number,email,identity,password } = req.body;

    let existingUser;
    let wallet;
    try {
      existingUser = await User.findOne({ identity: identity });
    } catch (err) {
        return res.status(500).json({ res: 'Registration failed, please try again later (1)'});
    }
    
    if (existingUser) {
        return res.status(422).json({ res: 'User exists already, please try again'});
    }
    
    try {
        wallet = await web3.eth.accounts.create();
    } catch (err) {
        return res.status(500).json({ res: 'Registration failed, please try again later (2)'});
    }

    const createdUser = new User({
      name,
      address,
      phone_number,
      email,
      identity,
      password,
      wallet
    });
  
    try {
      await createdUser.save();
    } catch (err) {
        return res.status(500).json({ res: 'Registration failed, please try again later (3)'});
    }
  
    res.status(201).json({res: {user: createdUser.toObject({ getters: true })}});
  };

const login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ res: 'Invalid inputs passed, please check your data'});
    }
    const { identity,password } = req.body;
    let existingUser;
    try {
      existingUser = await User.findOne({ identity: identity, password: password });
    } catch (err) {
        return res.status(500).json({ res: 'Login failed, please try again later'});
    }
    
    if (existingUser) {
        return res.status(201).json({res: {user: existingUser.toObject({ getters: true })}});
    } else {
        return res.status(500).json({ res: 'Login failed, please try again later'});
    }
}

const deploy = async (req, res, next) => {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ res: 'Invalid inputs passed, please check your data'});
    }
    const { name,admin,identity } = req.body;
  let existingUser;
  let obj;
  //let stringz;
  try {
      existingUser = await User.findOne({ identity: identity });
      /*const gasP = await web3.eth.getGasPrice();
      const txData = {
        gasLimit: web3.utils.toHex(30000),
        gasPrice: web3.utils.toHex(gasP),
        from: existingUser.wallet.address,
        data: '0x'+bytecode
      };
      admin = existingUser;
      const txCount = await web3.eth.getTransactionCount(existingUser.wallet.address);
      const newNonce = web3.utils.toHex(txCount);
      const transaction = new Tx({ ...txData, nonce: newNonce}, { chain: 'rinkeby' });
      transaction.sign(Buffer.from(existingUser.wallet.privateKey.substring(2),'hex'));
      const serializedTx = transaction.serialize().toString('hex');
      const signedTransaction = web3.eth.sendSignedTransaction('0x' + serializedTx);
      inbox = signedTransaction;
      deployedAddress = signedTransaction.contractAddress;
      return res.status(201).json({res: signedTransaction});*/
      obj = await funcDeploy(name,admin);
      await setBlockchain(obj);
      return res.status(201).json({ res: 'Deploy success.' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ res: 'Deploy failed.'});
    }
}

const add = async (req, res, next) => {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ res: 'Invalid inputs passed, please check your data'});
    }
    const { name,admin,identity } = req.body;
  let existingUser;
  let add;
  let owner;
  let candidate;
  let obj;
  let accounts;
  try {
      existingUser = await User.findOne({ identity: identity }); 
      accounts = await web3.eth.getAccounts();
      owner = await inbox.methods.owner().call();
      if (owner != accounts[parseInt(admin)])
      {
        return res.status(422).json({ res: 'Only admins are allowed to add people for the election'});
      }
      
      add = await inbox.methods.addCandidate(name).send({ from: owner });

      /*const gas = await add.estimateGas({ from: existingUser.wallet.address });
      const gasP = await web3.eth.getGasPrice();
        const txData = {
        gasLimit: gas,
        gasPrice: gasP,
        from: existingUser.wallet.address,
        to: deployedAddress,
        data: add.encodeABI()
      };
      
      const txCount = await web3.eth.getTransactionCount(existingUser.wallet.address);
      const newNonce = web3.utils.toHex(txCount);
      const transaction = new Tx({ ...txData, nonce: newNonce}, { chain: 'rinkeby' });
      transaction.sign(Buffer.from(existingUser.wallet.privateKey.substring(2),'hex'));
      const serializedTx = transaction.serialize().toString('hex');
      const signedTransaction = web3.eth.sendSignedTransaction('0x' + serializedTx);*/

      return res.status(201).json({res: add});

      
    } catch (err) {
        console.log(err);
        return res.status(500).json({ res: 'Method call failed.'});
    }
}

const vote = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ res: 'Invalid inputs passed, please check your data'});
  }
  const { identity, voter, index } = req.body;
  let existingUser;
  let response;
  let accounts;
  let user;
  try {
      existingUser = await User.findOne({ identity: identity });
      owner = await inbox.methods.owner().call();
      accounts = await web3.eth.getAccounts();
      if (owner == accounts[parseInt(voter)])
      {
        return res.status(422).json({ res: 'Admins are not allowed to vote'});
      }
      user = await inbox.methods.voters(accounts[parseInt(voter)]).call();
      if (user.voted)
      {
        return res.status(422).json({ res: 'You have already voted!'});
      }
      response = await inbox.methods.vote(parseInt(index)).send({ from: accounts[parseInt(voter)], gas: '4000000' });


      /*voters = await inbox.methods.voters().call();
      console.log(voters);
      candidateList = await inbox.methods.candidateList().call();
      console.log(candidateList);
      response = await inbox.methods.vote(val);
      const gas = await response.estimateGas({ from: existingUser.wallet.address });
      const gasP = await web3.eth.getGasPrice();
        const txData = {
        gasLimit: gas,
        gasPrice: gasP,
        from: existingUser.wallet.address,
        to: deployedAddress,
        data: response.encodeABI()
      };
      
      const txCount = await web3.eth.getTransactionCount(existingUser.wallet.address);
      const newNonce = web3.utils.toHex(txCount);
      const transaction = new Tx({ ...txData, nonce: newNonce}, { chain: 'rinkeby' });
      transaction.sign(Buffer.from(existingUser.wallet.privateKey.substring(2),'hex'));
      const serializedTx = transaction.serialize().toString('hex');
      const signedTransaction = web3.eth.sendSignedTransaction('0x' + serializedTx);*/
      return res.status(201).json({res: response});


    } catch (err) {
        console.log(err);
        return res.status(500).json({ res: 'Voting failed.'});
    }
}

const candidates = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ res: 'Invalid inputs passed, please check your data'});
  }
  const { name,admin,identity } = req.body;
  let existingUser;
  let obj;
  let len;
  let i;
  let arr = [];
  let blocc = {};
  let copy;
  try {
      existingUser = await User.findOne({ identity: identity });  
      len = await inbox.methods.getCandidateCount().call();
      for (i = 0 ; i < len ; i++)
      {
        blocc.id = i;
        blocc.name = await inbox.methods.getCandidateName(i).call();
        blocc.votes = await inbox.methods.getCandidateVotes(i).call();
        copy = {...blocc};
        arr.push(copy);
      }
      return res.status(201).json({res: arr});
  } catch (err) {
      console.log(err);
      return res.status(500).json({ res: 'Voting failed.'});
  }
}


exports.signup = signup;
exports.login = login;
exports.deploy = deploy;
exports.add = add;
exports.vote = vote;
exports.candidates = candidates;