/* eslint-disable no-console */
const shelljs = require('shelljs');
const path = require('path');
const glob = require('glob');
const fs = require('fs');
const baseDir = path.join(__dirname, '..', '..');

glob(path.join(baseDir, 'test', 'fixtures', '*'), function(er, files) {
  files.forEach(function(folder) {
    const modules = path.join(folder, 'node_modules');
    const name = path.basename(folder);

    console.log(`Setting up ${path.relative(baseDir, folder)}`);

    if (shelljs.test('-d', modules)) {
      shelljs.rm('-rf', modules);

    }
    shelljs.mkdir('-p', path.join(modules, '.bin'));
    shelljs.ln('-sf', baseDir, path.join(modules, 'npm-preset'));
    shelljs.ln('-sf', path.join(baseDir, 'dist', 'npmp.js'), path.join(modules, '.bin', 'npmp'));

    if (name === 'unit-tests') {
      fs.writeFileSync(path.join(folder, 'package.json'), JSON.stringify({
        'name': 'test-pkg-main',
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
});

