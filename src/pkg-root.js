'use strict';

const path = require('path');
const fs = require('fs');

const pkgRoot = (dir) => {
  if (fs.existsSync(path.join(dir, 'package.json'))) {
    return dir;
  }

  if (dir === '/') {
    return '';
  }

  return pkgRoot(path.dirname(dir));
};

module.exports = pkgRoot;
