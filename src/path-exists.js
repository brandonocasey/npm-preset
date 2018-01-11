const fs = require('fs');

const pathExists = function(p) {
  try {
    fs.statSync(p);
    return true;
  } catch (x) {
    return false;
  }
};

module.exports = pathExists;
