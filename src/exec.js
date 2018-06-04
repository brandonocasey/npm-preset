'use strict';

const config = require('./config');
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
 * @return {Promise}
 *          A promise that is resolved when the command exits
 */
const exec = function(con, command) {
  return new Promise((resolve, reject) => {
    const child = cpExec(command, {
      maxBuffer: TEN_MB,
      cwd: config.root,
      env: process.env,
      shell: true
    });

    child.stdout.on('data', (d) => {
      con.stdout(d);
    });
    child.stderr.on('data', (d) => {
      con.stderr(d);
    });
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
