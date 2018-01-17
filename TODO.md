## MUST DO
* verify the PATH changes
* check https://www.npmjs.com/package/immutable
* make our own find-root that will stop on the first package.json it finds based on process.cwd
* detect npmp usage, export npmp as a module and re-use it

## Stretch Goals
* error colors (emulate npm?)
* Support a log file?

## Blocked
* use a pty to spawn children so that we can always have colors, but it also must have stdout/stderr
  * https://github.com/nodejs/node-v0.x-archive/issues/2754
