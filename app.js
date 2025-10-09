const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const authRouter = require('./routes/auth');

const app = express();
app.use('/courses/covers', express.static(path.join(__dirname, "public", "courses", "covers")));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/auth', authRouter);

module.exports = app;