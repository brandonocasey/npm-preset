# npm-preset

[![Greenkeeper badge](https://badges.greenkeeper.io/BrandonOCasey/npm-preset.svg)](https://greenkeeper.io/)
[![Build Status][travis-icon]][travis-link]
[![Coverage Status][coveralls-icon]][coveralls-link]

[![NPM][npm-icon]][npm-link]

## Table of Contents

* [Benefits over vanilla npm scripts](#benefits-over-vanilla-npm-scripts)
* [Usage](#usage)
* [How is it so much faster?](#how-is-it-so-much-faster)
* [What is this?](#what-is-this)
* [Why do do need this?](#why-do-do-need-this)
* [Configuration](#configuration)
  * [Presets:](#presets)
  * [Configuring a Preset](#configuring-a-preset)
* [Writing Presets](#writing-presets)
  * [Formats](#formats)
  * [Things to know:](#things-to-know)
  * [Examples](#examples)
* [The npm-preset "config"](#the-npm-preset-config)

## Benefits over vanilla npm scripts

* ~300% (~330ms vs ~110ms) Faster than vanilla `npm run` or `npm-run-all` for a single command [See How](#how-is-it-so-much-faster)
  * This means you save 220ms for every `npm run` that you would normally have!
* Sharable npm scripts, so that projects you manage can be kept up to date easily
* Independent from npm. This allows npm to run npm-preset through its own scripts
  * Note that you probably only want to do this to keep it familiar for new users
* The ability to run scripts in series or parallel
* The ability to run scripts using wild cards
* Long paths shortend based on the current preset/package root (can be turned of with --no-shorten)
  * `echo /Users/Bill/Projects/some-awesome-thing/src` -> `echo src`
  * `echo /Users/Bill/Projects/some-awesome-thing/node_modules/npm-preset-builder/config/test.js` -> `echo <npmp-builder>/config/test.js`
* Any installed binary from node_modules can be run in npm-preset without an absolute path

## Usage

To install use npm:

```bash
npm i npm-preset
```

This will give you two binaries `npm-preset` and `npmp`. Which can:

* If you don't want to use a preset or you just want to test it out you can add `scripts` to an `npm-preset` key in your package.json:
```json
{
  "npm-preset": {
    "scripts": {
      "echo" : "echo hello npmp"
    }
  }
}
```
Then run that command with `npmp echo`

* You can use a `*` character to specify scripts ie: `build:*` will run `build:test` and `build:js` but not `build:js:other` or `build`
* Use `npmp --help` to see what else it can do

The real magic happens when you add a preset, such a `npm-preset-awesome`. This will allow you to run scripts from that preset! For instance if that preset implemented `build:something:awesome` and you run it with `npmp build:something:awesome` it will run as an npmp script for the current project with all paths local to the current project!

## How is it so much faster?
1. It is optomized for performance
1. It had much less overhead than npm
1. It does everything it can asynchronously
1. If it finds out that one npmp command is running another, and that command does not have any special shell operations. It doesn't create a child. Instead it uses the npmp function and passes it the arguments that it would habe run in a child. Since nodejs take about 80ms to startup this saves us all of that time!

## What is this?

This takes npm scripts and makes them sharable across projects. This prevents updating projects that all follow similar guidelines individually. Think of it in the same vain as a "linter preset" similar to how eslint or babel has presets, but instead of just being for linting it is for your whole build pipeline. Examples of how this would help:

* A bug was introduced in an update to a build tool
* Linter rules were updates (this would be a major version if the rules became more strict)
* You want to switch to a tool that produces better dist files
* Nobody has an up to date build pipeline as changes happen so often
* A bug was found in the build pipeline for a lesser used feature

## Why do do need this?

npm has a great task runner that it calls scripts, but trying to manage them between projects can be a pain. For JavaScript the build pipeline is a beast of its own and it often has bugs, improvements, and changes that need to be made constantly. At my job we manage this through a `yeoman` generator, but that means that every one of our packages needs a pull request for every single change. Eventually things fall behind. This project seeks to rectify that by making it a portable package that will be easily updated.

## Configuration

Right now `npm-preset` is only configuratble via `package.json` feel free to submit a pr if you think we should have more or you think that the options are lacking.

### Presets:

By Default `npm-preset` will automatically search for any presets with the following name `*npm-presets-*` and attempt to add those scripts to its script list.

> Note that it will only search through `dependencies` and `devDependencies`. If you have a locally installed package that is not in there, you will have to add the preset.

If you want to configure a preset or which presets are used you should add an `npm-preset` key at the root of `package.json`. You can then add a `presets` array that will take the full name of the package `some-preset`, or the shortname in the cases were the package name follows the convention `npm-preset-something` could be listed as `something`.

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

Presets can also be specifed as an object instead of a string and they must have at least a `name` key. If a `path` key is provided that will be used rather than trying to find that preset using the `name`. This basically means the `name` can be anything. This allows you to specify local files as presets:

```json
{
  "npm-preset": {
    "presets": [
      {"name": "my-custom-preset", path: "./my-custom-preset.js"},
      {"name": "npm-preset-something"}
    ]
  }
}
```

### Configuring a Preset

Each preset can be configured by specifing the long or short preset name under the `npm-preset` key in package.json. From there it is up to the preset to decide what format its options should be in.

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

* if you need to pass config files during a command you will want to use absolute paths to do so.
* When a script is run process.env.NPM_PRESET_CONFIG will be set to the current `npm-preset` config. This should allow you to use any of the special variables from that file just about anywhere (babel config, rollup config, a random node script)

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

[travis-icon]: https://travis-ci.org/BrandonOCasey/npm-preset.svg?branch=master

[travis-link]: https://travis-ci.org/BrandonOCasey/npm-preset

[npm-icon]: https://nodei.co/npm/npm-preset.png?downloads=true&downloadRank=true

[npm-link]: https://nodei.co/npm/npm-preset/

[coveralls-icon]: https://coveralls.io/repos/github/BrandonOCasey/npm-preset/badge.svg?branch=master

[coveralls-link]: https://coveralls.io/github/BrandonOCasey/npm-preset?branch=master
