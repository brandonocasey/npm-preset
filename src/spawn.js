const config = require('./config');
const shellQuote = require('shell-quote');
const npmRun = require('npm-run');
const Promise = require('bluebird');

/**
 * Run a command on the terminal and attatch that command
 * to our current terminal. The output is also shortened to prevent
 * long absolute paths from leaking into the output.
 *
 * @param {string|Array} command
 *        The command to run in string or array form. Array is preffered
 *
 * @returns {Promise}
 *          A promise that is resolved when the command exits
 */
const spawn = function(command) {
  process.setMaxListeners(1000);

  return new Promise(function(resolve, reject) {
    let args = command;

    if (!Array.isArray(command)) {
      args = shellQuote.parse(command);
    }
    const bin = args.shift();
    let child = npmRun.spawn(bin, args, {cwd: config.root, env: {FORCE_COLOR: true}});

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
