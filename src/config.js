/* eslint-disable no-console */
const findRoot = require('find-root');
const path = require('path');

/**
 * The config contains anything that might be needed from the package.json
 * of the project that is using npm script.
 */
let dir = process.cwd();

if (!path.isAbsolute(dir)) {
  dir = path.join(process.cwd(), dir);
}

const appRoot = findRoot(dir);
const appPkg = require(path.join(dir, 'package.json'));
const name = appPkg.name.replace(/^@.+\//, '');
const scope = appPkg.name.replace(name, '').replace(/\/$/, '');
let author = appPkg.author || '';

if (typeof appPkg.author === 'object') {
  if (!appPkg.author.name) {
    console.error('author must have a name key or be a string in package.json!');
    console.error('See: https://docs.npmjs.com/files/package.json#people-fields-author-contributors');
  }
  author = appPkg.author.name || '';
  if (appPkg.author.email) {
    author += ' <' + appPkg.author.email + '>';
  }
  if (appPkg.author.url) {
    author += ' (' + appPkg.author.url + ')';
  }
}

appPkg.author = author;
appPkg.fullName = appPkg.name;
appPkg.name = name;
appPkg.scope = scope;

const moduleName = name.split('-').map(function(item, index) {
  if (index === 0) {
    return item;
  }

  // uppercase first letter
  return item.charAt(0).toUpperCase() + item.slice(1);
}).join('');

const config = {
  author,
  name,
  moduleName,
  scope,
  root: appRoot,
  pkg: appPkg,
  npmScript: appPkg['npm-script'] || {}
};

(config.npmScript.presets || []).forEach(function(presetName) {
  if (!(/^npm-script-preset-/).test(presetName)) {
    presetName = 'npm-script-preset-' + presetName;
  }

  const presetPath = path.join(config.root, 'node_modules', presetName);
  const presetPkg = require(path.join(presetPath, 'package.json'));

  if (!presetPkg.main) {
    console.error('Preset ' + presetName + ' does not have a main file!');
    process.exit(1);
  }
  let scripts = require(path.join(presetPath, presetPkg.main));

  process.env.PATH += ':' + path.join(presetPath, 'node_modules', '.bin');

  if (typeof scripts === 'function') {
    scripts = scripts(config);
  }

  Object.assign(config.pkg.scripts, scripts);
});

module.exports = config;
