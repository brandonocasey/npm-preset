'use strict';
/* eslint-disable no-console */
/* eslint-disable max-len */

const exec = require('./exec');
const config = require('./config');
const scripts = config.scripts;
const mapPromise = require('./map-promise');

/**
 * Run a command on the terminal
 *
 * @param {string} scriptName
 *        Only passed so that we can emulate npm logging
 *
 * @param {string} source
 *        where this script comes from, can be npm-preset, or a preset name
 *
 * @param {string} cmd
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
const runCommand = function(scriptName, source, cmd, args) {
  const command = cmd + ' ' + args.join(' ');

  // mimic npm output
  if (!process.env.NPM_PRESET_COMMANDS_ONLY || process.env.NPM_PRESET_COMMANDS_ONLY !== '1') {
    console.log();
    console.log('> ' + config.name + '@' + config.pkg.version + ' ' + scriptName + ' (' + source + ') ' + config.root);
    console.log('> ' + command);
    console.log();
  }

  return exec(command);
};

/**
 * Runs an npm script by name
 *
 * @param {string} scriptName
 *        The name of the npm script to run, ex: build:thing:thing
 *
 * @param {Array} subargs
 *        An array of args that should be passed when running the script
 *
 * @return {Promise}
 *         A promise that is resolved/rejected when the script pre-scripts, and
 *         post scripts have been run or errored.
 */
const runScript = function(scriptName, subargs) {
  const args = subargs || [];

  if (Object.keys(scripts).indexOf(scriptName) === -1) {
    console.error('missing script: ' + scriptName);
    process.exit(1);
  }

  let p = Promise.resolve({code: 0});

  if (scripts['pre' + scriptName]) {
    p = runScript('pre' + scriptName);
  }

  return p.then(function(result) {

    // run any scripts with the same name in parallel
    return mapPromise(scripts[scriptName], (scriptObject) => {
      return runCommand(scriptName, scriptObject.source, scriptObject.command, args);
    });
  }).then(function(result) {
    if (scripts['post' + scriptName]) {
      return runScript('post' + scriptName);
    }
    return Promise.resolve(result);
  });
};

module.exports = runScript;
