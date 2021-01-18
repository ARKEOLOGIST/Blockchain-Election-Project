const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;


const userSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone_number: { type: Number, required: true, minlength: 10,maxlength: 10 },
    email: { type: String, required: true },
    identity: { type: Number, required: true, unique: true },
    password: { type: String, required: true },
    wallet: { type: Object }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);