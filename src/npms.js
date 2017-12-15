#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable max-len */

const config = require('./config');
const runScript = require('./run-script');
const shorten = require('./shorten');
const yargs = require('yargs');
const intercept = require('intercept-stdout');
const Promise = require('bluebird');
const scriptMatches = require('./script-matches');

const index = process.argv.indexOf('--');
let subArgs = [];

if (index !== -1) {
  process.argv.splice(index, 1);
  subArgs = process.argv.splice(index);
}

const argv = yargs
  .option('version', {alias: 'V', default: false, describe: 'print the version and exit'})
  .option('list', {alias: 'l', default: false, describe: 'print available npms scripts and exit'})
  .option('quiet', {alias: 'q', default: false, describe: 'only output errors and warnings'})
  .option('print-config', {alias: 'pc', default: false, describe: 'print the config and exit'})
  .option('parallel', {alias: 'p', default: [], array: true, describe: 'run scripts in parallel'})
  .option('series', {alias: 's', default: [], array: true, describe: 'run scripts in series'})
  .option('no-shorten', {alias: 'ns', default: false, describe: 'do not shorten paths'})
  .parse(process.argv.splice(2));

// by default commands are run in series
argv.series = argv.s = argv.series.concat(argv._);

if (!argv.noShorten) {
  // shorten stdoud and stderr
  intercept(shorten, shorten);
}

if (argv.quiet) {
  // intercept stdout, to be nothing
  intercept((s) => '');
}

if (argv.printConfig) {
  console.log(config);
  process.exit(0);
}

if (argv.list) {
  console.log(config.pkg.scripts);
  process.exit(0);
}

if (!config.pkg.scripts || !Object.keys(config.pkg.scripts).length) {
  console.error('There are no npm scripts to run, please add some!');
  process.exit(1);
}

const promises = [];

argv.parallel.forEach(function(scriptName) {
  const scripts = scriptMatches(scriptName);

  scripts.forEach((s) => promises.push(runScript(s, subArgs)));
});

promises.push(Promise.mapSeries(argv.series, function(scriptName) {
  const scripts = scriptMatches(scriptName);

  return Promise.mapSeries(scripts, (s) => runScript(s, subArgs));
}));

Promise.all(promises).then(function() {
  process.exit(0);
}).error(function(error) {
  console.error(error);
  process.exit(1);
});
