var shelljs = require('shelljs');
var path = require('path');
var fs = require('fs');

var baseDir = path.join(__dirname, '..', '..');
var testPkgDir = path.join(baseDir, 'test', 'fixtures', 'test-pkg-main');

shelljs.rm('-rf', testPkgDir);
shelljs.mkdir('-p', testPkgDir);

fs.writeFileSync(path.join(testPkgDir, 'package.json'), JSON.stringify({
  name: 'test-pkg-main',
  version: '1.0.0',
  description: '',
  main: 'index.js',
  scripts: {},
  keywords: [],
  author: '',
  license: 'ISC'
}, null, 2));
