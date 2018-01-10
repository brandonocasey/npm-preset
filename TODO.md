## Tests
* usage
* sub args
* no tasks
* no scripts
* complex author name
* invalid script
* stderr in child
* child spawn error
* killing parent kills child?

## Stretch Goals
* error colors (emulate npm?)
* Support a log file?

## Blocked
* use a pty to spawn children so that we can always have colors, but it also must have stdout/stderr
  * https://github.com/nodejs/node-v0.x-archive/issues/2754
