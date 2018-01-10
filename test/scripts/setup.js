const shelljs = require('shelljs');
const path = require('path');
const baseDir = path.join(__dirname, '..', '..');
const testPkgDir = path.join(baseDir, 'test', 'fixtures', 'test-pkg-main');

shelljs.mkdir('-p', path.join(testPkgDir, 'node_modules', '.bin'));
shelljs.ln('-sf', baseDir, path.join(testPkgDir, 'node_modules', 'npm-preset'));
shelljs.ln('-sf', path.join(baseDir, 'src', 'npmp.js'), path.join(testPkgDir, 'node_modules', '.bin', 'npmp'));
