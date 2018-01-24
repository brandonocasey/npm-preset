/* eslint-disable no-console */
const childProcess = require('child_process');
const path = require('path');
const cwd = path.join(__dirname, '..', 'fixtures', 'bench');

const benchmarks = [{name: 'baseline', cmd: 'echo hello world'}];

[
  'baseline',
  'serial:single',
  'serial:double',
  'serial:triple',
  'serial:nested',

  'parallel:single',
  'parallel:double',
  'parallel:triple',
  'parallel:nested'
].forEach(function(scriptName) {
  benchmarks.push({name: `npm run ${scriptName}`, cmd: `npm run ${scriptName}`});
  benchmarks.push({name: `npmp ${scriptName}`, cmd: `npmp ${scriptName}`});
});

benchmarks.forEach(function(benchmark) {
  console.log(`benchmark: ${benchmark.name}`);
  console.log(childProcess.execSync(`bench "${benchmark.cmd}"`, {cwd}).toString());
});
