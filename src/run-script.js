/* eslint-disable no-console */
/* eslint-disable max-len */

const spawn = require('./spawn');
const Promise = require('bluebird');
const config = require('./config');
const shellQuote = require('shell-quote');
const scripts = config.pkg.scripts;

/**
 * Run a command on the terminal
 *
 * @param {string} scriptName
 *        Only passed so that we can emulate npm logging
 *
 * @param {string} c
 *        The value of the script, ie the actual command to run for the script.
 *        If the command contains npm run we assume it is a script, and return to
 *        runScript with it an any args
 *
 * @param {Array} args
 *        Args that were passed along to this script, these will not be passed again
 *        if the command is another script.
 *
 * @return {Promise}
 *         A promise that is resolved when the script or command that was run finishes
 */
const runCommand = function(scriptName, command, args) {
  command = shellQuote.parse(command);
  command = command.map(function(c) {
    if (typeof c === 'object') {
      if (c.op === 'glob') {
        return c.pattern;
      }
      if (c.op === ';') {
        return ';';
      }

      if (c.op === '&&') {
        return '&&';
      }

      console.warn(c.op + ' is not yet supported');
    }
    return c;
  });
  command = command.concat(args);

  // mimic npm output
  if (!process.env || !process.env.NPM_SCRIPT_COMMANDS_ONLY) {
    console.log();
    console.log('> ' + config.name + '@' + config.pkg.version + ' ' + scriptName + ' ' + config.root);
    console.log('> ' + command.join(' '));
    console.log();
  }

  return spawn(command);
};

/**
 * Runs an npm script by name
 *
 * @param {string} scriptName
 *        The name of the npm script to run, ex: build:thing:thing
 *
 * @param {Array} args
 *        An array of args that should be passed when running the script
 *
 * @return {Promise}
 *         A promise that is resolved/rejected when the script pre-scripts, and
 *         post scripts have been run or errored.
 */
const runScript = function(scriptName, args = []) {
  if (Object.keys(scripts).indexOf(scriptName) === -1) {
    console.error('missing script: ' + scriptName);
    process.exit(1);
  }

  return new Promise(function(resolve, reject) {
    if (scripts['pre' + scriptName]) {
      return resolve(runScript('pre' + scriptName));
    }

    return resolve({exitCode: 0});
  }).then(function(result) {
    return runCommand(scriptName, scripts[scriptName], args);
  }).then(function(result) {
    if (scripts['post' + scriptName]) {
      return runScript('post' + scriptName);
    }
    return Promise.resolve(result);
  });
};

module.exports = runScript;
