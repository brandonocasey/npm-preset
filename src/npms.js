#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable max-len */
const cluster = require('cluster');
const config = require('./config');
const runScript = require('./run-script');
const shorten = require('./shorten');
const yargs = require('yargs');
const intercept = require('intercept-stdout');
const Promise = require('bluebird');
const scriptMatches = require('./script-matches');

if (cluster.isMaster) {
  const index = process.argv.indexOf('--');
  let subArgs = [];

  if (index !== -1) {
    process.argv.splice(index, 1);
    subArgs = process.argv.splice(index);
  }

  const argv = yargs
    .usage('$0 [scripts] [options]')
    .option('version', {alias: 'V', default: false, boolean: true, describe: 'print the version and exit'})
    .option('list', {alias: 'l', default: false, boolean: true, describe: 'print available npms scripts and exit'})
    .option('quiet', {alias: 'q', default: false, boolean: true, describe: 'only output errors and warnings'})
    .option('commands-only', {alias: 'co', default: false, boolean: true, describe: 'only show output for commands and errors/warnings'})
    .option('print-config', {alias: 'pc', default: false, boolean: true, describe: 'print the config and exit'})
    .option('parallel', {alias: 'p', default: [], array: true, describe: 'run scripts in parallel'})
    .option('series', {alias: 's', default: [], array: true, describe: 'run scripts in series'})
    .option('noshorten', {alias: 'ns', default: false, boolean: true, describe: 'do not shorten paths'})
    .parse(process.argv.splice(2));

  // by default commands are run in series
  argv.series = argv.s = argv.series.concat(argv._);

  let stderrFilter = (s) => s;
  let stdoutFilter = (s) => s;

  if (!argv.noshorten) {
    // shorten stdout and stderr
    stderrFilter = shorten;
    stdoutFilter = shorten;
  }

  if (argv.quiet) {
    // never print stdout
    stdoutFilter = (s) => '';
  }

  intercept(stdoutFilter, stderrFilter);

  if (argv.commandsOnly) {
    process.env.NPM_SCRIPT_COMMANDS_ONLY = true;
  }

  if (argv.printConfig) {
    console.log(config);
    process.exit(0);
  }

  if (!config.pkg.scripts || !Object.keys(config.pkg.scripts).length) {
    console.error('There are no npm scripts to run, please add some!');
    process.exit(1);
  }

  if (argv.list) {
    Object.keys(config.pkg.scripts).forEach(function(k) {
      console.log('"' + k + '": "' + config.pkg.scripts[k] + '"');
    });
    process.exit(0);
  }

  if (!argv.parallel.length && !argv.series.length) {
    console.error('Must specify a script to run with -s, -p, or without an arg');
    process.exit(1);
  }

  const promises = [];

  argv.parallel.forEach(function(scriptName) {
    const scripts = scriptMatches(scriptName);

    scripts.forEach((s) => {

      promises.push(new Promise(function(resolve, reject) {
        const worker = cluster.fork({scriptName: s});

        worker.on('exit', function(code, signal) {
          if (code !== 0) {
            reject();
          }
          resolve(code);
        });
      }));
    });
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
} else {
  runScript(process.env.scriptName).then(function(result) {
    process.exit(result.code);
  });
}
