// Entry point for the API

const server = require('./lib/server');

// Module container
const app = {};

// Initialization process
app.init = () => {
  server.init();
};

app.init();

module.exports = app;
