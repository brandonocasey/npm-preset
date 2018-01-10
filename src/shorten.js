const config = require('./config');
const path = require('path');

/**
 * shorten npm-preset paths so that we dont print
 * obnoxiously long path strings to terminal
 *
 * @param {string} str
 *        The string to shorten
 *
 * @return {string}
 *         The shortened string
 */
const shorten = function(str) {
  /* istanbul ignore if */
  if (!str) {
    return str;
  }

  if (str && str.toString) {
    str = str.toString();
  }

  str = str
    .replace(new RegExp(config.root + path.sep, 'g'), '')
    .replace(new RegExp(config.root, 'g'), '');

  config.npmScripts.presets.forEach(function(preset) {
    str = str
      .replace(new RegExp(preset.path, 'g'), '<npmp-' + preset._shortname + '>')
      .replace(new RegExp(preset._realpath, 'g'), '<npmp-' + preset._shortname + '>')
      .replace(new RegExp(preset._localpath, 'g'), '<npmp-' + preset._shortname + '>');
  });

  str = str.replace(new RegExp(path.join(__dirname, '..'), 'g'), '<npmp>');
  return str;
};

module.exports = shorten;
