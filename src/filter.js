'use strict';
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

const intercept = function(stdoutIntercept, stderrIntercept) {
  const interceptors = {
    stderr: stderrIntercept || stdoutIntercept,
    stdout: stdoutIntercept
  };
  const oldWrite = {
    stdout: process.stdout.write,
    stderr: process.stderr.write
  };

  Object.keys(interceptors).forEach((fd) => {
    // skip interceptors with a value of false;
    if (interceptors[fd] === false) {
      return;
    }
    process[fd].write = function() {
      // using array.splice would mean that this function
      // could not be optimized
      // see https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
      const args = new Array(arguments.length);

      for (let i = 0; i < args.length; ++i) {
        // i is always valid index in the arguments object
        args[i] = arguments[i];
      }

      args[0] = interceptors[fd](args[0], stdoutIntercept);

      oldWrite[fd].apply(process[fd], args);
    };
  });

  /*
  // restore
  return () => Object.keys(oldWrite).forEach((fd) => {
    process[fd].write = oldWrite[fd];
  });*/
};

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

  regexes.forEach(function(regex) {
    str = str.replace(regex.find, regex.replace);
  });
  return str;
};

const filter = function(options) {
  options = options || {};

  let stderrFilter = false;
  let stdoutFilter = false;

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

  intercept(stdoutFilter, stderrFilter);
};

module.exports = filter;
