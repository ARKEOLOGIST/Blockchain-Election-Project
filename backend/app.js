const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const registration = require('./routes/routes');
const port = process.env.PORT || 5000;

const app = express();

app.use((req,res,next) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','*');
  res.setHeader('Access-Control-Allow-Methods','*');
  next();
});


app.use(bodyParser.urlencoded({
    extended: false
  }));
app.use(bodyParser.json());

app.use('/',registration);

app.use((req, res, next) => {
    return res.status(404).send({ res: 'Path not found'});
  });
  
mongoose.connect('mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false')
  .then(() => {
    app.listen(port);
  })
  .catch(err => {
    console.log(err);
  });
