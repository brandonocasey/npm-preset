// taken from https://docs.npmjs.com/misc/scripts
'use strict';

const config = require('./config');
const fs = require('fs');
const path = require('path');
const lifeCycleScripts = [
  'prepublish',
  'prepare',
  'prepublishOnly',
  'prepack',
  'postpack',
  'publish',
  'preinstall',
  'install',
  'preuninstall',
  'postuninstall',
  'preversion',
  'version',
  'postversion',
  'pretest',
  'prestop',
  'prestart',
  'prerestart',
  'preshrinkwrap'
];

const saveNpm = function() {
  const scriptNames = Object.keys(config.scripts);

  config.pkg.scripts = config.pkg.scripts || {};

  scriptNames.forEach(function(s) {
    if (lifeCycleScripts.indexOf(s) !== -1) {
      config.pkg.scripts[s] = `npmp ${s}`;
    }
  });

  fs.writeFileSync(path.join(config.root, 'package.json'), JSON.stringify(config.pkg, null, 2));
};

module.exports = saveNpm;
