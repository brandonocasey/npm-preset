const config = require('./config');
const path = require('path');
const intercept = require('intercept-stdout');

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

  config.npmPreset.presets.forEach(function(preset) {
    str = str
      .replace(new RegExp(preset.path, 'g'), '<npmp-' + preset._shortname + '>')
      .replace(new RegExp(preset._realpath, 'g'), '<npmp-' + preset._shortname + '>')
      .replace(new RegExp(preset._localpath, 'g'), '<npmp-' + preset._shortname + '>');
  });

  str = str.replace(new RegExp(path.join(__dirname, '..'), 'g'), '<npmp>');
  return str;
};

const filter = function(options) {
  let stderrFilter = (s) => s;
  let stdoutFilter = (s) => s;

  if (!options.shorten || process.env.NPM_PRESET_NO_SHORTEN === '1') {
    process.env.NPM_PRESET_NO_SHORTEN = '1';
  } else {
    // shorten stdout and stderr
    stderrFilter = shorten;
    stdoutFilter = shorten;
  }

  if (options.quiet || process.env.NPM_PRESET_QUIET === '1') {
    process.env.NPM_PRESET_QUIET = '1';
    // never print stdout
    stdoutFilter = (s) => '';
  }

  if (options.silent || process.env.NPM_PRESET_SILENT === '1') {
    process.env.NPM_PRESET_SILENT = '1';
    // never print stdout
    stdoutFilter = (s) => '';

    // never print stderr
    stderrFilter = (s) => '';
  }

  if (options.commandsOnly || process.env.NPM_PRESET_COMMANDS_ONLY === '1') {
    process.env.NPM_PRESET_COMMANDS_ONLY = '1';
  }

  intercept(stdoutFilter, stderrFilter);
};

module.exports = filter;
