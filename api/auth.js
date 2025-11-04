const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const router = express.Router();
require('dotenv').config();

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;

const { registerUser, getUserData, checkUsernameExists, updateToken } = require('../databaseModule/usersModule');

router.use(passport.initialize());

/*----------------------- GOOGLE -------------------------*/
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3080/api/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  async (req, res) => {
    const { id, displayName, emails, photos } = req.user;
    const email = emails?.[0]?.value || '';
    const pfpUrl = photos?.[0]?.value || '';
    const userid = `google-${id}`;
    const username = displayName;

    await handleSocialLogin({ userid, username, email, pfpUrl, provider: 'google', res });
  }
);

/*----------------------- FACEBOOK -------------------------*/
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackURL: 'http://localhost:3080/api/facebook/callback',
  profileFields: ['id', 'emails', 'name', 'displayName']
}, async (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/' }),
  async (req, res) => {
    const { id, displayName, emails } = req.user;
    const email = emails?.[0]?.value || '';
    const pfpUrl = `https://graph.facebook.com/${id}/picture?type=large`;
    const userid = `facebook-${id}`;
    const username = displayName;

    await handleSocialLogin({ userid, username, email, pfpUrl, provider: 'facebook', res });
  }
);

/*----------------------- DISCORD -------------------------*/

const REDIRECT_URI = 'http://localhost:3080/api/discord/callback';

router.get('/discord/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided');

  try {
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      querystring.stringify({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: Cprocess.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id, username, email, avatar } = userResponse.data;
    const pfpUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
    const userid = `discord-${id}`;

    await handleSocialLogin({ userid, username, email, pfpUrl, provider: 'discord', res });
  } catch (err) {
    console.error('Discord Auth Error:', err);
    res.status(500).send('Authentication failed');
  }
});

/*----------------------- TWITTER -------------------------*/
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: "http://localhost:3080/api/twitter/callback",
  includeEmail: true
}, async (token, tokenSecret, profile, done) => {
  try {
    const { id, username, emails, photos } = profile;
    const email = emails?.[0]?.value || `${id}@twitter.com`;
    const pfpUrl = photos?.[0]?.value || '';
    const userid = `twitter-${id}`;
    return done(null, { userid, username, email, pfpUrl, provider: 'twitter' });
  } catch (error) {
    return done(error, null);
  }
}));

router.get('/twitter', passport.authenticate('twitter'));

router.get('/twitter/callback',
  passport.authenticate('twitter', { session: false, failureRedirect: '/' }),
  async (req, res) => {
    const { userid, username, email, pfpUrl, provider } = req.user;
    await handleSocialLogin({ userid, username, email, pfpUrl, provider, res });
  }
);

/*------------------ SOCIAL LOGIN HANDLER ------------------*/

async function handleSocialLogin({ userid, username, email, pfpUrl, provider, res }) {
  try {
    // Check if the email is already used by an existing user
    const existingUser = await getUserData(email);

    let token = '';
    let userData = null;

    if (existingUser) {
      // User already exists with this email, generate a new token
      token = await updateToken(email); // Generate a new token for the existing user
      userData = existingUser; // User data is already fetched from getUserData
    } else {
      // User does not exist, register a new user
      const result = await registerUser({
        username,
        userid,
        email,
        pfpUrl,
        provider,
        password: '', // No password needed for social logins
      });

      if (result) {
        token = result.token;
        userData = result.user;
      } else {
        // Error occurred during registration
        throw new Error(`${provider} registration failed`);
      }
    }

    // Set the token in the cookies for session persistence
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week expiration
    });

    // Redirect to dashboard or desired page after login/registration
    res.redirect('http://localhost:3000/dashboard');

  } catch (error) {
    console.error(`${provider} Auth Error:`, error);
    res.status(500).send(`${provider} authentication failed`);
  }
}


/*------------------ LOCAL REGISTER ------------------*/
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, birthdate } = req.body;

    if (!username || !email || !password || !birthdate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (await checkUsernameExists(username)) {
      return res.status(400).json({ message: 'Username already in use' });
    }

    const existingUser = await getUserData(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const result = await registerUser({
      username,
      userid: email,
      email,
      password,
      birthdate,
    });
    
    const accessToken = result.token;
    const user = result.user;

    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      accessToken,
      username: user.username,
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Error registering user', error });
  }
});

/*------------------ LOCAL LOGIN ------------------*/
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await getUserData(email);
    if (!existingUser) {
      return res.status(400).json({ message: 'Email not found!' });
    }

    const validatePass = await bcrypt.compare(password, existingUser.password);
    if (!validatePass) {
      return res.status(400).json({ message: 'Wrong email and password combination!' });
    }

    const updatedToken = await updateToken(email);

    res.cookie('token', updatedToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });

    res.status(200).json({
      accessToken: updatedToken,
      username: existingUser.username,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Error logging in user', error });
  }
});

module.exports = router;
