'use strict';

const config = require('./config');

const scriptMatches = function(scriptName) {
  if (!(/\*/).test(scriptName)) {
    return [scriptName];
  }

  const regex = RegExp(`^${scriptName.replace('*', '')}[^:]*$`);

  return Object.keys(config.scripts)
    .filter((name) => regex.test(name));
};

module.exports = scriptMatches;
