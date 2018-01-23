'use strict';

const config = require('./config');

const scriptMatches = function(scriptName) {
  if (!(/\*/).test(scriptName)) {
    return [scriptName];
  }

  scriptName = scriptName.replace('*', '');

  const regex = RegExp(`^${scriptName}[^:]*$`);

  return Object.keys(config.scripts)
    .filter((name) => regex.test(name));
};

module.exports = scriptMatches;
