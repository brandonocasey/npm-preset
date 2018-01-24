'use strict';
/* eslint-disable no-console */
/* eslint-disable max-len */

const exec = require('./exec');
const config = require('./config');
const scripts = config.scripts;
const mapPromise = require('./map-promise');
const path = require('path');
const npmpRelative = path.join('node_modules', '.bin') + path.sep;
const npmpAbsolute = path.join(config.root, npmpRelative) + path.sep;
const npmpRegex = RegExp(`^(\./)?(${npmpRelative}|${npmpAbsolute})?(npmp|npm-preset)`);
const shellQuote = require('shell-quote');

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
const runCommand = function(npmp, con, scriptName, source, cmd, args) {
  const command = cmd + ' ' + args.join(' ');

  // mimic npm output
  if (!process.env.NPM_PRESET_COMMANDS_ONLY || process.env.NPM_PRESET_COMMANDS_ONLY !== '1') {
    con.log();
    con.log('> ' + config.name + '@' + config.pkg.version + ' ' + scriptName + ' (' + source + ') ' + config.root);
    con.log('> ' + command);
    con.log();
  }

  if (npmpRegex.test(command)) {
    // parse the command and remove npmp binary from the front
    const commandArray = shellQuote.parse(command).splice(1);

    // if we parse any special shell characters we cant
    // just call npmp
    if (!commandArray.some((c) => typeof c !== 'string')) {
      return npmp(commandArray);
    }
  }

  return exec(con, command);

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
const runScript = function(npmp, con, scriptName, subargs) {
  const args = subargs || [];

  if (Object.keys(scripts).indexOf(scriptName) === -1) {
    con.error('missing script: ' + scriptName);
    process.exit(1);
  }

  let p = Promise.resolve({code: 0});

  if (scripts['pre' + scriptName]) {
    p = runScript(npmp, con, 'pre' + scriptName);
  }

  return p.then(function(result) {

    // run any scripts with the same name in parallel
    return mapPromise(scripts[scriptName], (scriptObject) => {
      return runCommand(npmp, con, scriptName, scriptObject.source, scriptObject.command, args);
    });
  }).then(function(result) {
    if (scripts['post' + scriptName]) {
      return runScript(npmp, con, 'post' + scriptName);
    }
    return Promise.resolve(result);
  });
};

module.exports = runScript;
