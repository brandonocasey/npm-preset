#!/usr/bin/env node
const tabtab = require('tabtab');
const scripts = Object.keys(require('./config').scripts);
const debug = require('tabtab/lib/debug')('tabtab:npmp');
const tab = tabtab({name: 'npmp', cache: false});
const opts = [
  '-p', '--parallel',
  '-s', '--series', '--serial',
  '-sn', '--save-npm',
  '-sh', '--save-husky',
  '-c', '--completion',
  '-V', '--version',
  '-h', '--help',
  '-q', '--quiet',
  '-l', '--list',
  '-si', '--silent',
  '-co', '--commands-only',
  '-pc', '--print-config',
  '-ns', '--no-shorten'
];

const handleBin = function(data, done) {
  debug('here');
  // suggest flags if -- is used or there are no scripts
  if ((/^--?/).test(data.last) || !Object.keys(scripts).length) {
    done(null, opts);
  }

  // otherwise only suggest scripts
  done(null, scripts);
};

tab.on('npmp', handleBin);
tab.on('npm-preset', handleBin);

tab.start();
