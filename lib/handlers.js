// Route handling functions

const _data = require('./data');
const helpers = require('./helpers');

// Module container
const handlers = {};

// Status checker
handlers.ping = (data, cb) => {
  cb(200);
};

// 404
handlers.notFound = (data, cb) => {
  cb(404);
};

/**
 * User handlers
 */
// Method check and redirect to corresponding handler
handlers.users = (data, cb) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.includes(data.method)) {
    handlers._users[data.method](data, cb);
  } else {
    cb(405);
  }
};

// User handlers container
handlers._users = {};

//  POST /users - create user
// Requires: name, email, password, address
handlers._users.post = (data, cb) => {
  // Validate fields
  const name =
    typeof data.payload.name === 'string' && data.payload.name.trim().length > 0
      ? data.payload.name.trim()
      : null;
  const emailPattern = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  const email =
    typeof data.payload.email === 'string' &&
    data.payload.email.trim().match(emailPattern)
      ? data.payload.email.trim()
      : null;
  const password =
    typeof data.payload.password === 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : null;
  const address =
    typeof data.payload.address === 'string' &&
    data.payload.address.trim().length > 0
      ? data.payload.address.trim()
      : null;

  if (name && email && password && address) {
    _data.read('users', email, (err, data) => {
      if (err) {
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          const userObject = {
            name,
            email,
            address,
            hashedPassword,
          };

          // store user
          _data.create('users', email, userObject, err => {
            if (!err) {
              cb(200);
            } else {
              console.log(err);
              cb(500, { error: 'Could not create new user' });
            }
          });
        } else {
          cb(500, { error: 'Could not hash password' });
        }
      } else {
        cb(400, {
          error: 'A user with this email is already registered',
        });
      }
    });
  } else {
    cb(400, { error: 'Missing required fields' });
  }
};

// GET /users
// Required: email
handlers._users.get = (data, cb) => {
  const emailPattern = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  const email =
    typeof data.payload.email === 'string' &&
    data.payload.email.trim().match(emailPattern)
      ? data.payload.email.trim()
      : null;

  if (email) {
    // get token from headers
    const token =
      typeof data.headers.token === 'string' ? data.headers.token : false;
    // verify if the token is valid for the email
    handlers._tokens.verifyToken(token, email, tokenIsValid => {
      if (tokenIsValid) {
        // user lookup
        _data.read('users', email, (err, data) => {
          if (!err && data) {
            // remove hashed password from returned data
            delete data.hashedPassword;

            cb(200, data);
          } else {
            cb(404);
          }
        });
      } else {
        cb(403, { error: 'Missing or invalid token in header' });
      }
    });
  } else {
    cb(400, { error: 'Missing required field' });
  }
};

// PUT /users
// Requires: email, optional (1+)
// Optional: name, address, password
handlers._users.put = (data, cb) => {
  const emailPattern = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  const email =
    typeof data.payload.email === 'string' &&
    data.payload.email.trim().match(emailPattern)
      ? data.payload.email.trim()
      : null;

  // check optional fields
  const name =
    typeof data.payload.name === 'string' && data.payload.name.trim().length > 0
      ? data.payload.name.trim()
      : null;
  const address =
    typeof data.payload.address === 'string' &&
    data.payload.address.trim().length > 0
      ? data.payload.address.trim()
      : null;
  const password =
    typeof data.payload.password === 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : null;

  // check if the email is ok
  if (email) {
    // check if there is at least one optional
    if (name || address || password) {
      // get token from headers
      const token =
        typeof data.headers.token === 'string' ? data.headers.token : false;
      // verify if the token is valid for the email
      handlers._tokens.verifyToken(token, email, tokenIsValid => {
        if (tokenIsValid) {
          // user lookup
          _data.read('users', email, (err, userData) => {
            if (!err && userData) {
              // update
              if (name) {
                userData.name = name;
              }
              if (address) {
                userData.address = address;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
            } else {
              cb(400, { error: 'The user does not exist' });
            }

            // store
            _data.update('users', email, userData, err => {
              if (!err) {
                cb(200);
              } else {
                console.log(err);
                cb(500, { error: 'Could not update the user' });
              }
            });
          });
        } else {
          cb(403, { error: 'Missing or invalid token in header' });
        }
      });
    } else {
      cb(400, { error: 'Missing fields to update' });
    }
  } else {
    cb(400, { error: 'Missing required field' });
  }
};

/**
 * Token handlers
 */
// Method check and redirect to corresponding handler
handlers.tokens = (data, cb) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.includes(data.method)) {
    handlers._tokens[data.method](data, cb);
  } else {
    cb(405);
  }
};

handlers._tokens = {};

// POST /tokens
// Required: email, password
handlers._tokens.post = (data, cb) => {
  const emailPattern = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  const email =
    typeof data.payload.email === 'string' &&
    data.payload.email.trim().match(emailPattern)
      ? data.payload.email.trim()
      : null;
  const password =
    typeof data.payload.password === 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : null;

  if (email && password) {
    // user lookup
    _data.read('users', email, (err, userData) => {
      if (!err && userData) {
        const hashedPassword = helpers.hash(password);

        if (hashedPassword === userData.hashedPassword) {
          // create new token (1h expiration time)
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = { email, id: tokenId, expires };

          // store token
          _data.create('tokens', tokenId, tokenObject, err => {
            if (!err) {
              cb(200, tokenObject);
            } else {
              cb(500, { error: 'Could not create token' });
            }
          });
        } else {
          cb(400, { error: 'Password does not match' });
        }
      } else {
        cb(400, { error: 'Could not find the user' });
      }
    });
  } else {
    cb(400, { error: 'Missing required field(s)' });
  }
};

// GET/tokens
// Required: id
handlers._tokens.get = (data, cb) => {
  // check if the id is valid
  const id =
    typeof data.queryStringObject.id === 'string' &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // token lookup
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        cb(200, tokenData);
      } else {
        cb(404);
      }
    });
  } else {
    cb(400, { error: 'Missing required field' });
  }
};

// PUT /tokens
// Extend duration of token
// Required: id, extend
handlers._tokens.put = (data, cb) => {
  const id =
    typeof data.payload.id === 'string' && data.payload.id.trim().length === 20
      ? data.payload.id.trim()
      : false;
  const extend =
    typeof data.payload.extend === 'boolean' && data.payload.extend === true
      ? true
      : false;

  if (id && extend) {
    // token lookup
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // check if token has not expired
        if (tokenData.expires > Date.now()) {
          // update epiration date
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // store updated token
          _data.update('tokens', id, tokenData, err => {
            console.log(err);
            if (!err) {
              cb(200);
            } else {
              cb(500, { error: 'Could not update token expiration date' });
            }
          });
        } else {
          cb(400, { error: 'The token has already expired' });
        }
      } else {
        cb(400, { error: 'Token does not exist' });
      }
    });
  } else {
    cb(400, { error: 'Missing or invalid required field(s)' });
  }
};

// DELETE /tokens
// Required: id
handlers._tokens.delete = (data, cb) => {
  // id check
  const id =
    typeof data.queryStringObject.id === 'string' &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // token lookup
    _data.read('tokens', id, (err, data) => {
      if (!err && data) {
        _data.delete('tokens', id, err => {
          if (!err) {
            cb(200);
          } else {
            cb(500, { error: 'Could not delete the token' });
          }
        });
      } else {
        cb(400, { error: 'Could not find the token' });
      }
    });
  } else {
    cb(400, { error: 'Missing required field' });
  }
};

// check if a token id is valid for a given user
handlers._tokens.verifyToken = (id, email, cb) => {
  // token lookup
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // check if token is for user and has not expired
      if (tokenData.email === email && tokenData.expires > Date.now()) {
        cb(true);
      } else {
        cb(false);
      }
    } else {
      cb(false);
    }
  });
};

module.exports = handlers;
