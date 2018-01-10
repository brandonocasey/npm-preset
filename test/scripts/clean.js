const shelljs = require('shelljs');
const path = require('path');
const fs = require('fs');

const baseDir = path.join(__dirname, '..', '..');
const testPkgDir = path.join(baseDir, 'test', 'fixtures', 'test-pkg-main');

shelljs.rm('-rf', testPkgDir);
shelljs.mkdir('-p', testPkgDir);

fs.writeFileSync(path.join(testPkgDir, 'package.json'), JSON.stringify({
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
