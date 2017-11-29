#!/usr/bin/env node

var config = require('./config');
var runScript = require('./run-script');
var scriptName = process.argv[2];

// scripts can be passed args by passing -- and then the args:
// build:test -- arg1 arg2
var scriptArgsStartIndex = process.argv.indexOf('--');
var scriptArgs = [];

if (scriptArgsStartIndex !== -1) {
	scriptArgs = process.argv.splice(scriptArgsStartIndex + 1);
}

if (!config.pkg.scripts || !Object.keys(config.pkg.scripts).length) {
	console.error('There are no npm scripts to run, please add some!');
	process.exit(1);
}

if (scriptName === '--help') {
	console.log(config.pkg.scripts);
	process.exit(0);
}

if (scriptName === '--config') {
  console.log(JSON.stringify(config, null, 2));
  process.exit(0);
}

runScript(scriptName, scriptArgs).then(function() {
	process.exit(0);
}).error(function(error) {
	console.error(error);
	process.exit(1);
});
