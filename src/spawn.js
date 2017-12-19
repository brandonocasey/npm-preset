const config = require('./config');
const shellQuote = require('shell-quote');
const npmRun = require('npm-run');
const Promise = require('bluebird');
const jsonConfig = JSON.stringify(config);

/**
 * Run a command on the terminal and attatch that command
 * to our current terminal. The output is also shortened to prevent
 * long absolute paths from leaking into the output.
 *
 * @param {Array} command
 *        The command to run in an array form.
 *
 * @returns {Promise}
 *          A promise that is resolved when the command exits
 */
const spawn = function(command) {
  process.setMaxListeners(1000);

  return new Promise(function(resolve, reject) {

    const bin = command.shift();
    let child = npmRun.spawn(bin, command, {cwd: config.root, env: {FORCE_COLOR: true, NPM_SCRIPT_CONFIG: jsonConfig}});

    child.stdout.on('data', function(chunk) {
      process.stdout.write(chunk);
    });

    child.stderr.on('data', function(chunk) {
      process.stderr.write(chunk);
    });

    process.on('exit', function() {
      if (child) {
        child.kill();
      }
    });

    child.on('close', function(exitCode) {
      child = null;
      if (exitCode !== 0) {
        process.exit(exitCode);
      }
      resolve();
    });
  });
};

module.exports = spawn;
