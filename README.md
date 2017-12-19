# npm-script

### Table of Contents

## Usage
To install use npm:

```bash
npm i npm-script
```

This will give you a binary called `npms`. Which can:

* run any of your current projects npm scripts in series or parallel similar to `npm-run-all`
* You can use a `*` character to specify scripts ie: `build:*` will run `build:test` and `build:js` but not `build:js:other` or `build`
* Use `npms --help` to see what else it can do

The real magic happens when you add a preset, such a `npm-script-preset-awesome`. This will allow you to run scripts from that preset! For instance if that preset implemented
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
Right now `npm-script` is only configuratble via `package.json` feel free to submit a pr if you think we should have more or you think that the options are lacking.

### Presets:
By Default `npm-script` will automatically search for any presets with the following name `npm-script-presets-*` and attempt to add those scripts to its script list.

> Note that it will only search through `dependencies` and `devDependencies`. If you have a locally installed package that is not in there, you will have to add the preset.

If you want to configure a preset or which presets are used you should add an `npm-script` key at the root of `package.json`. You can then add a `presets` array that will take the full name of the package `some-preset`, or the shortname in the cases were the package name follows the convention `npm-script-preset-something` could be listed as `something`.

Example: (you would not want to include the same preset twice, this is just for reference)
```json
{
	"npm-script": {
		"presets": [
			"something",
			"npm-script-preset-something",
			"some-other-preset"
		]
	}
}
```

### Configuring a Preset
Each preset can be configured by specifing the long or short preset name under the `npm-script` key in package.json. From there it is up to the preset to decide what format its options should be in.

Example: (you would not want to include configuration for the same preset twice, this is just for reference)
```json
{
	"npm-script": {
		"some-other-preset": [],
		"something": {},
		"npm-script-preset-something": {},
	}
}
```

## Writing Presets


## Recommendations
We recommend that `npm-script` and any presets be locked to a single version and not a version range. We then recommend that `greenkeeper` be enabled so that it can submit prs for to update `npm-script`. This will prevent your build pipeline from changing out from under you and from any break that may be possible.
