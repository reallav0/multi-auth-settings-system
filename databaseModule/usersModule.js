const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);

async function connect() {
  try {
    await client.connect();
    console.log('\x1b[1m\x1b[36m%s\x1b[0m', '[+] User Registration connected to DB');
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}
connect();

const getUserCollection = () => client.db('Main').collection('Users');

async function registerUser({
  username,
  userid,
  email,
  provider = 'local',
  providerId = '',
  password = '',
  birthdate = '',
  bio = '',
  pfpUrl = '',
}) {
  try {
    const collection = getUserCollection();

    const existing = await collection.findOne({
      $or: [
        { email: email },
        ...(provider === 'local' ? [{ email }] : []),
      ],
    });

    if (existing) {
      console.log(`User already exists: ${provider} - ${providerId || email}`);
      return null;
    }

    let hashedPassword = '';
    if (provider === 'local' && password) {
      hashedPassword = await bcrypt.hash(password.toString(), 10);
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: '168h',
    });

    const document = {
      username,
      userId: userid,
      email,
      provider,
      providerId,
      password: hashedPassword,
      birthdate,
      bio,
      pfpUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastEmailChange: null,
      tokens: [{ token, createdAt: new Date() }],
    };

    const result = await collection.insertOne(document);
    console.log('User registered successfully:', result.insertedId);

    return {
      token,
      user: {
        username,
        email,
        userId: userid,
        provider,
        providerId,
        birthdate,
        bio,
        pfpUrl,
      },
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

async function getUserData(identifier) {
  try {
    const collection = getUserCollection();

    let query = {};
    if (typeof identifier === 'object') {
      query = identifier;
    } else if (typeof identifier === 'string' && identifier.includes('@')) {
      query = { email: identifier };
    } else {
      query = { userId: identifier };
    }

    const user = await collection.findOne(query);
    if (!user) return null;

    return user;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

async function checkUsernameExists(username) {
  const collection = getUserCollection();
  const user = await collection.findOne({ username });
  return !!user;
}

async function checkEmailExists(email) {
  const collection = getUserCollection();
  const user = await collection.findOne({ email });
  return !!user;
}

async function updateToken(email) {
  const collection = getUserCollection();
  const updatedToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '168h' });

  const result = await collection.updateOne(
    { email },
    {
      $set: {
        token: updatedToken, // replaces old token
        updatedAt: new Date()
      }
    }
  );

  if (result.modifiedCount === 0) return null;

  return updatedToken;
}

async function updateUser(userId, updates) {
  console.log('Updating user:', userId, updates);
  const collection = getUserCollection();
  const user = await collection.findOne({ userId });
  if (!user) throw new Error('User not found');

  const setFields = { updatedAt: new Date() };

  // Check for and apply changes
  if (updates.username) {
    const usernameExists = await checkUsernameExists(updates.username);
    if (usernameExists) throw new Error('Username already taken');
    setFields.username = updates.username;
  }

  if (updates.bio) setFields.bio = updates.bio;
  if (updates.pfpUrl) setFields.pfpUrl = updates.pfpUrl;
  if (updates.birthdate) setFields.birthdate = updates.birthdate;

  if (updates.password) {
    setFields.password = await bcrypt.hash(updates.password, 10);
  }

  if (updates.email) {
    const now = new Date();
    const lastChange = user.lastEmailChange ? new Date(user.lastEmailChange) : new Date(0);
    const monthMs = 30 * 24 * 60 * 60 * 1000;

    if (now - lastChange < monthMs) {
      throw new Error('Email can only be changed once per month');
    }

    const emailExists = await checkEmailExists(updates.email);
    if (emailExists) throw new Error('Email already in use');

    setFields.email = updates.email;
    setFields.lastEmailChange = now;
  }

  const result = await collection.updateOne({ userId }, { $set: setFields });

  return result.modifiedCount > 0;
}

module.exports = {
  registerUser,
  getUserData,
  checkUsernameExists,
  checkEmailExists,
  updateToken,
  updateUser,
};
