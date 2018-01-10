const config = require('./config');
const jsonConfig = JSON.stringify(config);
const execa = require('execa');

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
  const env = process.env;

  env.FORCE_COLOR = '1';
  env.NPM_PRESET_CONFIG = jsonConfig;

  const child = execa(command, {
    cwd: config.root,
    env,
    shell: true
  });

  child.stdout.on('data', function(chunk) {
    process.stdout.write(chunk);
  });

  child.stderr.on('data', function(chunk) {
    process.stderr.write(chunk);
  });

  return child;
};

module.exports = spawn;
