const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

const {
  updateUser,
  checkUsernameExists,
  checkEmailExists,
  getUserData
} = require('../databaseModule/usersModule');

const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    console.log(decoded);
    try {
      const user = await getUserData(decoded.email); 

      if (!user) return res.status(404).json({ message: "User not found" });

      req.user = user; 
      next();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};
// Update Bio
router.post('/update-bio', authenticateToken, async (req, res) => {
  const { bio } = req.body;
  try {
    await updateUser(req.user.userId, { bio });
    res.json({ message: 'Bio updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update bio' });
  }
});

// Update Username
router.post('/update-username', authenticateToken, async (req, res) => {
  const { username } = req.body;

  if (!username) return res.status(400).json({ message: 'Username is required' });

  if (await checkUsernameExists(username)) {
    return res.status(400).json({ message: 'Username already taken' });
  }

  try {
    await updateUser(req.user.userId, { username });
    res.json({ message: 'Username updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update username' });
  }
});

// Update Password
router.post('/update-password', authenticateToken, async (req, res) => {
  const { newPassword, currentPassword } = req.body;

  
  console.log(req.body);
  if (!currentPassword) {
    return res.status(400).json({ message: 'Current password is required' });
  }
  
  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long' });
  }
  
  try {
    console.log(req.user.password);
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

  

    await updateUser(req.user.userId, { password: newPassword });
  
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while updating the password' });
  }
});

// Update Email (only once a month logic should be handled in DB logic)
router.post('/update-email', authenticateToken, async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  if (await checkEmailExists(email)) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  try {
    await updateUser(req.user.userId, { email });
    res.json({ message: 'Email updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update email' });
  }
});

// Update Birthdate
router.post('/update-birthdate', authenticateToken, async (req, res) => {
  const { birthdate } = req.body;

  if (!birthdate) return res.status(400).json({ message: 'Birthdate is required' });

  try {
    await updateUser(req.user.userId, { birthdate });
    res.json({ message: 'Birthdate updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update birthdate' });
  }
});

// Update Profile Picture URL
router.post('/update-profilepicture', authenticateToken, async (req, res) => {
  const { pfpUrl } = req.body;

  if (!pfpUrl) return res.status(400).json({ message: 'Profile picture URL is required' });

  try {
    await updateUser(req.user.userId, { pfpUrl });
    res.json({ message: 'Profile picture updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile picture' });
  }
});

module.exports = router;
