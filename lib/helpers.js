// Helper functions

const crypto = require('crypto');

const config = require('./config');

// Module container
const helpers = {};

// parse JSON to object; Do not throw on error (return {})
helpers.parseJsonToObject = str => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (err) {
    return {};
  }
};

// hashing utility
helpers.hash = str => {
  if (typeof str === 'string' && str.length > 0) {
    const hash = crypto
      .createHmac('sha256', config.hashingSecret)
      .update(str)
      .digest('hex');

    return hash;
  } else {
    return false;
  }
};

// create random string for ids
helpers.createRandomString = strLength => {
  strLength =
    typeof strLength === 'number' && strLength > 0 ? strLength : false;

  if (strLength) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    let str = '';
    for (let i = 1; i <= strLength; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
  } else {
    return false;
  }
};

module.exports = helpers;
