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

module.exports = handlers;
