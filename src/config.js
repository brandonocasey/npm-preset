import findRoot from 'find-root';
import path from 'path';
import pathExists from './path-exists';
import fs from 'fs';

let config;

if (process.env.NPM_PRESET_CONFIG) {
  config = JSON.parse(process.env.NPM_PRESET_CONFIG);
} else {
  /* eslint-disable no-console */
  const PATH = process.env.PATH.split(':');

  PATH.unshift(path.join(__dirname, 'node_modules', '.bin'));

  /**
  * The config contains anything that might be needed from the package.json
  * of the project that is using npm script.
  */
  let dir = process.cwd();

  /* istanbul ignore if */
  if (!path.isAbsolute(dir)) {
    dir = path.join(process.cwd(), dir);
  }

  const appRoot = findRoot(dir);
  const appPkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json')));
  const name = appPkg.name.replace(/^@.+\//, '');
  const scope = appPkg.name.replace(name, '').replace(/\/$/, '');
  let author = appPkg.author || '';

  if (typeof appPkg.author === 'object') {
    author = appPkg.author.name || '';

    if (appPkg.author.email) {
      author += ' <' + appPkg.author.email + '>';
    }
    if (appPkg.author.url) {
      author += ' (' + appPkg.author.url + ')';
    }
  }

  const moduleName = name.split('-').map(function(item, index) {
    if (index === 0) {
      return item;
    }

    // uppercase first letter
    return item.charAt(0).toUpperCase() + item.slice(1);
  }).join('');

  config = {
    author,
    name,
    scope,
    moduleName,
    root: appRoot,
    pkg: appPkg,
    scripts: {},
    npmPreset: appPkg['npm-preset'] || {}
  };

  // if not presets are listed
  // see if we can find any installed presets
  if (!config.npmPreset.presets) {
    const packages = Object.keys(config.pkg.dependencies || {}).concat(Object.keys(config.pkg.devDependencies || {}));

    config.npmPreset.presets = packages.filter((packageName) => (/npm-preset-.*$/).test(packageName));
  }

  config.npmPreset.presets = config.npmPreset.presets || [];
  config.npmPreset.scripts = config.npmPreset.scripts || {};

  const addScript = function(scriptName, obj) {
    config.scripts[scriptName] = config.scripts[scriptName] || [];
    config.scripts[scriptName].push(obj);
  };

  Object.keys(config.npmPreset.scripts).forEach(function(scriptName) {
    addScript(scriptName, {command: config.npmPreset.scripts[scriptName], source: 'npm-preset'});
  });

  config.npmPreset.presets = config.npmPreset.presets.map(function(preset) {
    if (typeof preset === 'string') {
      preset = {name: preset};
    }

    if (!preset.path) {
      const nodeModules = path.join(config.root, 'node_modules');

      if (!preset.path && pathExists(path.join(nodeModules, 'npm-preset-' + preset.name))) {
        preset.name = 'npm-preset-' + preset.name;
        preset.path = path.join(nodeModules, preset.name);
      } else if (!preset.path && pathExists(path.join(nodeModules, preset.name))) {
        preset.path = path.join(nodeModules, preset.name);
      } else {
        console.error('ERROR: Could not find ' + preset.name + ', is it installed?');
        process.exit(1);
      }
    }

    let scripts = require(preset.path);

    PATH.unshift(path.join(preset.path, 'node_modules', '.bin'));

    if (typeof scripts === 'function') {
      scripts = scripts(config);
    }

    if (typeof scripts !== 'object' || Object.keys(scripts).length === 0) {
      console.error('ERROR: ' + preset.name + ' does not export any scripts');
      process.exit(1);
    }

    Object.keys(scripts).forEach(function(scriptName) {
      addScript(scriptName, {command: scripts[scriptName], source: preset.name});
    });

    preset._shortname = preset.name.replace(/^npm-preset-/, '');
    preset._realpath = fs.realpathSync(preset.path);
    preset._localpath = path.relative(config.root, preset.path);

    return preset;
  });

  // put the path to config.root first as that is the local project and should have
  // priority
  PATH.unshift(path.join(config.root, 'node_modules', '.bin'));

  process.env.PATH = PATH.join(':');
  process.env.NPM_PRESET_CONFIG = JSON.stringify(config);
  process.env.FORCE_COLOR = 1;
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
}

export default config;
