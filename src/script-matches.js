const config = require('./config');

const scriptMatches = function(scriptName) {
  if (!(/\*/).test(scriptName)) {
    return [scriptName];
  }

  scriptName = scriptName.replace('*', '');

  return Object.keys(config.scripts)
    .filter((name) => (new RegExp(`^${scriptName}[^:]*$`)).test(name));
};

module.exports = scriptMatches;
