// Helper functions

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

module.exports = helpers;
