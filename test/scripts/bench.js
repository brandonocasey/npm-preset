/* eslint-disable no-console */
const childProcess = require('child_process');
const path = require('path');
const cwd = path.join(__dirname, '..', 'fixtures', 'bench');

const benchmarks = [
  {name: 'baseline', cmd: 'echo hello world'},
  {name: 'npmp baseline', cmd: 'npmp baseline'},

  {name: 'serial:single', cmd: 'npmp serial:single'},
  {name: 'serial:double', cmd: 'npmp serial:double'},
  {name: 'serial:triple', cmd: 'npmp serial:triple'},
  {name: 'serial:nested', cmd: 'npmp serial:nested'},

  {name: 'parallel:single', cmd: 'npmp parallel:single'},
  {name: 'parallel:double', cmd: 'npmp parallel:double'},
  {name: 'parallel:triple', cmd: 'npmp parallel:triple'},
  {name: 'parallel:nested', cmd: 'npmp parallel:nested'}
];

benchmarks.forEach(function(benchmark) {
  console.log(`benchmark: ${benchmark.name}`);
  console.log(childProcess.execSync(`bench "${benchmark.cmd}"`, {cwd}).toString());
});
