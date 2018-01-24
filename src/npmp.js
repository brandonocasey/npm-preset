#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */
/* eslint-disable max-len */
const runScript = require('./run-script');
const filter = require('./filter');
const pkg = require('../package.json');
const config = require('./config');
const scriptMatches = require('./script-matches');
const mapPromise = require('./map-promise');
const mapSeriesPromise = require('./map-series-promise');

const npmp = function(argv) {
  const args = argv;
  const options = {
    version: false,
    help: false,
    list: false,
    quiet: false,
    silent: false,
    commandsOnly: false,
    printConfig: false,
    shorten: true,
    tasks: [],
    subArgs: []
  };
  const usage = function() {
    console.log();
    console.log('  Usage: npmp [options] [scripts...]');
    console.log();
    console.log('  > Note: by default script name args will be treated as series');
    console.log('  > Note2: script name args can use wild cards such as build:*');
    console.log();
    console.log('  -p,  --parallel [scripts...]     Run specified scripts in parallel');
    console.log('  -s,  --series   [scripts...]     Run specified scripts in series');
    console.log('  -V,  --version                   Print version and exit');
    console.log('  -h,  --help                      Print usage and exit');
    console.log('  -q,  --quiet                     Only print errors and warnings');
    console.log('  -l,  --list                      Print available scripts and exit');
    console.log('  -si, --silent                    Do not print anything');
    console.log('  -co, --commands-only             Only print errors, warnings, and script output');
    console.log('  -pc, --print-config              Print the npm-preset config and exit');
    console.log('  -ns, --no-shorten                Do not shorten paths in stdout/stderr');
    console.log();
  };

  const index = args.indexOf('--');

  if (index !== -1) {
    args.splice(index, 1);
    options.subArgs = args.splice(index);
  }

  let currentType = 'series';

  while (args.length) {
    const arg = args.shift();

    if ((/^(-h|--help)$/).test(arg)) {
      options.help = true;
    } else if ((/^(-q|--quiet)$/).test(arg)) {
      options.quiet = true;
    } else if ((/^(-si|--silent)$/).test(arg)) {
      options.silent = true;
    } else if ((/^(-V|--version)$/).test(arg)) {
      options.version = true;
    } else if ((/^(-l|--list$)/).test(arg)) {
      options.list = true;
    } else if ((/^(--commands-only|-co)$/).test(arg)) {
      options.commandsOnly = true;
    } else if ((/^(--print-config|-pc)$/).test(arg)) {
      options.printConfig = true;
    } else if ((/^(--no-shorten|-ns)$/).test(arg)) {
      options.shorten = false;
    } else if ((/^(--parallel|-p)$/).test(arg)) {
      currentType = 'parallel';
    } else if ((/^(--series|-s)$/).test(arg)) {
      currentType = 'series';
    } else {
      const lastTask = options.tasks[options.tasks.length - 1];
      const scripts = scriptMatches(arg);

      if (lastTask && lastTask.type === currentType) {
        lastTask.scripts = lastTask.scripts.concat(scripts);
      } else {
        options.tasks.push({type: currentType, scripts});
      }
    }
  }

  if (options.printConfig) {
    delete config.scripts;
    delete config.pkg;
    console.log(JSON.stringify(config, null, 2));
    process.exit(0);
  }

  const con = filter(options);

  if (options.version) {
    con.log(pkg.version);
    process.exit();
  }

  if (options.help) {
    usage();
    process.exit();
  }

  if (options.list) {
    const sources = {};

    // get all scripts by their source aka, where they are from
    Object.keys(config.scripts).forEach(function(scriptName) {
      config.scripts[scriptName].forEach(function(scriptObj) {
        sources[scriptObj.source] = sources[scriptObj.source] || {};
        sources[scriptObj.source][scriptName] = scriptObj.command;
      });
    });

    // print scripts based on where they come from
    con.log();
    Object.keys(sources).sort().forEach(function(source) {
      con.log(source + ':');

      Object.keys(sources[source]).sort().forEach(function(scriptName) {
        con.log('  "' + scriptName + '": "' + sources[source][scriptName] + '"');
      });
      con.log();
    });
    process.exit(0);
  }

  if (!options.tasks.length) {
    con.error('Must specify a script to run with -s, -p, or without an arg');
    process.exit(1);
  }

  // run through each task, before going to the next one
  return mapSeriesPromise(options.tasks, function(task) {
    if (task.type === 'series') {
      return mapSeriesPromise(task.scripts, (s) => runScript(npmp, con, s, options.subArgs));
    }

    return mapPromise(task.scripts, (s) => runScript(npmp, con, s, options.subArgs));
  });
};

// if we are run as a binary:
// * node npmp
// * ./npmp

/* istanbul ignore if */
if (require.main === module) {
  const final = (result) => process.exit(result.code);

  npmp(process.argv.splice(2)).then(final).catch(final);
}

module.exports = npmp;
