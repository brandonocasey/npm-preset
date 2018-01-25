'use strict';

const test = require('ava');
const path = require('path');
const uuid = require('uuid');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const childProcess = require('child_process');
const tmpdir = require('os').tmpdir();
const mkdirp = Promise.promisify(require('mkdirp'));
const rimraf = Promise.promisify(require('rimraf'));
const ncp = Promise.promisify(require('ncp'));

process.setMaxListeners(1000);

const fixtureDir = path.join(__dirname, '..', 'fixtures', 'unit-tests');
const baseDir = path.join(__dirname, '..', '..');

const promiseSpawn = function(bin, args, options = {}) {
  return new Promise((resolve, reject) => {
    options = Object.assign({shell: true, stdio: 'pipe'}, options);
    const child = childProcess.spawn(bin, args, options);
    let stdout = '';
    let stderr = '';
    let out = '';

    child.stdout.on('data', function(chunk) {
      const str = chunk.toString();

      out += str;
      stdout += str;
    });

    child.stderr.on('data', function(chunk) {
      const str = chunk.toString();

      out += str;
      stderr += str;
    });
    const kill = () => child.kill();

    process.on('SIGINT', kill);
    process.on('SIGQUIT', kill);
    process.on('exit', kill);

    child.on('close', (exitCode) => {
      if (!options.ignoreExitCode && exitCode !== 0) {
        return reject(`command ${bin} ${args.join(' ')} failed with code ${exitCode}\n` + out);
      }
      return resolve({exitCode, stderr, stdout});
    });
  });
};

const exists = function(files) {
  if (typeof files === 'string') {
    files = [files];
  }
  return Promise.all(Promise.map(files, function(file) {

    return fs.accessAsync(file)
      .then(() => Promise.resolve({file, exists: true}))
      .catch(() => Promise.resolve({file, exists: false}));
  }));
};

test.before((t) => {
  return promiseSpawn('node', [path.join(baseDir, 'test', 'scripts', 'setup.js')]);
});

test.beforeEach((t) => {
  const tempdir = path.join(tmpdir, uuid.v4());

  t.context.dir = tempdir;
  t.context.modifyPkg = (newPkg) => {
    const pkgPath = path.join(tempdir, 'package.json');
    const oldPkg = require(pkgPath);

    return fs.writeFileAsync(pkgPath, JSON.stringify(Object.assign(oldPkg, newPkg)));
  };

  t.context.addPreset = (name, scripts, modifyPkg) => {
    if (typeof modifyPkg === 'undefined') {
      modifyPkg = true;
    }

    const dir = path.join(tempdir, 'node_modules', name);

    const pkg = {
      name,
      version: '1.0.0',
      description: '',
      main: 'index.js',
      scripts: {},
      keywords: [],
      author: '',
      license: 'ISC'
    };

    return mkdirp(dir).then(() => {
      return Promise.all([
        fs.writeFileAsync(path.join(dir, 'index.js'), 'module.exports = ' + JSON.stringify(scripts) + ';'),
        fs.writeFileAsync(path.join(dir, 'package.json'), JSON.stringify(pkg))
      ]);
    }).then(() => {
      if (modifyPkg) {
        const updatePkg = {dependencies: {}};

        updatePkg.dependencies[name] = '1.0.0';
        return t.context.modifyPkg(updatePkg);
      }

      return Promise.resolve();
    });
  };

  return ncp(fixtureDir + path.sep, tempdir);
});

test.afterEach.always((t) => {
  if (t.context.dir) {
    return rimraf(t.context.dir);
  }
});

['-pc', '--print-config'].forEach(function(o) {
  test(o, (t) => {
    t.plan(3);
    return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch ./file.test'}}}).then(() => {
      return promiseSpawn('npmp', [o, 'touch'], {cwd: t.context.dir});
    }).then((result) => {
      t.not(result.stdout.trim(), 0, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');

      return exists(path.join(t.context.dir, 'file.test'));
    }).then((results) => {
      t.is(results[0].exists, false, 'file.test not created');
    });
  });
});

['-sh', '--save-husky'].forEach(function(o) {
  test(o, (t) => {
    t.plan(4);
    return t.context.modifyPkg({'npm-preset': {scripts: {precommit: 'touch ./file.test'}}}).then(() => {
      return promiseSpawn('npmp', [o, 'precommit'], {cwd: t.context.dir});
    }).then((result) => {
      t.not(result.stdout.trim(), 0, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');

      return exists(path.join(t.context.dir, 'file.test'));
    }).then((results) => {
      t.is(results[0].exists, false, 'file.test not created');

      return fs.readFileAsync(path.join(t.context.dir, 'package.json'));
    }).then((data) => {
      const pkg = JSON.parse(data);

      t.is(pkg.scripts.precommit, 'npmp precommit', 'husky script copied');
    });
  });
});

['-sn', '--save-npm'].forEach(function(o) {
  test(o, (t) => {
    t.plan(4);
    return t.context.modifyPkg({'npm-preset': {scripts: {install: 'touch ./file.test'}}}).then(() => {
      return promiseSpawn('npmp', [o, 'install'], {cwd: t.context.dir});
    }).then((result) => {
      t.not(result.stdout.trim(), 0, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');

      return exists(path.join(t.context.dir, 'file.test'));
    }).then((results) => {
      t.is(results[0].exists, false, 'file.test not created');

      return fs.readFileAsync(path.join(t.context.dir, 'package.json'));
    }).then((data) => {
      const pkg = JSON.parse(data);

      t.is(pkg.scripts.install, 'npmp install', 'npm lifecycle script copied');
    });
  });
});

test('object author is stringified', (t) => {
  t.plan(1);
  return t.context.modifyPkg({author: {name: 'test', email: 'test@email.com', url: 'http://email.com'}}).then(() => {
    return promiseSpawn('npmp', ['--print-config'], {cwd: t.context.dir});
  }).then((result) => {
    const config = JSON.parse(result.stdout);

    t.is(config.author, 'test <test@email.com> (http://email.com)', 'object author transformed');
  });
});

['-V', '--version'].forEach(function(o) {
  test(o, (t) => {
    t.plan(3);
    return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch ./file.test'}}}).then(() => {
      return promiseSpawn('npmp', [o, 'touch'], {cwd: t.context.dir});
    }).then((result) => {
      t.not(result.stdout.trim(), 0, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');

      return exists(path.join(t.context.dir, 'file.test'));
    }).then((results) => {
      t.is(results[0].exists, false, 'file.test not created');
    });
  });
});

['-h', '--help'].forEach(function(o) {
  test(o, (t) => {
    t.plan(3);
    return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch ./file.test'}}}).then(() => {
      return promiseSpawn('npmp', [o, 'touch'], {cwd: t.context.dir});
    }).then((result) => {
      t.not(result.stdout.trim(), 0, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');

      return exists(path.join(t.context.dir, 'file.test'));
    }).then((results) => {
      t.is(results[0].exists, false, 'file.test not created');
    });
  });
});

['-l', '--list'].forEach(function(o) {
  test(o, (t) => {
    t.plan(3);
    const scripts = {touch: 'touch ./file.test'};

    return t.context.addPreset('npm-preset-test', scripts).then(() => {
      return t.context.modifyPkg({'npm-preset': {scripts}, scripts});
    }).then(() => {
      return promiseSpawn('npmp', [o, 'touch'], {cwd: t.context.dir});
    }).then((result) => {
      let stdout = '';

      stdout += '\nnpm-preset:\n';
      stdout += '  "touch": "touch ./file.test"\n';

      stdout += '\nnpm-preset-test:\n';
      stdout += '  "touch": "touch ./file.test"\n';
      stdout += '\n';

      t.is(result.stdout, stdout, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');

      return exists(path.join(t.context.dir, 'file.test'));
    }).then((results) => {
      t.is(results[0].exists, false, 'file.test not created');
    });
  });
});

test('scripts from different sources run in parallel', (t) => {
  t.plan(2);
  return t.context.addPreset('npm-preset-test', {echo: 'echo preset-echo'}).then(() => {
    return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'sleep 1 && echo npmp-echo'}}});
  }).then(() => {
    return promiseSpawn('npmp', ['-co', 'echo'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['preset-echo', 'npmp-echo'], 'prints two');
    t.is(result.stderr.trim().length, 0, 'no stderr');
  });
});

test('presets can be found via deps', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};

  return t.context.addPreset('npm-preset-test', scripts, false).then(() => {
    return t.context.modifyPkg({dependencies: {'npm-preset-test': '1.0.0'}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir});
  }).then((result) => {
    let stdout = '';

    stdout += '\nnpm-preset-test:\n';
    stdout += '  "touch": "touch ./file.test"\n';
    stdout += '\n';

    t.is(result.stdout, stdout, 'stdout');
    t.is(result.stderr.trim().length, 0, 'no stderr');

    return exists(path.join(t.context.dir, 'file.test'));
  }).then((results) => {
    t.is(results[0].exists, false, 'file.test not created');
  });
});

test('presets can be found via dev deps', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};

  return t.context.addPreset('npm-preset-test', scripts, false).then(() => {
    return t.context.modifyPkg({devDependencies: {'npm-preset-test': '1.0.0'}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir});
  }).then((result) => {
    let stdout = '';

    stdout += '\nnpm-preset-test:\n';
    stdout += '  "touch": "touch ./file.test"\n';
    stdout += '\n';

    t.is(result.stdout, stdout, 'stdout');
    t.is(result.stderr.trim().length, 0, 'no stderr');

    return exists(path.join(t.context.dir, 'file.test'));
  }).then((results) => {
    t.is(results[0].exists, false, 'file.test not created');
  });
});

test('presets can be found via npm-preset.preset long name', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};

  return t.context.addPreset('npm-preset-test', scripts, false).then(() => {
    return t.context.modifyPkg({'npm-preset': {presets: ['npm-preset-test']}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir});
  }).then((result) => {
    let stdout = '';

    stdout += '\nnpm-preset-test:\n';
    stdout += '  "touch": "touch ./file.test"\n';
    stdout += '\n';

    t.is(result.stdout, stdout, 'stdout');
    t.is(result.stderr.trim().length, 0, 'no stderr');

    return exists(path.join(t.context.dir, 'file.test'));
  }).then((results) => {
    t.is(results[0].exists, false, 'file.test not created');
  });
});

test('presets can be found via npm-preset.preset short name', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};

  return t.context.addPreset('npm-preset-test', scripts, false).then(() => {
    return t.context.modifyPkg({'npm-preset': {presets: ['test']}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir});
  }).then((result) => {
    let stdout = '';

    stdout += '\nnpm-preset-test:\n';
    stdout += '  "touch": "touch ./file.test"\n';
    stdout += '\n';

    t.is(result.stdout, stdout, 'stdout');
    t.is(result.stderr.trim().length, 0, 'no stderr');

    return exists(path.join(t.context.dir, 'file.test'));
  }).then((results) => {
    t.is(results[0].exists, false, 'file.test not created');
  });
});

test('presets can be an object in npm-preset.preset', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};
  const preset = {
    path: path.join(t.context.dir, 'my-custom-preset.js'),
    name: 'my-custom-preset'
  };

  return fs.writeFileAsync(preset.path, 'module.exports = ' + JSON.stringify(scripts) + ';').then(() => {
    return t.context.modifyPkg({'npm-preset': {presets: [preset]}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir});
  }).then((result) => {
    let stdout = '';

    stdout += '\nmy-custom-preset:\n';
    stdout += '  "touch": "touch ./file.test"\n';
    stdout += '\n';

    t.is(result.stdout, stdout, 'stdout');
    t.is(result.stderr.trim().length, 0, 'no stderr');

    return exists(path.join(t.context.dir, 'file.test'));
  }).then((results) => {
    t.is(results[0].exists, false, 'file.test not created');
  });
});

test('presets can be a function', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};
  const preset = {
    path: path.join(t.context.dir, 'my-custom-preset.js'),
    name: 'my-custom-preset'
  };

  return fs.writeFileAsync(preset.path, 'module.exports = function() { return ' + JSON.stringify(scripts) + '; };').then(() => {
    return t.context.modifyPkg({'npm-preset': {presets: [preset]}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir});
  }).then((result) => {
    let stdout = '';

    stdout += '\nmy-custom-preset:\n';
    stdout += '  "touch": "touch ./file.test"\n';
    stdout += '\n';

    t.is(result.stdout, stdout, 'stdout');
    t.is(result.stderr.trim().length, 0, 'no stderr');

    return exists(path.join(t.context.dir, 'file.test'));
  }).then((results) => {
    t.is(results[0].exists, false, 'file.test not created');
  });
});

test('presets are skipped when not in npm-preset.preset', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};

  return t.context.addPreset('npm-preset-test', scripts, false).then(() => {
    return t.context.addPreset('npm-preset-test2', scripts, false);
  }).then(() => {
    return t.context.modifyPkg({'npm-preset': {presets: ['test']}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir});
  }).then((result) => {
    let stdout = '';

    stdout += '\nnpm-preset-test:\n';
    stdout += '  "touch": "touch ./file.test"\n';
    stdout += '\n';

    t.is(result.stdout, stdout, 'stdout');
    t.is(result.stderr.trim().length, 0, 'no stderr');

    return exists(path.join(t.context.dir, 'file.test'));
  }).then((results) => {
    t.is(results[0].exists, false, 'file.test not created');
  });
});

test('invalid presets error', (t) => {
  t.plan(3);

  return t.context.modifyPkg({'npm-preset': {presets: ['test']}}).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    t.is(result.stdout.trim(), '', 'stdout');
    t.not(result.stderr.trim().length, 0, 'stderr');
    t.not(result.exitCode, 0, 'failure');
  });
});

test('invalid scripts export error', (t) => {
  t.plan(3);

  return t.context.addPreset('npm-preset-test', 'cow').then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    t.is(result.stdout.trim(), '', 'stdout');
    t.not(result.stderr.trim().length, 0, 'stderr');
    t.not(result.exitCode, 0, 'failure');
  });
});

test('invalid dir', (t) => {
  t.plan(3);

  return fs.unlinkAsync(path.join(t.context.dir, 'package.json')).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    t.is(result.stdout.trim(), '', 'stdout');
    t.not(result.stderr.trim().length, 0, 'stderr');
    t.not(result.exitCode, 0, 'failure');
  });
});

test('presets can be found with scopes', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};

  return t.context.addPreset('@test/npm-preset-test', scripts, false).then(() => {
    return t.context.modifyPkg({dependencies: {'@test/npm-preset-test': '1.0.0'}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir});
  }).then((result) => {
    let stdout = '';

    stdout += '\n@test/npm-preset-test:\n';
    stdout += '  "touch": "touch ./file.test"\n';
    stdout += '\n';

    t.is(result.stdout, stdout, 'stdout');
    t.is(result.stderr.trim().length, 0, 'no stderr');

    return exists(path.join(t.context.dir, 'file.test'));
  }).then((results) => {
    t.is(results[0].exists, false, 'file.test not created');
  });
});

test('should shorten paths by default', (t) => {
  const base = path.join(__dirname, '..', '..');

  t.plan(3);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'echo ' + base }}}).then(() => {
    return promiseSpawn('npmp', ['echo'], {cwd: t.context.dir});
  }).then((result) => {
    t.false(RegExp(base, 'g').test(result.stdout.trim()), 'stdout');
    t.true(RegExp('<npmp>', 'g').test(result.stdout.trim()), 'stdout');
    t.is(result.stderr.trim().length, 0, 'no stderr');
  });
});

test('should shorten preset paths with short name', (t) => {
  const base = path.join(t.context.dir, 'node_modules', 'npm-preset-test');

  t.plan(3);
  return t.context.addPreset('npm-preset-test', {echo: 'echo ' + base}).then(() => {
    return t.context.modifyPkg({'npm-preset': {presets: ['test']}});
  }).then(() => {
    return promiseSpawn('npmp', ['echo'], {cwd: t.context.dir});
  }).then((result) => {
    t.false(RegExp(base, 'g').test(result.stdout.trim()), 'stdout');
    t.true(RegExp('<npmp-test>', 'g').test(result.stdout.trim()), 'stdout');
    t.is(result.stderr.trim().length, 0, 'no stderr');
  });
});

test('should shorten preset paths with long name', (t) => {
  const base = path.join(t.context.dir, 'node_modules', 'npm-preset-test');

  t.plan(3);
  return t.context.addPreset('npm-preset-test', {echo: 'echo ' + base}).then(() => {
    return promiseSpawn('npmp', ['echo'], {cwd: t.context.dir});
  }).then((result) => {
    t.false(RegExp(base, 'g').test(result.stdout.trim()), 'stdout');
    t.true(RegExp('<npmp-test>', 'g').test(result.stdout.trim()), 'stdout');
    t.is(result.stderr.trim().length, 0, 'no stderr');
  });
});

['-q', '--quiet'].forEach(function(o) {
  test(o, (t) => {
    t.plan(2);
    return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'npmp echo2', echo2: 'echo hello && echo no 1>&2'}}}).then(() => {
      return promiseSpawn('npmp', [o, 'echo'], {cwd: t.context.dir});
    }).then((result) => {
      t.is(result.stdout.trim().length, 0, 'no stdout');
      t.is(result.stderr.trim(), 'no', 'stderr');
    });
  });

  test(o + ' nested only', (t) => {
    t.plan(2);
    return t.context.modifyPkg({'npm-preset': {scripts: {echo: `npmp ${o} echo2`, echo2: 'echo no && echo hello 1>&2'}}}).then(() => {
      return promiseSpawn('npmp', ['-co', 'echo2', 'echo', 'echo2'], {cwd: t.context.dir});
    }).then((result) => {
      const stderrs = result.stderr.trim().split('\n');
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(['hello', 'hello', 'hello'], stderrs, 'stderrs expected');
      t.deepEqual(['no', 'no'], stdouts, 'stdouts expected');
    });
  });
});

['-si', '--silent'].forEach(function(o) {
  test(o, (t) => {
    t.plan(2);
    return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'npmp echo2', echo2: 'echo hello && echo no 1>&2'}}}).then(() => {
      return promiseSpawn('npmp', [o, 'echo'], {cwd: t.context.dir});
    }).then((result) => {
      t.is(result.stdout.trim().length, 0, 'no stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });

  test(o + ' nested only', (t) => {
    t.plan(2);
    return t.context.modifyPkg({'npm-preset': {scripts: {echo: `npmp ${o} echo2`, echo2: 'echo hello'}}}).then(() => {
      return promiseSpawn('npmp', ['-co', 'echo2', 'echo', 'echo2'], {cwd: t.context.dir});
    }).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(['hello', 'hello'], stdouts, 'stdouts as expected');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });
});

['-co', '--commands-only'].forEach(function(o) {
  test(o, (t) => {
    t.plan(2);
    return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'npmp echo2', echo2: 'echo 1'}}}).then(() => {
      return promiseSpawn('npmp', [o, 'echo'], {cwd: t.context.dir});
    }).then((result) => {
      t.is(result.stdout.trim(), '1', 'stdout of 1');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });
});

['-ns', '--no-shorten'].forEach(function(o) {
  test(o, (t) => {
    const base = path.join(__dirname, '..', '..');

    t.plan(3);
    return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'npmp echo2', echo2: 'echo ' + base}}}).then(() => {
      return promiseSpawn('npmp', [o, 'echo'], {cwd: t.context.dir});
    }).then((result) => {
      t.true(RegExp(base, 'g').test(result.stdout.trim()), 'stdout');
      t.false(RegExp('<npmp>', 'g').test(result.stdout.trim()), 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });

  test(o + ' nested only', (t) => {
    const base = path.join(__dirname, '..', '..');

    t.plan(2);
    return t.context.modifyPkg({'npm-preset': {scripts: {echo: `npmp ${o} echo2`, echo2: 'echo ' + base}}}).then(() => {
      return promiseSpawn('npmp', ['-co', 'echo2', 'echo', 'echo2'], {cwd: t.context.dir});
    }).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(['<npmp>', base, '<npmp>'], stdouts, 'stdouts as expected');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });
});

test('invalid script', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch ./file.test'}}}).then(() => {
    return promiseSpawn('npmp', ['nope'], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    t.not(result.exitCode, 0, 'did not succeed');
  });
});

test('no scripts', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {}}}).then(() => {
    return promiseSpawn('npmp', ['nope'], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    t.not(result.exitCode, 0, 'did not succeed');
  });
});

test('no script passed in', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch ./file.test'}}}).then(() => {
    return promiseSpawn('npmp', [], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    t.not(result.exitCode, 0, 'did not succeed');
  });
});

test('stderr works', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo: '>&2 echo wat'}}}).then(() => {
    return promiseSpawn('npmp', ['--no-shorten', 'echo'], {cwd: t.context.dir});
  }).then((result) => {
    t.is(result.stderr.trim(), 'wat', 'stderr reported');
  });
});

test('serial: subargs work', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'echo hello'}}}).then(() => {
    return promiseSpawn('npmp', ['-co', 'echo', '--', 'world'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['hello world'], 'sub args worked');
  });
});

test('parallel: subargs work', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'echo hello'}}}).then(() => {
    return promiseSpawn('npmp', ['-co', '-p', 'echo', '--', 'world'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['hello world'], 'sub args worked');
  });
});

test('serial: single', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch ./file.test'}}}).then(() => {
    return promiseSpawn('npmp', ['touch'], {cwd: t.context.dir});
  }).then(() => {
    return exists(path.join(t.context.dir, 'file.test'));
  }).then((results) => {
    t.is(results[0].exists, true, 'file.test created');
  });
});

test('can run in subdir', (t) => {
  t.plan(1);
  const testDir = path.join(t.context.dir, 'test');

  return mkdirp(testDir).then(() => {
    return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch ./file.test'}}});
  }).then(() => {
    return promiseSpawn(path.join('..', 'node_modules', '.bin', 'npmp'), ['touch'], {cwd: testDir});
  }).then(() => {
    return exists(path.join(t.context.dir, 'file.test'));
  }).then((results) => {
    t.is(results[0].exists, true, 'file.test created');
  });
});

test('serial: double', (t) => {
  t.plan(2);
  return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch file.test', touch2: 'touch file2.test'}}}).then(() => {
    return promiseSpawn('npmp', ['touch', 'touch2'], {cwd: t.context.dir});
  }).then(() => {
    return exists([
      path.join(t.context.dir, 'file.test'),
      path.join(t.context.dir, 'file2.test')
    ]);
  }).then((results) => {
    t.is(results[0].exists, true, 'file.test created');
    t.is(results[1].exists, true, 'file2.test created');
  });
});

test('serial: *', (t) => {
  t.plan(4);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    'touch:one': 'touch file.test',
    'touch:two': 'touch file2.test',
    'touch': 'touch file3.test',
    'touch:one:two': 'touch file4.test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['touch:*'], {cwd: t.context.dir});
  }).then(() => {
    return exists([
      path.join(t.context.dir, 'file.test'),
      path.join(t.context.dir, 'file2.test'),
      path.join(t.context.dir, 'file3.test'),
      path.join(t.context.dir, 'file4.test')
    ]);
  }).then((results) => {
    results.forEach(function(r) {
      let shouldExist = true;

      if ((/file(3|4).test/).test(path.basename(r.file))) {
        shouldExist = false;
      }
      t.is(r.exists, shouldExist);
    });
  });
});

test('parallel: single', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch ./file.test'}}}).then(() => {
    return promiseSpawn('npmp', ['-p', 'touch'], {cwd: t.context.dir});
  }).then(() => {
    return exists(path.join(t.context.dir, 'file.test'));
  }).then((results) => {
    t.is(results[0].exists, true, 'file.test created');
  });
});

test('parallel: double', (t) => {
  t.plan(2);
  return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch file.test', touch2: 'touch file2.test'}}}).then(() => {
    return promiseSpawn('npmp', ['-p', 'touch', 'touch2'], {cwd: t.context.dir});
  }).then(() => {
    return exists([
      path.join(t.context.dir, 'file.test'),
      path.join(t.context.dir, 'file2.test')
    ]);
  }).then((results) => {
    t.is(results[0].exists, true, 'file.test created');
    t.is(results[1].exists, true, 'file2.test created');
  });
});

test('parallel: *', (t) => {
  t.plan(4);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    'touch:one': 'touch file.test',
    'touch:two': 'touch file2.test',
    'touch': 'touch file3.test',
    'touch:one:two': 'touch file4.test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['-p', 'touch:*'], {cwd: t.context.dir});
  }).then(() => {
    return exists([
      path.join(t.context.dir, 'file.test'),
      path.join(t.context.dir, 'file2.test'),
      path.join(t.context.dir, 'file3.test'),
      path.join(t.context.dir, 'file4.test')
    ]);
  }).then((results) => {
    results.forEach(function(r) {
      let shouldExist = true;

      if ((/file(3|4).test/).test(path.basename(r.file))) {
        shouldExist = false;
      }
      t.is(r.exists, shouldExist);
    });
  });
});

test('serial and parallel: single', (t) => {
  t.plan(2);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    touch: 'touch ./file.test',
    touch2: 'touch ./file2.test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['touch', '-p', 'touch2'], {cwd: t.context.dir});
  }).then(() => {
    return exists([
      path.join(t.context.dir, 'file.test'),
      path.join(t.context.dir, 'file2.test')
    ]);
  }).then((results) => {
    t.is(results[0].exists, true, 'file.test created');
    t.is(results[1].exists, true, 'file2.test created');
  });
});

test('serial and parallel: double', (t) => {
  t.plan(4);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    touch: 'touch ./file.test',
    touch2: 'touch ./file2.test',
    touch3: 'touch ./file3.test',
    touch4: 'touch ./file4.test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['touch', 'touch2', '-p', 'touch3', 'touch4'], {cwd: t.context.dir});
  }).then(() => {
    return exists([
      path.join(t.context.dir, 'file.test'),
      path.join(t.context.dir, 'file2.test'),
      path.join(t.context.dir, 'file3.test'),
      path.join(t.context.dir, 'file4.test')
    ]);
  }).then((results) => {
    results.forEach((r) => t.is(r.exists, true, 'file was created'));
  });
});

test('serial and parallel: *', (t) => {
  t.plan(8);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    'serial:one': 'touch ./file.test',
    'serial:two': 'touch ./file2.test',
    'parallel:one': 'touch ./file3.test',
    'parallel:two': 'touch ./file4.test',
    // there should not be run
    'parallel:one:one': 'touch ./file5.test',
    'parallel': 'touch ./file6.test',
    'serial:one:one': 'touch ./file7.test',
    'serial': 'touch ./file8.test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['-s', 'serial:*', '-p', 'parallel:*'], {cwd: t.context.dir});
  }).then(() => {
    return exists([
      path.join(t.context.dir, 'file.test'),
      path.join(t.context.dir, 'file2.test'),
      path.join(t.context.dir, 'file3.test'),
      path.join(t.context.dir, 'file4.test'),
      path.join(t.context.dir, 'file5.test'),
      path.join(t.context.dir, 'file6.test'),
      path.join(t.context.dir, 'file7.test'),
      path.join(t.context.dir, 'file8.test')
    ]);
  }).then((results) => {
    results.forEach(function(r) {
      let shouldExist = true;

      if ((/file(5|6|7|8).test/).test(path.basename(r.file))) {
        shouldExist = false;
      }
      t.is(r.exists, shouldExist);
    });
  });
});

test('serial: nested', (t) => {
  t.plan(2);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    'serial': 'npmp serial:*',
    'serial:one': 'touch ./file.test',
    'serial:two': 'touch ./file2.test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['serial'], {cwd: t.context.dir});
  }).then(() => {
    return exists([
      path.join(t.context.dir, 'file.test'),
      path.join(t.context.dir, 'file2.test')
    ]);
  }).then((results) => {
    t.is(results[0].exists, true, 'file.test created');
    t.is(results[1].exists, true, 'file2.test created');
  });
});

test('parallel: nested', (t) => {
  t.plan(2);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    'parallel': 'npmp -p parallel:*',
    'parallel:one': 'touch ./file.test',
    'parallel:two': 'touch ./file2.test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['parallel'], {cwd: t.context.dir});
  }).then(() => {
    return exists([
      path.join(t.context.dir, 'file.test'),
      path.join(t.context.dir, 'file2.test')
    ]);
  }).then((results) => {
    t.is(results[0].exists, true, 'file.test created');
    t.is(results[1].exists, true, 'file2.test created');
  });
});

test('deeply nested', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    'test': 'npmp test:one',
    'test:one': 'npmp test:one:one test:one:two',
    'test:one:one': 'echo 1',
    'test:one:two': 'echo 2'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'test'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['1', '2'], 'runs deeply nested');
  });
});

test('verify serial default', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    'test:one': 'echo 1',
    'test:two': 'echo 2',
    'test:three': 'echo 3',
    'test:four': 'echo 4',
    'test:five': 'echo 5',
    'test:six': 'echo 6',
    'test:seven': 'echo 7',
    'test:eight': 'echo 8'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'test:*'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['1', '2', '3', '4', '5', '6', '7', '8'], 'serial order');
  });
});

test('verify serial default', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    'test:one': 'echo 1',
    'test:two': 'sleep 1 && echo 2',
    'test:three': 'echo 3'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-s', 'test:*'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['1', '2', '3'], 'serial order');
  });
});

test('verify parallel order', (t) => {
  t.plan(4);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    'test:one': 'echo 1',
    'test:two': 'sleep 1 && echo 2',
    'test:three': 'echo 3'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'test:*'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.notDeepEqual(stdouts, ['1', '2', '3'], 'non serial order');
    t.not(stdouts.indexOf('1'), -1, '1 was printed');
    t.not(stdouts.indexOf('2'), -1, '2 was printed');
    t.not(stdouts.indexOf('3'), -1, '3 was printed');
  });
});

test('verify serial & parallel', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    'test:one': 'sleep 1 && echo 1',
    'test:two': 'echo 2',
    'test:three': 'echo 3',
    'test:four': 'echo 4',
    'test:five': 'sleep 1 && echo 5',
    'test:six': 'echo 6',
    'test:seven': 'echo 7',
    'test:eight': 'echo 8'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only',
      '-p', 'test:one', 'test:two',
      '-s', 'test:three', 'test:four',
      '-p', 'test:five', 'test:six',
      '-s', 'test:seven', 'test:eight'
    ], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['2', '1', '3', '4', '6', '5', '7', '8'], 'order is as expected');
    });
  });
});

test('serial: first exit failure', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'exit 1'
  }}}).then(() => {
    return promiseSpawn('npmp', ['one'], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    t.not(result.exitCode, 0, 'fails');
  });
});

test('serial: second exit failure', (t) => {
  t.plan(2);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'echo test',
    two: 'sleep 1 && exit 1'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one', 'two'], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    t.is(result.stdout.trim(), 'test', 'test is printed');
    t.not(result.exitCode, 0, 'fails');
  });
});

test('parallel: first exit failure', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'exit 1'
  }}}).then(() => {
    return promiseSpawn('npmp', ['-p', 'one'], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    t.not(result.exitCode, 0, 'fails');
  });
});

test('parallel: second exit failure', (t) => {
  t.plan(2);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'echo test',
    two: 'sleep 1 && exit 1'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one', 'two'], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    t.is(result.stdout.trim(), 'test', 'test is printed');
    t.not(result.exitCode, 0, 'fails');
  });
});

test('serial: pre script', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'echo test',
    preone: 'echo pre'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['pre', 'test'], 'pre is run before main');
  });
});

test('serial: post script', (t) => {

  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'echo test',
    postone: 'echo post'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['test', 'post'], 'post is after before main');
  });
});

test('serial: pre and post script', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    preone: 'echo pre',
    one: 'echo test',
    postone: 'echo post'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['pre', 'test', 'post'], 'pre test and post');
  });
});

test('serial: pre and double pre ', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    preone: 'echo pre',
    prepreone: 'echo prepre',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['prepre', 'pre', 'test'], 'double pre');
  });
});

test('serial: post and double post', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    postpostone: 'echo postpost',
    postone: 'echo post',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['test', 'post', 'postpost'], 'double post');
  });
});

test('serial: pre failure', (t) => {
  t.plan(2);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    preone: 'exit 1',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    t.is(result.stdout.trim().length, 0, 'nothing printed');
    t.not(result.exitCode, 0, 'failed');
  });
});

test('serial: post failure', (t) => {
  t.plan(2);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    postone: 'exit 1',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['test'], 'test printed');
    t.not(result.exitCode, 0, 'failed');
  });
});

test('parallel: pre script', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'echo test',
    preone: 'echo pre'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['pre', 'test'], 'pre is run before main');
  });
});

test('parallel: post script', (t) => {

  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'echo test',
    postone: 'echo post'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['test', 'post'], 'post is after before main');
  });
});

test('parallel: pre and post script', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    preone: 'echo pre',
    one: 'echo test',
    postone: 'echo post'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['pre', 'test', 'post'], 'pre test and post');
  });
});

test('parallel: pre and double pre ', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    preone: 'echo pre',
    prepreone: 'echo prepre',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['prepre', 'pre', 'test'], 'double pre');
  });
});

test('parallel: post and double post', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    postpostone: 'echo postpost',
    postone: 'echo post',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['test', 'post', 'postpost'], 'double post');
  });
});

test('parallel: pre failure', (t) => {
  t.plan(2);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    preone: 'exit 1',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    t.is(result.stdout.trim().length, 0, 'nothing printed');
    t.not(result.exitCode, 0, 'failed');
  });
});

test('parallel: post failure', (t) => {
  t.plan(2);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    postone: 'exit 1',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir, ignoreExitCode: true});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['test'], 'test printed');
    t.not(result.exitCode, 0, 'failed');
  });
});

test('&& works', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo2: 'echo hello', echo: 'npmp echo2 && echo world'}}}).then(() => {
    return promiseSpawn('npmp', ['-co', 'echo'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['hello', 'world'], 'sub args worked');
  });
});

test('|| works', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo2: 'exit 1', echo: 'npmp echo2 || echo world'}}}).then(() => {
    return promiseSpawn('npmp', ['-co', 'echo'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['world'], 'sub args worked');
  });
});

test('; works', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo2: 'echo hello', echo: 'npmp echo2; echo world'}}}).then(() => {
    return promiseSpawn('npmp', ['-co', 'echo'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['hello', 'world'], 'sub args worked');
  });
});

test('| works', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'echo \'console.log("hello world");\' | node'}}}).then(() => {
    return promiseSpawn('npmp', ['-co', 'echo'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['hello world'], 'sub args worked');
  });
});

test('$() works', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'echo $(echo hello)'}}}).then(() => {
    return promiseSpawn('npmp', ['-co', 'echo'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['hello'], 'sub args worked');
  });
});

test('> works', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo2: 'echo hello world', echo: 'npmp -co echo2 > test.txt'}}}).then(() => {
    return promiseSpawn('npmp', ['echo'], {cwd: t.context.dir});
  }).then((result) => {
    return fs.readFileAsync(path.join(t.context.dir, 'test.txt'), 'utf8');
  }).then((data) => {
    t.deepEqual(data, 'hello world\n', 'sub args worked');
  });
});

test('>> works', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo3: 'echo world', echo2: 'echo hello', echo: 'npmp -co echo2 echo3 >> test.txt'}}}).then(() => {
    return promiseSpawn('npmp', ['echo', 'echo2'], {cwd: t.context.dir});
  }).then((result) => {
    return fs.readFileAsync(path.join(t.context.dir, 'test.txt'), 'utf8');
  }).then((data) => {
    t.deepEqual(data, 'hello\nworld\n', 'sub args worked');
  });
});

test('bin in node_modules works', (t) => {
  t.plan(1);

  return fs.writeFileAsync(
    path.join(t.context.dir, 'node_modules', '.bin', 'test-me'),
    '#!/usr/bin/env node\nconsole.log("hello world");',
    {mode: '0777'}
  ).then(() => {
    return t.context.modifyPkg({'npm-preset': {scripts: {test: 'test-me'}}});
  }).then(() => {
    return promiseSpawn('npmp', ['-co', 'test'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['hello world'], 'sub args worked');
  });
});

test('bin in preset node_modules works', (t) => {
  t.plan(1);
  const dir = path.join(t.context.dir, 'node_modules', 'npm-preset-test', 'node_modules', '.bin');

  return t.context.addPreset('npm-preset-test', {test: 'test-me'}).then(() => {
    return mkdirp(dir);
  }).then(() => {
    return fs.writeFileAsync(
      path.join(dir, 'test-me'),
      '#!/usr/bin/env node\nconsole.log("hello world");',
      {mode: '0777'}
    );
  }).then(() => {
    return promiseSpawn('npmp', ['-co', 'test'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['hello world'], 'sub args worked');
  });
});

