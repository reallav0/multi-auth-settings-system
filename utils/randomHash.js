const crypto = require('crypto');

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function generateRandomHash(length) {
  const randomBytes = crypto.randomBytes(length / 2);
  return randomBytes.toString('hex');
}

function round(value, precision) {
  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

module.exports = {
  getRandomInt,
  generateRandomHash,
  round
};