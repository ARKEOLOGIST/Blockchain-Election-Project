const { validationResult } = require('express-validator');

const User = require('../models/user');
const Web3 = require('web3');
const web3 = new Web3(Web3.givenProvider || "https://rinkeby.infura.io/v3/9cc9a569b98d47e8823b9afa14a6ff04");
const { interface, bytecode } = require('../compile');

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

exports.signup = signup;
exports.login = login;