'use strict';
/* eslint-disable no-console */
/* eslint-disable max-len */
const config = require('./config');
const path = require('path');
const silence = (s) => '';

// prebuild shorten regexes
const regexes = [
  {find: RegExp(`${config.root}${path.sep}?`, 'g'), replace: ''}
];

config.npmPreset.presets.forEach(function(p) {
  regexes.push({
    find: RegExp(`${p.path}|${p._realpath}|${p._localpath}`, 'g'),
    replace: `<npmp-${p._shortname}>`
  });
});

regexes.push({find: RegExp(path.join(__dirname, '..'), 'g'), replace: '<npmp>'});

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
  let newstring = str;

  /* istanbul ignore if */
  if (!newstring || typeof newstring !== 'string') {
    return newstring;
  }

  regexes.forEach(function(regex) {
    newstring = newstring.replace(regex.find, regex.replace);
  });
  return newstring;
};

const filter = function(options) {
  options = options || {};

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
    stdoutFilter = silence;
  }

  if (options.silent || process.env.NPM_PRESET_SILENT === '1') {
    process.env.NPM_PRESET_SILENT = '1';
    // never print stdout
    stdoutFilter = silence;

    // never print stderr
    stderrFilter = silence;
  }

  if (options.commandsOnly || process.env.NPM_PRESET_COMMANDS_ONLY === '1') {
    process.env.NPM_PRESET_COMMANDS_ONLY = '1';
  }

  return {
    stdout() {
      let i = arguments.length;
      let args = [];

      while (i--) {
        args[i] = arguments[i];
      }

      args = args
        .map((a) => stdoutFilter(a))
        .filter((a) => a.length > 0)
        .forEach((a) => process.stdout.write(a));
    },
    stderr() {
      let i = arguments.length;
      let args = [];

      while (i--) {
        args[i] = arguments[i];
      }

      args = args
        .map((a) => stderrFilter(a))
        .filter((a) => a.length > 0)
        .forEach((a) => process.stderr.write(a));
    },
    log() {
      let i = arguments.length;
      let args = [];

      while (i--) {
        args[i] = arguments[i];
      }

      args = args
        .map((a) => stdoutFilter(a));

      console.log.apply(console, args);
    },
    error() {
      let i = arguments.length;
      let args = [];

      while (i--) {
        args[i] = arguments[i];
      }

      args = args
        .map((a) => stderrFilter(a));

      console.error.apply(console, args);
    }
  };

};

module.exports = filter;
