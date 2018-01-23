/* eslint-disable no-console */
const Promise = require('bluebird');
const path = require('path');
const fs = Promise.promisifyAll(require('fs'));
const mkdirp = Promise.promisify(require('mkdirp'));
const rimraf = Promise.promisify(require('rimraf'));
const baseDir = path.join(__dirname, '..', '..');
const pkg = require(path.join(baseDir, 'package.json'));
const dirs = [
  path.join(baseDir, 'test', 'fixtures', 'unit-tests'),
  path.join(baseDir, 'test', 'fixtures', 'bench')
];

Promise.all(Promise.map(dirs, function(dir) {
  const modules = path.join(dir, 'node_modules');
  const name = path.basename(dir);

  return rimraf(modules).then(() => {
    return mkdirp(path.join(modules, '.bin'));
  }).then(() => {
    return fs.symlinkAsync(baseDir, path.join(modules, pkg.name), 'dir');
  }).then(() => {
    return Promise.all(Promise.map(Object.keys(pkg.bin), (binName) => {
      const binPath = path.join(baseDir, pkg.bin[binName]);

      fs.symlinkAsync(binPath, path.join(modules, '.bin', binName), 'file');
    }));
  }).then(() => {
    if (name !== 'unit-tests') {
      return Promise.resolve();
    }

    return fs.writeFileAsync(path.join(dir, 'package.json'), JSON.stringify({
      'name': 'unit-tests',
      'version': '1.0.0',
      'description': '',
      'main': 'index.js',
      'npm-preset': {scripts: {}},
      'scripts': {},
      'keywords': [],
      'author': '',
      'license': 'ISC'
    }, null, 2));
  }).then(() => {
    console.log(`Set up ${path.relative(baseDir, dir)}`);
  });
}));
