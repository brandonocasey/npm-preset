const config = require('./config');
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
    const env = process.env;

    env.NPM_SCRIPT_CONFIG = jsonConfig;
    env.FORCE_COLOR = true;

    const bin = command.shift();
    let child = npmRun.spawn(bin, command, {cwd: config.root, env, shell: true});

    child.stdout.on('data', function(chunk) {
      process.stdout.write(chunk);
    });

    child.stderr.on('data', function(chunk) {
      process.stderr.write(chunk);
    });

    child.on('error', function(error) {
      throw error;
    });

    process.on('exit', function() {
      if (child) {
        child.kill();
      }
    });

    child.on('close', function(exitCode) {
      child = null;
      if (exitCode !== 0) {
        return reject({exitCode});
      }
      return resolve({exitCode});
    });
  });
};

module.exports = spawn;
