/* eslint-disable no-console */
const childProcess = require('child_process');
const path = require('path');
const baseDir = path.join(__dirname, '..', '..');
const cwd = path.join(__dirname, '..', 'fixtures', 'bench');
const pkg = require(path.join(baseDir, 'package.json'));
const benchPkg = require(path.join(cwd, 'package.json'));
const os = require('os');
const fs = require('fs');

// modified from https://stackoverflow.com/a/16426519
const getDateTime = function() {

  const date = new Date();
  let hour = date.getHours();
  let min = date.getMinutes();
  let sec = date.getSeconds();
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  hour = (hour < 10 ? '0' : '') + hour;
  min = (min < 10 ? '0' : '') + min;
  sec = (sec < 10 ? '0' : '') + sec;
  month = (month < 10 ? '0' : '') + month;
  day = (day < 10 ? '0' : '') + day;

  return month + '/' + day + '/' + year + ' @ ' + hour + ':' + min + ':' + sec;

};

const benchmarks = ['echo hello world'];

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
  benchmarks.push(`npm run ${scriptName}`);
  benchmarks.push(`npmp ${scriptName}`);
});

const benchmarksCommand = 'bench ' + benchmarks.map((b) => `"${b}"`).join(' ');
const child = childProcess.exec(benchmarksCommand, {cwd}, function(error, stdout, stderr) {
  if (error) {
    throw new Error(error);
  }
  const results = stdout.toString() + '\n';
  let cpuMarkdown = '';

  os.cpus().forEach((cpu, i) => {
    cpuMarkdown += `  * ${i + 1} ${cpu.model} - ${cpu.speed}\n`;
  });

  fs.writeFileSync(path.join(baseDir, 'BENCHMARKS.md'), `# Benchmarks
Last run in version ${pkg.version} on ${getDateTime()}

## Table of Contents

## Specs of the runner
* Arch: ${os.arch()}
* Platform: ${os.platform()}
* Memory: ${os.totalmem()} bytes
* CPU Info:
${cpuMarkdown}

## What was run

### npm-preset scripts
${JSON.stringify(benchPkg['npm-preset'].scripts, null, 2)}

### npm scripts
${JSON.stringify(benchPkg.scripts, null, 2)}

## Results

${results}`);

  console.log('Wrote results to BENCHMARKS.md');
});

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

