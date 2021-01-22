const express = require('express');
const { check } = require('express-validator');

const usersController = require('../controllers/user-controller');

const router = express.Router();

router.post(
  '/signup',
  [
    check('name')
      .not()
      .isEmpty(),
    check('address')
      .not()
      .isEmpty(),
      check('phone_number')
      .not()
      .isEmpty(),
      check('phone_number')
      .isLength({ min: 10, max: 10 }),
      check('identity')
      .not()
      .isEmpty(),
      check('password')
      .not()
      .isEmpty()
  ],
  usersController.signup
);

router.post(
    '/login',
    [
        check('identity')
        .not()
        .isEmpty(),
        check('password')
        .not()
        .isEmpty()
    ],
    usersController.login
);

router.post(
    '/deploy',
    [
      check('identity')
      .not()
      .isEmpty(),
      check('name')
      .not()
      .isEmpty()
    ],
    usersController.deploy
);

router.post(
  '/add',
  [
    check('identity')
    .not()
    .isEmpty(),
    check('name')
    .not()
    .isEmpty()
  ],
  usersController.add
);

router.post(
  '/vote',
  [
    check('identity')
    .not()
    .isEmpty(),
    check('voter')
    .not()
    .isEmpty(),
    check('index')
    .not()
    .isEmpty()
  ],
  usersController.vote
);

router.post(
  '/candidates',
  [
    check('identity')
    .not()
    .isEmpty()
  ],
  usersController.candidates
)

module.exports = router;