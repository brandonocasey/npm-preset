// taken from https://docs.npmjs.com/misc/scripts
'use strict';
const config = require('./config');
const fs = require('fs');
const path = require('path');
const gitHooks = [
  'applypatch-msg',
  'commit-msg',
  'post-applypatch',
  'post-checkout',
  'post-commit',
  'post-merge',
  'post-receive',
  'post-rewrite',
  'post-update',
  'pre-applypatch',
  'pre-auto-gc',
  'pre-commit',
  'pre-push',
  'pre-rebase',
  'pre-receive',
  'prepare-commit-msg',
  'push-to-checkout',
  'update',
  'sendemail-validate'
];
const huskyHooks = gitHooks.map((h) => h.replace(/-/g, ''));
const saveHusky = function() {
  const scriptNames = Object.keys(config.scripts);

  config.pkg.scripts = config.pkg.scripts || {};

  scriptNames.forEach(function(s) {
    if (huskyHooks.indexOf(s) !== -1) {
      config.pkg.scripts[s] = `npmp ${s}`;
    }
  });

  fs.writeFileSync(path.join(config.root, 'package.json'), JSON.stringify(config.pkg, null, 2));
};

module.exports = saveHusky;
