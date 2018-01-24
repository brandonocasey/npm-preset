<a name="1.4.0"></a>
# [1.4.0](https://github.com/brandonocasey/npm-preset/compare/v1.3.1...v1.4.0) (2018-01-24)

### Chores

* create changelog and automate release update ([6937cd0](https://github.com/brandonocasey/npm-preset/commit/6937cd0))

### Performance Improvements

* add npm with npm-run-all to benchmark tests ([70bc9ff](https://github.com/brandonocasey/npm-preset/commit/70bc9ff))
* major speedup - only create npmp child sometimes ([2ec39aa](https://github.com/brandonocasey/npm-preset/commit/2ec39aa))
* remove optimization killers ([e21e204](https://github.com/brandonocasey/npm-preset/commit/e21e204))

<a name="1.3.1"></a>
## [1.3.1](https://github.com/brandonocasey/npm-preset/compare/v1.3.0...v1.3.1) (2018-01-23)

### Bug Fixes

* node4 ([1a0cdee](https://github.com/brandonocasey/npm-preset/commit/1a0cdee))

### Tests

* increase test coverage ([7650dc6](https://github.com/brandonocasey/npm-preset/commit/7650dc6))

<a name="1.3.0"></a>
# [1.3.0](https://github.com/brandonocasey/npm-preset/compare/v1.1.1...v1.3.0) (2018-01-23)

### Features

* internal intercept, rather than node module ([dcc1ae8](https://github.com/brandonocasey/npm-preset/commit/dcc1ae8))

### Bug Fixes

* cleanup children on exit ([c48ec6c](https://github.com/brandonocasey/npm-preset/commit/c48ec6c))
* sub command stderr/stdout intercept ([48376dc](https://github.com/brandonocasey/npm-preset/commit/48376dc))

### Chores

* **package:** update shelljs to version 0.8.1 ([#5](https://github.com/brandonocasey/npm-preset/issues/5)) ([2adb1d7](https://github.com/brandonocasey/npm-preset/commit/2adb1d7))

### Code Refactoring

* better errors ([9e22a10](https://github.com/brandonocasey/npm-preset/commit/9e22a10))
* swtich from execa to child_process.exec ([21fb431](https://github.com/brandonocasey/npm-preset/commit/21fb431))

### Documentation

* **readme:** add Greenkeeper badge ([#1](https://github.com/brandonocasey/npm-preset/issues/1)) ([fc03d2a](https://github.com/brandonocasey/npm-preset/commit/fc03d2a))
* put npm on a seperate line ([52c89c0](https://github.com/brandonocasey/npm-preset/commit/52c89c0))
* update with examples ([5f46ffe](https://github.com/brandonocasey/npm-preset/commit/5f46ffe))

### Performance Improvements

* generally improve performance ([cfb0eaa](https://github.com/brandonocasey/npm-preset/commit/cfb0eaa))
* merge regexs ([4bde661](https://github.com/brandonocasey/npm-preset/commit/4bde661))
* remove bluebird ([2742b1c](https://github.com/brandonocasey/npm-preset/commit/2742b1c))

<a name="1.1.1"></a>
## [1.1.1](https://github.com/brandonocasey/npm-preset/compare/v1.1.0...v1.1.1) (2018-01-10)

### Bug Fixes

* npmScripts should be npmPreset ([876db75](https://github.com/brandonocasey/npm-preset/commit/876db75))

<a name="1.1.0"></a>
# [1.1.0](https://github.com/brandonocasey/npm-preset/compare/v1.0.1...v1.1.0) (2018-01-10)

### Features

* code coverage via coveralls and nyc ([1e80ae7](https://github.com/brandonocasey/npm-preset/commit/1e80ae7))
* linting ([940b131](https://github.com/brandonocasey/npm-preset/commit/940b131))

### Bug Fixes

* always return op unless its a glob ([9075316](https://github.com/brandonocasey/npm-preset/commit/9075316))
* better command running with execa, and more tests ([838f36c](https://github.com/brandonocasey/npm-preset/commit/838f36c))
* greenkeeper support, nyc coveralls fix ([041eda6](https://github.com/brandonocasey/npm-preset/commit/041eda6))
* greenkeeper, no sub packages ([83226e9](https://github.com/brandonocasey/npm-preset/commit/83226e9))
* issue where -co would carry to child npms ([c714a65](https://github.com/brandonocasey/npm-preset/commit/c714a65))
* non-testable coverage areas ([c437fca](https://github.com/brandonocasey/npm-preset/commit/c437fca))

### Code Refactoring

* no longer require babel-register ([5feb873](https://github.com/brandonocasey/npm-preset/commit/5feb873))

### Performance Improvements

* faster stderr/stdout ([70bf7fa](https://github.com/brandonocasey/npm-preset/commit/70bf7fa))

<a name="1.0.1"></a>
## [1.0.1](https://github.com/brandonocasey/npm-preset/compare/v1.0.0...v1.0.1) (2018-01-09)

### Documentation

* update ([2f6aaba](https://github.com/brandonocasey/npm-preset/commit/2f6aaba))

<a name="1.0.0"></a>
# [1.0.0](https://github.com/brandonocasey/npm-preset/compare/1f79e7d...v1.0.0) (2018-01-09)

### Features

* add support for colors in commands ([1f79e7d](https://github.com/brandonocasey/npm-preset/commit/1f79e7d))
* allow static file presets ([774b236](https://github.com/brandonocasey/npm-preset/commit/774b236))
* cli args ([be85d4d](https://github.com/brandonocasey/npm-preset/commit/be85d4d))
* new/better argument parsing ([805675d](https://github.com/brandonocasey/npm-preset/commit/805675d))
* rename to npm-script to npm-scripts ([8d9ee26](https://github.com/brandonocasey/npm-preset/commit/8d9ee26))
* run the linter ([67de1ea](https://github.com/brandonocasey/npm-preset/commit/67de1ea))
* support regex script names ([765a8de](https://github.com/brandonocasey/npm-preset/commit/765a8de))
* use cluster to multi-thread ([0a07b91](https://github.com/brandonocasey/npm-preset/commit/0a07b91))

### Bug Fixes

* better error and preset binary handling ([3444df0](https://github.com/brandonocasey/npm-preset/commit/3444df0))
* do not merge scripts ([db691d5](https://github.com/brandonocasey/npm-preset/commit/db691d5))
* error when no script is passed ([8cdee7f](https://github.com/brandonocasey/npm-preset/commit/8cdee7f))
* npm link ([77f8097](https://github.com/brandonocasey/npm-preset/commit/77f8097))
* parallel and serial order ([450c18d](https://github.com/brandonocasey/npm-preset/commit/450c18d))
* presets with scopes ([53d2fce](https://github.com/brandonocasey/npm-preset/commit/53d2fce))
* share npm-script config and subarg passing ([d2d1692](https://github.com/brandonocasey/npm-preset/commit/d2d1692))
* shorten ([e73d4fb](https://github.com/brandonocasey/npm-preset/commit/e73d4fb))
* sort scripts too ([72e6b6a](https://github.com/brandonocasey/npm-preset/commit/72e6b6a))

### Code Refactoring

* make some preset vars private ([729a4f4](https://github.com/brandonocasey/npm-preset/commit/729a4f4))
* rename from npm-scripts to npm-preset ([afcd6f5](https://github.com/brandonocasey/npm-preset/commit/afcd6f5))

### Documentation

* update ([5272497](https://github.com/brandonocasey/npm-preset/commit/5272497))
* update writing a preset section, add benefits, and add toc ([223fe6b](https://github.com/brandonocasey/npm-preset/commit/223fe6b))
* updates ([a6926c2](https://github.com/brandonocasey/npm-preset/commit/a6926c2))

### Tests

* add a unit test for function presets ([8d23943](https://github.com/brandonocasey/npm-preset/commit/8d23943))

