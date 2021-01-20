const { validationResult } = require('express-validator');
const Tx = require('ethereumjs-tx').Transaction;

const User = require('../models/user');
const web3 = require('../models/blockchain');
const { interface, bytecode } = require('../compile');
let inbox;
let deployedAddress;
let admin;

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
    const { name, identity } = req.body;
  let existingUser;
  try {
      existingUser = await User.findOne({ identity: identity });
      const gasP = await web3.eth.getGasPrice();
      const txData = {
        gasLimit: web3.utils.toHex(30000),
        gasPrice: gasP,
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
      deployed = signedTransaction.contractAddress;
      return res.status(201).json({res: signedTransaction});

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
    const { name, identity } = req.body;
  let existingUser;
  let add;
  let owner;
  try {
      existingUser = await User.findOne({ identity: identity });
      owner = await inbox.methods.owner().call();
      if (owner != existingUser.wallet.address)
      {
        return res.status(422).json({ res: 'Only admins are allowed to add people for the election'});
      }
      
      add = await inbox.methods.addCandidate(name);
      const gas = await add.estimateGas({ from: existingUser.wallet.address });
      const gasP = await web3.eth.getGasPrice();
        const txData = {
        gasLimit: gas,
        gasPrice: gasP,
        from: existingUser.wallet.address,
        data: add.encodeABI(),
      };
      
      const txCount = await web3.eth.getTransactionCount(existingUser.wallet.address);
      const newNonce = web3.utils.toHex(txCount);
      const transaction = new Tx({ ...txData, nonce: newNonce}, { chain: 'rinkeby' });
      transaction.sign(Buffer.from(existingUser.wallet.privateKey.substring(2),'hex'));
      const serializedTx = transaction.serialize().toString('hex');
      const signedTransaction = web3.eth.sendSignedTransaction('0x' + serializedTx);
      return res.status(201).json({res: signedTransaction});

      
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
  const { identity, val } = req.body;
  let existingUser;
  let candidateList;
  let response;
  let voters;
  try {
      existingUser = await User.findOne({ identity: identity });
      owner = await inbox.methods.owner().call();
      if (owner == existingUser.wallet.address)
      {
        return res.status(422).json({ res: 'Admins are not allowed to vote'});
      }
  
      voters = await inbox.methods.voters().call();
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
        data: response.encodeABI(),
      };
      
      const txCount = await web3.eth.getTransactionCount(existingUser.wallet.address);
      const newNonce = web3.utils.toHex(txCount);
      const transaction = new Tx({ ...txData, nonce: newNonce}, { chain: 'rinkeby' });
      transaction.sign(Buffer.from(existingUser.wallet.privateKey.substring(2),'hex'));
      const serializedTx = transaction.serialize().toString('hex');
      const signedTransaction = web3.eth.sendSignedTransaction('0x' + serializedTx);
      return res.status(201).json({res: signedTransaction});

      
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