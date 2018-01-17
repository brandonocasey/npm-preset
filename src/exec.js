const config = require('./config');
const Promise = require('bluebird');
const cpExec = require('child_process').exec;
// 10 megabytes
const TEN_MB = 10485760;

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
const exec = function(command) {
  return new Promise((resolve, reject) => {
    const child = cpExec(command, {
      maxBuffer: TEN_MB,
      cwd: config.root,
      env: process.env,
      shell: true
    });

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    const kill = () => child.kill();

    process.on('SIGINT', kill);
    process.on('SIGQUIT', kill);
    process.on('exit', kill);

    child.on('close', function(code, signal) {
      if (code === 0) {
        return resolve({code});
      }

      reject({code});
    });

    return child;
  });
};

module.exports = exec;
