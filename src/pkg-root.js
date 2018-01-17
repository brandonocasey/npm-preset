const path = require('path');
const fs = require('fs');

const pkgRoot = (dir) => {
  if (!dir) {
    throw new Error('No package.json in directory tree');
  }

  if (fs.existsSync(path.join(dir, 'package.json'))) {
    return dir;
  }

  return pkgRoot(path.dirname(dir));
};

module.exports = pkgRoot;
