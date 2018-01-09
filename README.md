# npm-scripts

## Table of Contents

* [Benefits over vanilla npm scripts](#benefits-over-vanilla-npm-scripts)
* [Usage](#usage)
* [What is this?](#what-is-this)
* [Why do do need this?](#why-do-do-need-this)
* [Configuration](#configuration)
  * [Presets:](#presets)
  * [Configuring a Preset](#configuring-a-preset)
* [Writing Presets](#writing-presets)
* [The npm-scripts "config"](#the-npm-scripts-config)
* [Recommendations](#recommendations)

## Benefits over vanilla npm scripts

* ~60% Faster than vanilla npm scripts due to cluster processes (multi-threading) and less overhead
* Sharable npm scripts, so that projects you manage can be kept up to date easily
* Independent from npm. This allows npm to run npm-scripts through its own scripts
* The ability to run scripts in series or parallel
* The ability to run scripts using wild cards
* Long paths shortend based on the current package root
* Any installed binary from node_modules can be run in npm-scripts without an absolute path

## Usage

To install use npm:

```bash
npm i npm-scripts
```

This will give you a binary called `npms`. Which can:

* run any of your current projects npm scripts in series or parallel similar to `npm-run-all`
* You can use a `*` character to specify scripts ie: `build:*` will run `build:test` and `build:js` but not `build:js:other` or `build`
* Use `npms --help` to see what else it can do

The real magic happens when you add a preset, such a `npm-scripts-preset-awesome`. This will allow you to run scripts from that preset! For instance if that preset implemented
`build:something:awesome` and you run it with `npm build:something:awesome` it will run as an npm script for the current project with all paths local to the current project!

## What is this?

This takes npm scripts and makes them sharable across projects. This prevents updating projects that all follow similar guidelines individually. Think of it in the same vain as a "linter preset" similar to how eslint has presets, but instead of just being for linting it is for your whole build pipeline. Examples of how this would help:

* A bug was introduced in an update to a build tool
* Linter rules were updates (this would be a major version if the rules became more strict)
* You want to switch to a tool that produces better dist files
* Nobody has an up to date build pipeline as changes happen so often
* A bug was found in the build pipeline for a lesser used feature

## Why do do need this?

npm has a great task runner that it calls scripts, but trying to manage them between projects can be a pain. For JavaScript the build pipeline is a beast of its own and it often has bugs, improvements, and changes that need to be made constantly. Right now we manage this through a `yeoman` generator, but that means that every one of our packages needs a pull request for every single change. Eventually things fall behind. This project seeks to rectify that by making it a portable package that will be easily updated.

## Configuration

Right now `npm-scripts` is only configuratble via `package.json` feel free to submit a pr if you think we should have more or you think that the options are lacking.

### Presets:

By Default `npm-scripts` will automatically search for any presets with the following name `*npm-scripts-presets-*` and attempt to add those scripts to its script list.

> Note that it will only search through `dependencies` and `devDependencies`. If you have a locally installed package that is not in there, you will have to add the preset.

If you want to configure a preset or which presets are used you should add an `npm-scripts` key at the root of `package.json`. You can then add a `presets` array that will take the full name of the package `some-preset`, or the shortname in the cases were the package name follows the convention `npm-scripts-preset-something` could be listed as `something`.

Example: (you would not want to include the same preset twice, this is just for reference)

```json
{
  "npm-scripts": {
    "presets": [
      "something",
      "npm-scripts-preset-something",
      "some-other-preset"
    ]
  }
}
```

Presets can also be specifed as an object instead of a string and they must have at least a `name` key. If a `path` key is provided that will be used rather than trying to find that preset using the `name`. This basically means the `name` can be anything. This allows you to specify local files as presets:

```json
{
  "npm-scripts": {
    "presets": [
      {"name": "my-custom-preset", path: "./my-custom-preset.js"},
      {"name": "npm-scripts-preset-something"}
    ]
  }
}
```

### Configuring a Preset

Each preset can be configured by specifing the long or short preset name under the `npm-scripts` key in package.json. From there it is up to the preset to decide what format its options should be in.

Example: (you would not want to include configuration for the same preset twice, this is just for reference)

```json
{
  "npm-scripts": {
    "some-other-preset": [],
    "something": {},
    "npm-scripts-preset-something": {},
  }
}
```

## Writing Presets

Presets can be written in three formats:

* A JavaScript file that exports an object containing scripts
* A JSON file that contains an object with scripts
* A JavaScript function that returns an object containing scripts. It takes one argument: the current npm-scripts config.

Things to know:

* if you need to pass config files during a command you will want to use absolute paths to do so.
* When a script is run process.env.NPM_SCRIPT_CONFIG will be set to the current `npm-scripts` config. This should allow you to use any of the special variables from that file just about anywhere (babel config, rollup config, a random npm script)

## The npm-scripts "config"

This is not really a config, its more of a useful state object that is passed around. Properties include:

* author: The author string for the current package, this is special because it will break down an author object into a string.
* root: The absolute root directory of the current package
* name: The name of the package minus the scope
* scope: The scope of the package minus the name
* moduleName: camelCase version of the name, usually used in global exporting on window for the browser
* pkg: The unmodified app package. Will be removed when using `--print-config`
* npmScript: The final npmScript config, after small modification have been done and `pkg['npm-scripts']` has been taken into account.
* scripts: This starts with the scripts from the current package, from there presets are merged into this script list

## Recommendations

We recommend that `npm-scripts` and any presets be locked to a single version and not a version range. We then recommend that `greenkeeper` be enabled so that it can submit prs for to update `npm-scripts`. This will prevent your build pipeline from changing out from under you and from any break that may be possible.
