# npm-preset

[![Greenkeeper badge](https://badges.greenkeeper.io/BrandonOCasey/npm-preset.svg)](https://greenkeeper.io/)
[![Build Status][travis-icon]][travis-link]
[![Coverage Status][coveralls-icon]][coveralls-link]

[![NPM][npm-icon]][npm-link]

## Table of Contents

* [Benefits over vanilla npm scripts](#benefits-over-vanilla-npm-scripts)
* [Usage](#usage)
  * [using the command line](#using-the-command-line)
  * [adding scripts via  package.json](#adding-scripts-via--packagejson)
  * [adding scripts via presets](#adding-scripts-via-presets)
* [How is it so much faster?](#how-is-it-so-much-faster)
* [What is this and why do we need it?](#what-is-this-and-why-do-we-need-it)
* [Configuration](#configuration)
  * [Presets:](#presets)
  * [Configuring a Preset](#configuring-a-preset)
* [Writing Presets](#writing-presets)
  * [Formats](#formats)
  * [Things to know:](#things-to-know)
  * [Examples](#examples)
* [The npm-preset "config"](#the-npm-preset-config)
* [Benchmarks](#benchmarks)
* [Contributing](#contributing)

## Benefits over vanilla npm scripts

* ~300% (~330ms vs ~110ms) Faster than vanilla `npm run` or `npm-run-all` for a single command [See How](#how-is-it-so-much-faster)
  * This means you save 220ms for every `npm run` that you would normally have!
  * [See how its so much faster](#how-is-it-so-much-faster)
  * [See Benchmarks](#benchmarks)
* Sharable npm scripts, so that projects you manage can be kept up to date easily
* Independent from npm. This allows npm to run npm-preset through its own scripts
  * Note that you probably only want to do this to keep it familiar for new users
* The ability to run scripts in series (`-s|--serial`) or parallel (`-p|--parallel`): `npmp -s clean -p build lint -s finish`
* You can use a `*` character to specify scripts ie: `build:*` will run `build:test` and `build:js` but not `build:js:other` or `build`
* Long paths are shortened based on the current preset/package root (can be turned of with `-ns|--no-shorten`)
  * `echo /Users/Bill/Projects/some-awesome-thing/src` -> `echo src`
  * `echo /Users/Bill/Projects/some-awesome-thing/node_modules/npm-preset-builder/config/test.js` -> `echo <npmp-builder>/config/test.js`
* Any installed binary from `node_modules/.bin` can be run by name

## Usage

To install use npm:

```bash
npm i npm-preset
```

### using the command line

You can run scripts in parallel or series. Here are some examples:

```sh
# series by default
npmp build finish

# explicit series
npmp -s build finish

# parallel
npmp -p build lint

# both
npmp -s clean -p build lint -s finish -p compress minify

#
```

Use `npmp --help` to see what else it can do

### adding scripts via  package.json

You can then use scripts manually by adding `scripts` to an `npm-preset` key in your `package.json`:

```json
{
  "npm-preset": {
    "scripts": {
      "echo" : "echo hello npmp"
    }
  }
}
```

Then test it by running that command with `npmp echo`

### adding scripts via presets

The real magic happens when you add a preset, such a `npm-preset-awesome`. This will allow you to run scripts from that preset! For instance if that preset implemented `build:something:awesome`. You can then run it with `npmp build:something:awesome` (if its installed). It will then run as an npmp script for the current project with all paths local to the current project!

## How is it so much faster?

1. It is optimized for performance
1. It has much less overhead than npm
1. It does everything it can asynchronously
1. It detects when a sub-command is simple and runs npmp as a function in the same instance of nodejs. This saves 100ms (node takes 80ms to startup on its own). I command is simple when:

* npmp is the first binary being run
* The command does not contain shell operations: `&&`, `||`, etc..

## What is this and why do we need it?

`npm` has a great task runner that via `scripts`, but trying to manage them between projects is painful. For JavaScript the build pipeline is a beast of its own. It often has bugs, improvements, and changes that need to be made constantly. For organizations with Many projects this usually means a PR for every project. With `npmp` and `presets`  [greenkeeper][greenkeeper-website] can do all the work for you.

Think of this as the same thing as `npm` `scripts` but sharable across projects. Similar to how `eslint` or `babel` has presets, but instead of just being for linting or translating it is for your whole build pipeline. Examples of how this would help:

* A bug was introduced in an update to a build tool
* Linter rules were updates (this would be a major version if the rules became more strict)
* You want to switch to a tool that produces better `dist` files
* Nobody has an up to date build pipeline as changes happen so often
* A bug was found in the build pipeline for a lesser used feature

## Configuration

At the moment `npm-preset` is only configurable via `package.json`. Feel free to submit a PR if you think we should have more or you think that the options are lacking.

### Presets:

By default `npm-preset` will search for presets in `dependencies` and `devDependencies` using the regex: `*npm-presets-*`. Then it will add those scripts to its script list.

> Note: If you have a locally installed package that is not in there, you will have to add the preset.

If you want to configure a preset a preset, choose which presets are used, or have a local preset.  You should add an `npm-preset` key at the root of `package.json`. You can then add a `presets`  array that will take the full name or the shortname. The full name would be the entire package name. The shortname can be added if the package name follows the convention. Example:
`npm-preset-something` could be listed as `something`.

Example: (you would not want to include the same preset twice, this is just for reference)

```json
{
  "npm-preset": {
    "presets": [
      "something",
      "npm-preset-something",
      "some-other-preset"
    ]
  }
}
```

Presets can also be specified as an object instead of a string and they must have at least a `name` key. If a `path` key is also provided that will be used rather than trying to find that preset using the `name`. In that case `name` could be anything. This allows you to specify local files as presets:

```json
{
  "npm-preset": {
    "presets": [
      {"name": "my-custom-preset", "path": "./my-custom-preset.js"},
      {"name": "npm-preset-something"}
    ]
  }
}
```

### Configuring a Preset

Each preset can be configured by specifying the long or short preset name under the `npm-preset` key in package.json. From there it is up to the preset to decide what format its options should be in.

Example: (you would not want to include configuration for the same preset twice, this is just for reference)

```json
{
  "npm-preset": {
    "some-other-preset": [],
    "something": {},
    "npm-preset-something": {},
  }
}
```

## Writing Presets

### Formats

Presets can be written in three formats:

* A JavaScript file that exports an object containing scripts
* A JSON file that contains an object with scripts
* A JavaScript function that returns an object containing scripts. It takes one argument: the current npm-preset config.

### Things to know:

* if you need to pass config files during a command you will want to use absolute paths to do so. Use `path` and `config.root`
* When a script is run `process.env.NPM_PRESET_CONFIG` will be set to a JSON string of the current `npm-preset` config. This should allow you to use any of the special variables from just about anywhere (babel config, rollup config, a random node script)

### Examples

* <https://github.com/BrandonOCasey/npm-preset-videojs>

## The npm-preset "config"

This is not really a config, its more of a useful state object that is passed around. Properties include:

* author: The author string for the current package, this is special because it will break down an author object into a string.
* root: The absolute root directory of the current package
* name: The name of the package minus the scope
* scope: The scope of the package minus the name
* moduleName: camelCase version of the name, usually used in global exporting on window for the browser
* pkg: The unmodified app package. Will be removed when using `--print-config`
* npmScript: The final npmScript config, after small modification have been done and `pkg['npm-preset']` has been taken into account.
* scripts: This starts with the scripts from the current package, from there presets are merged into this script list

## Benchmarks

See [BENCHMARKS.md](BENCHMARKS.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

[greenkeeper-website]: https://greenkeeper.io/

[travis-icon]: https://travis-ci.org/BrandonOCasey/npm-preset.svg?branch=master

[travis-link]: https://travis-ci.org/BrandonOCasey/npm-preset

[npm-icon]: https://nodei.co/npm/npm-preset.png?downloads=true&downloadRank=true

[npm-link]: https://nodei.co/npm/npm-preset/

[coveralls-icon]: https://coveralls.io/repos/github/BrandonOCasey/npm-preset/badge.svg?branch=master

[coveralls-link]: https://coveralls.io/github/BrandonOCasey/npm-preset?branch=master
