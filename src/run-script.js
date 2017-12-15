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
const runCommand = function(scriptName, c, args) {
  // mimic npm output
  console.log();
  console.log('> ' + config.name + '@' + config.pkg.version + ' ' + scriptName + ' ' + config.root);
  console.log('> ' + c);
  console.log();

  c = shellQuote.parse(c);

  if (c[0] === 'npm' && c[1] === 'run') {
    // remove npm
    c.splice(0, 1);
    // remove run
    c.splice(0, 1);

    let subArgs = [];
    const subArgStartIndex = c.indexOf('--');

    if (subArgStartIndex !== -1) {
      // remove --
      c.splice(subArgStartIndex, 1);

      subArgs = c.splice(subArgStartIndex);
    }

    const subScript = c.join('');

    return runScript(subScript, subArgs);
  }

  c = c.concat(args);
  return spawn(c);
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
const runScript = function(scriptName, args) {
  if (Object.keys(scripts).indexOf(scriptName) === -1) {
    console.error('missing script: ' + scriptName);
    process.exit(1);
  }
  args = args || [];
  return new Promise(function(resolve, reject) {

    if (scripts['pre' + scriptName]) {
      return resolve(runScript('pre' + scriptName));
    }

    return resolve();
  }).then(function() {
    const commands = scripts[scriptName];
    const promises = [];

    if (!Array.isArray(commands)) {
      return runCommand(scriptName, commands, args);
    }

    let i = commands.length;

    // find any scripts that will run in parallel. Then run/remove them
    // ex:
    // [['test1', 'test2'], [test3]]
    // test1 will run followed by test 2, and
    // test 3 will run at the same time as test1 is waiting for test2
    //
    // [[test1], [test2], [test3]]
    // all tests run in parallel
    //
    // [test1, test2, test3]
    // all tests run in sequence
    while (i--) {
      const command = commands[i];

      if (Array.isArray(command)) {
        promises.push(Promise.mapSeries(command, function(seriesCommand) {
          return runCommand(scriptName, seriesCommand);
        }));
        commands.splice(i, 1);
      }
    }

    // leftover scripts to run in series
    // ex:
    // [['test1', 'test2'], test3, test4]
    // the first array ['test1, 'test2'] will be removed above
    // so we will run test3 then test 4 here
    promises.push(Promise.mapSeries(commands, function(seriesCommand) {
      return runCommand(scriptName, seriesCommand);
    }));

    // well all scripts are done, move on to post
    return Promise.all(promises);
  }).then(function() {
    if (scripts['post' + scriptName]) {
      return runScript('post' + scriptName);
    }
    return Promise.resolve();
  });
};

module.exports = runScript;
