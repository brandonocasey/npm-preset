## MUST DO
* Check benchmarks after: https://github.com/nodejs/node/issues/17058
* tab complete via https://www.npmjs.com/package/tabtab
* remove vjs specifics
  * eslint -> prettier
  * convention-changelog
  * remark-lint
* --verify to run npm preset verification
* --update-npm-lifecycle to update npm.scrpits with lifecycle scripts

## Stretch Goals
* error colors (emulate npm?)
* Support a log file?
* cleanup arguments in runScript, exec, and runCommand
* can we run npmp with some special shell ops?

## Blocked
* use a pty to spawn children so that we can always have colors, but it also must have stdout/stderr
  * https://github.com/nodejs/node-v0.x-archive/issues/2754
