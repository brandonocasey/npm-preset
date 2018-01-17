const config = require('./config');
const path = require('path');

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
    process[fd].write = function(...args) {
      args[0] = interceptors[fd](args[0], stdoutIntercept);

      oldWrite[fd].apply(process[fd], args);
    };
  });

  // restore
  return () => Object.keys(oldWrite).forEach((fd) => {
    process[fd].write = oldWrite[fd];
  });
};

// prebuild shorten regexes
const regexes = [
  {find: RegExp(config.root + path.sep, 'g'), replace: ''},
  {find: RegExp(config.root, 'g'), replace: ''}
];

config.npmPreset.presets.forEach(function(preset) {
  regexes.push({find: RegExp(preset.path, 'g'), replace: '<npmp-' + preset._shortname + '>'});
  regexes.push({find: RegExp(preset._realpath, 'g'), replace: '<npmp-' + preset._shortname + '>'});
  regexes.push({find: RegExp(preset._localpath, 'g'), replace: '<npmp-' + preset._shortname + '>'});
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
