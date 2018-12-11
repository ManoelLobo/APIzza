// Data service lib

const fs = require('fs');
const path = require('path');

const helpers = require('./helpers');

// Module container
const lib = {};

lib.baseDir = path.join(__dirname, '/../.data/');

// create file from data
lib.create = (dir, file, data, cb) => {
  // open file for write
  fs.open(
    lib.baseDir + dir + '/' + file + '.json',
    'wx',
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // convert data to string
        const stringData = JSON.stringify(data);

        // write data
        fs.writeFile(fileDescriptor, stringData, err => {
          if (!err) {
            // close file
            fs.close(fileDescriptor, err => {
              if (!err) {
                cb(false);
              } else {
                cb('Error closing new file');
              }
            });
          } else {
            cb('Error writing to new file');
          }
        });
      } else {
        cb('Could not create file');
      }
    },
  );
};

// read file data & return JSON object
lib.read = (dir, file, cb) => {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObject(data);

      cb(false, parsedData);
    } else {
      cb(err, data);
    }
  });
};

module.exports = lib;
