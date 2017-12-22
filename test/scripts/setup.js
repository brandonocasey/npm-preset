var shelljs = require('shelljs');
var path = require('path');
var baseDir = path.join(__dirname, '..', '..');
var testPkgDir = path.join(baseDir, 'test', 'fixtures', 'test-pkg-main');

shelljs.mkdir('-p', path.join(testPkgDir, 'node_modules', '.bin'));
shelljs.ln('-sf', baseDir, path.join(testPkgDir, 'node_modules', 'npm-script'));
shelljs.ln('-sf', path.join(baseDir, 'src', 'npms.js'), path.join(testPkgDir, 'node_modules', '.bin', 'npms'));
