# Contributing

## Table of Contents

* [Submitting a Bug/Feature Request](#submitting-a-bugfeature-request)
* [Contributing Code](#contributing-code)
  * [Workflow](#workflow)
  * [Code Style Guide](#code-style-guide)
* [Tests](#tests)
  * [Manual Testing](#manual-testing)
  * [Running Unit Tests](#running-unit-tests)
  * [Unit test overview](#unit-test-overview)
* [Running Benchmarks](#running-benchmarks)
* [Merging Pull Requests](#merging-pull-requests)
* [Releasing](#releasing)
  * [determining the release type](#determining-the-release-type)
  * [How to release](#how-to-release)

## Submitting a Bug/Feature Request

Bugs/Feature requests are always welcome. Make sure to follow the [.github/ISSUE_TEMPLATE.md](.github/ISSUE_TEMPLATE.md) and submit them to [Github Issues](https://github.com/BrandonOCasey/npm-preset/issues).

## Contributing Code

It is always best to submit a feature/bug request to make sure that what you see actually needs to be fixed/changed. That will save hurt feelings and wasted time.

### Workflow

Make sure that you have the following installed:

* [`nodejs`][nodejs] >=4 (you can use [`nvm`][nvm] to istall)
* [`git`][git]

1. fork the repo on github: `https://github.com/BrandonOCasey/npm-preset`
1. clone your fork: `https://github.com/<userName>/npm-preset`
1. move into that directory: `cd npm-preset`
1. create a branch to work in: `git checkout -b some-awesome-feature`
1. install dependencies: `npm i`
1. verify that unit tests/linter run and pass: `npm run test`
1. Make your changes, be sure to update/add unit tests accordingly
1. Make sure that the unit tests/linter still pass: `npm run test`
1. Commit your changes: `git commit -m 'change' -a`
1. Push your changes up to your repo: `git push -u origin some-awesome-feature`
1. Open a pull request on [Github](https://github.com/BrandonOCasey/npm-preset/pulls)

* Be sure to follow the [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md)

### Code Style Guide

See <https://github.com/videojs/eslint-config-videojs> for our linting rules

## Tests

### Manual Testing

Make sure that you have the following installed:

* [`nodejs`][nodejs] >=4 (you can use [`nvm`][nvm] to istall)
* [`git`][git]

1. clone the repo: `git clone https://github.com/BrandonOCasey/npm-preset`
1. move into that directory: `cd npm-preset`
1. install dependencies: `npm i`
1. run the test setup: `npm run test-setup`
1. move into the playground directory: 'cd test/fixtures/playground'
1. test npmp with `npmp echo`

### Running Unit Tests

Make sure that you have the following installed:

* [`nodejs`][nodejs] >=4 (you can use [`nvm`][nvm] to istall)
* [`git`][git]

1. clone the repo: `git clone https://github.com/BrandonOCasey/npm-preset`
1. move into that directory: `cd npm-preset`
1. install dependencies: `npm i`
1. run the tests: `npm run test`

> Note: We use [ava][ava] for our unit tests. See their docs for other ways to run tests

### Unit test overview

> Note: We use [ava][ava] for our unit tests. See their docs for other ways to run tests
> FYI: all of these steps return a Promise and run asyncronously

1. Before any tests start unit tests are started by running the script in `test/scripts/setup.js`

* This emulates an `npm-link` on `npm-preset` for all directories in `test/fixtures/*`. We do not use acually `npm link` because it takes too long.
* mainly unit tests are concerned with the `test/fixtures/unit-tests` directory

1. Before each test is run we copy `test/fixtures/unit-tests` to a temporary directory
1. Tests do whatever they need to in that temporary directory
1. Wether that tests passes or fails the temporary directory is then deleted

## Running Benchmarks

> To view the most recent benchmarks look at [BENCHMARKS.md](BENCHMARKS.md)

Make sure that you have the following installed:

* [`nodejs`][nodejs] >=4 (you can use [`nvm`][nvm] to istall)
* [`bench`][bench] a cli benchmarking tool
* [`git`][git]

1. clone the repo: `git clone https://github.com/BrandonOCasey/npm-preset`
1. move into that directory: `cd npm-preset`
1. install dependencies: `npm i`
1. run the benchmarks: `npm run bench`

## Merging Pull Requests

Once code has been reviewed it should be `squashed and merged` and the commit should follow our `commit guidelines` so that a changelog can automatically be generated during a release.

## Releasing

### determining the release type

* If this release is only bug fixes it is a patch
* If this release contains any features it is a minor
* if this release contains any breaking changes it is a major

### How to release

Travis will handle the github release and the npm publish on a tag. All you have to do is:

1. version with npm: `npm version <versiontype>`
1. push changes to git: `git push`
1. push tags to git: `git push --tags`

[nodejs]: https://nodejs.org/

[bench]: https://github.com/Gabriel439/bench

[nvm]: https://github.com/creationix/nvm

[git]: https://git-scm.com/

[ava]: https://github.com/avajs/ava
