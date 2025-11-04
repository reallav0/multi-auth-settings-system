const express = require('express');
const app = express();
require('dotenv').config();
const socketService = require('./utils/socketService');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs')
const session = require("express-session");
const passport = require("passport");

//-----------Server-----------------------//


const server = app.listen(3080, () => {
  console.log('\x1b[1m\x1b[37m\x1b[41m%s\x1b[0m', '[+] Server is up');
});

socketService.initSocket(server)

//-----------Ultis---------------//


//-----------routeLink---------------//

const AuthRoutes = require('./api/auth');
const UserRoute = require('./api/users');

//-----------Else---------------//

app.use(express.json());
app.set('trust proxy', true);
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'views')));

app.use(cookieParser());
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.use(session({
  secret: 'avocadoDevel0ping777', 
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(cors({
  origin: "http://localhost:3000", // allow frontend
  credentials: true,              // allow cookies
}));
//-----------Routes---------------//
app.get('/', async (req, res) =>  {
  res.send('Welcome visitor')
})

//app.use('/api/users', userRoutes);
//app.use('/api/admin', adminRoute);

app.use('/api', AuthRoutes);
app.use('/api', UserRoute);
//-----------Error handling----------------//
app.use((err, req, res, next) => {
    console.error(err.stack);  // Log the error stack trace
    res.status(500).json({ message: 'Something went wrong!' });
});


