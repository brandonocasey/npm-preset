/* eslint-disable no-console */
const shelljs = require('shelljs');
const path = require('path');
const fs = require('fs');
const baseDir = path.join(__dirname, '..', '..');
const pkg = require(path.join(baseDir, 'package.json'));
const dirs = [
  path.join(baseDir, 'test', 'fixtures', 'unit-tests'),
  path.join(baseDir, 'test', 'fixtures', 'bench')
];

dirs.forEach(function(dir) {

  const modules = path.join(dir, 'node_modules');
  const name = path.basename(dir);

  console.log(`Setting up ${path.relative(baseDir, dir)}`);

  if (shelljs.test('-d', modules)) {
    shelljs.rm('-rf', modules);
  }
  shelljs.mkdir('-p', path.join(modules, '.bin'));
  shelljs.ln('-sf', baseDir, path.join(modules, pkg.name));

  Object.keys(pkg.bin).forEach((binName) => {
    const binPath = path.join(baseDir, pkg.bin[binName]);

    shelljs.ln('-sf', binPath, path.join(modules, '.bin', binName));
  });

  if (name === 'unit-tests') {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
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

  }
});
