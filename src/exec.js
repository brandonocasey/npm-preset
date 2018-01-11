const config = require('./config');
const Promise = require('bluebird');
const exec = require('child_process').exec;

/**
 * Run a command on the terminal and attatch that command
 * to our current terminal. The output is also shortened to prevent
 * long absolute paths from leaking into the output.
 *
 * @param {string} command
 *        The command to run in an array form.
 *
 * @returns {Promise}
 *          A promise that is resolved when the command exits
 */
const spawn = function(command) {
  return new Promise((resolve, reject) => {
    const child = exec(command, {
      cwd: config.root,
      env: process.env,
      shell: true
    });

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on('close', function(code, signal) {
      if (code === 0) {
        return resolve({code});
      }

      reject({code});
    });

    return child;
  });
};

module.exports = spawn;
