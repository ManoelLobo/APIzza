// Route handling functions

// Module container
const handlers = {};

handlers.ping = (data, cb) => {
  cb(200);
};

handlers.notFound = (data, cb) => {
  cb(404);
};

module.exports = handlers;
