const { validationResult } = require('express-validator');

const User = require('../models/user');
const web3 = require('../models/blockchain');
const { interface, bytecode } = require('../compile');
let inbox;

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
      inbox = await web3.eth.Contract(JSON.parse(interface)).deploy({ data: bytecode, arguments: [name] }).send({ from: existingUser.wallet.address, gas: '3000000'});
    } catch (err) {
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
  try {
      existingUser = await User.findOne({ identity: identity });
      add = await inbox.methods.addCandidate(name).call();
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
  try {
      existingUser = await User.findOne({ identity: identity });
      candidateList = await inbox.methods.candidates().call();
      console.log(candidateList);
      response = await inbox.methods.vote(val).call();
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