## MUST DO
* Check benchmarks after: https://github.com/nodejs/node/issues/17058

## Stretch Goals
* error colors (emulate npm?)
* Support a log file?

## Blocked
* use a pty to spawn children so that we can always have colors, but it also must have stdout/stderr
  * https://github.com/nodejs/node-v0.x-archive/issues/2754
