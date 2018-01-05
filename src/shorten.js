const config = require('./config');
const path = require('path');

/**
 * shorten npm-scripts paths so that we dont print
 * obnoxiously long path strings to terminal
 *
 * @param {string} str
 *        The string to shorten
 *
 * @return {string}
 *         The shortened string
 */
const shorten = function(str) {
  if (!str) {
    return str;
  }

  if (str && str.toString) {
    str = str.toString();
  }
  str = str
    .replace(new RegExp(config.root + path.sep, 'g'), '')
    .replace(new RegExp(config.root, 'g'), '')
    .replace(new RegExp(path.join(__dirname, '..'), 'g'), '<npms>');

  (config.npmScripts.presets || []).forEach(function(presetName) {
    str = str
      .replace(new RegExp('<npms>-preset-' + presetName, 'g'), '<npms-' + presetName + '>');
  });

  return str;
};

module.exports = shorten;
