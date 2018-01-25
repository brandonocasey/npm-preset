/* eslint-disable no-console */
const Promise = require('bluebird');
const path = require('path');
const fs = Promise.promisifyAll(require('fs'));
const mkdirp = Promise.promisify(require('mkdirp'));
const rimraf = Promise.promisify(require('rimraf'));
const baseDir = path.join(__dirname, '..', '..');
const dirs = [
  path.join(baseDir, 'test', 'fixtures', 'unit-tests'),
  path.join(baseDir, 'test', 'fixtures', 'bench'),
  path.join(baseDir, 'test', 'fixtures', 'playground')
];

const linkPkg = function(src, dest) {
  const srcPkg = require(path.join(src, 'package.json'));
  const promises = [
    fs.symlinkAsync(src, path.join(dest, 'node_modules', srcPkg.name), 'dir')
  ];

  Object.keys(srcPkg.bin).forEach((binName) => {
    const binPath = path.join(src, srcPkg.bin[binName]);

    promises.push(fs.symlinkAsync(binPath, path.join(dest, 'node_modules', '.bin', binName), 'file'));
  });

  return Promise.all(promises);
};

Promise.all(Promise.map(dirs, function(dir) {
  const modules = path.join(dir, 'node_modules');
  const name = path.basename(dir);

  return rimraf(modules).then(() => {
    return mkdirp(path.join(modules, '.bin'));
  }).then(() => {
    return linkPkg(baseDir, dir);
  }).then(() => {
    if (name === 'unit-tests') {
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
    } else if (name === 'bench') {
      return linkPkg(path.join(baseDir, 'node_modules', 'npm-run-all'), dir);
    }

    return Promise.resolve();
  }).then(() => {
    console.log(`Set up ${path.relative(baseDir, dir)}`);
  });
}));
