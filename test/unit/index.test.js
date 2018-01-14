const test = require('ava');
const path = require('path');
const uuid = require('uuid');
const fs = require('fs');
const shelljs = require('shelljs');
const childProcess = require('child_process');
const Promise = require('bluebird');

process.setMaxListeners(1000);

const fixtureDir = path.join(__dirname, '..', 'fixtures', 'test-pkg-main');
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

const exists = function(filepath) {
  try {
    fs.accessSync(filepath);
  } catch (e) {
    return false;
  }
  return true;
};

test.before((t) => {
  return promiseSpawn('node', [path.join(baseDir, 'test', 'scripts', 'clean.js')]).then(() => {
    return promiseSpawn('node', [path.join(baseDir, 'test', 'scripts', 'setup.js')]);
  });
});

test.after.always((t) => {
  return promiseSpawn('node', [path.join(baseDir, 'test', 'scripts', 'clean.js')]);
});

test.beforeEach((t) => {
  const tempdir = path.join(shelljs.tempdir(), uuid.v4());

  t.context.dir = tempdir;
  t.context.modifyPkg = (newPkg) => {
    return new Promise((resolve, reject) => {
      const pkgPath = path.join(tempdir, 'package.json');
      const oldPkg = require(pkgPath);

      resolve(fs.writeFileSync(pkgPath, JSON.stringify(Object.assign(oldPkg, newPkg))));
    });
  };

  t.context.addPreset = (name, scripts, modifyPkg) => {
    return new Promise((resolve, reject) => {
      if (typeof modifyPkg === 'undefined') {
        modifyPkg = true;
      }

      const dir = path.join(tempdir, 'node_modules', name);

      shelljs.mkdir('-p', dir);
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

      fs.writeFileSync(path.join(dir, 'index.js'), 'module.exports = ' + JSON.stringify(scripts) + ';');
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg));

      if (modifyPkg) {
        const updatePkg = {dependencies: {}};

        updatePkg.dependencies[name] = '1.0.0';
        t.context.modifyPkg(updatePkg);
      }

      resolve();
    });
  };

  return promiseSpawn('cp', ['-R', fixtureDir + path.sep, tempdir], {});
});

test.afterEach.always((t) => {
  if (t.context.dir) {
    return promiseSpawn('rm', ['-rf', t.context.dir], {});
  }
});

['-pc', '--print-config'].forEach(function(o) {
  test(o, (t) => {
    t.plan(3);
    return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch ./file.test'}}}).then(() => {
      return promiseSpawn('npmp', [o, 'touch'], {cwd: t.context.dir}).then((result) => {
        t.false(exists(path.join(t.context.dir, 'file.test')), 'file was created');
        t.not(result.stdout.trim(), 0, 'stdout');
        t.is(result.stderr.trim().length, 0, 'no stderr');
      });
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
      return promiseSpawn('npmp', [o, 'touch'], {cwd: t.context.dir}).then((result) => {
        t.false(exists(path.join(t.context.dir, 'file.test')), 'file was created');
        t.not(result.stdout.trim(), 0, 'stdout');
        t.is(result.stderr.trim().length, 0, 'no stderr');
      });
    });
  });
});

['-h', '--help'].forEach(function(o) {
  test(o, (t) => {
    t.plan(3);
    return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch ./file.test'}}}).then(() => {
      return promiseSpawn('npmp', [o, 'touch'], {cwd: t.context.dir}).then((result) => {
        t.false(exists(path.join(t.context.dir, 'file.test')), 'file was not created');
        t.not(result.stdout.trim(), 0, 'stdout');
        t.is(result.stderr.trim().length, 0, 'no stderr');
      });
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
      return promiseSpawn('npmp', [o, 'touch'], {cwd: t.context.dir}).then((result) => {
        let stdout = '';

        stdout += '\nnpm-preset:\n';
        stdout += '  "touch": "touch ./file.test"\n';

        stdout += '\nnpm-preset-test:\n';
        stdout += '  "touch": "touch ./file.test"\n';
        stdout += '\n';

        t.false(exists(path.join(t.context.dir, 'file.test')), 'file was not created');
        t.is(result.stdout, stdout, 'stdout');
        t.is(result.stderr.trim().length, 0, 'no stderr');
      });
    });
  });
});

test('scripts from different sources run in parallel', (t) => {
  t.plan(2);
  return t.context.addPreset('npm-preset-test', {echo: 'echo preset-echo'}).then(() => {
    return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'sleep 1 && echo npmp-echo'}}});
  }).then(() => {
    return promiseSpawn('npmp', ['-co', 'echo'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['preset-echo', 'npmp-echo'], 'prints two');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });
});

test('presets can be found via deps', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};

  return t.context.addPreset('npm-preset-test', scripts, false).then(() => {
    return t.context.modifyPkg({dependencies: {'npm-preset-test': '1.0.0'}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir}).then((result) => {
      let stdout = '';

      stdout += '\nnpm-preset-test:\n';
      stdout += '  "touch": "touch ./file.test"\n';
      stdout += '\n';

      t.false(exists(path.join(t.context.dir, 'file.test')), 'file was not created');
      t.is(result.stdout, stdout, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });
});

test('presets can be found via dev deps', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};

  return t.context.addPreset('npm-preset-test', scripts, false).then(() => {
    return t.context.modifyPkg({devDependencies: {'npm-preset-test': '1.0.0'}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir}).then((result) => {
      let stdout = '';

      stdout += '\nnpm-preset-test:\n';
      stdout += '  "touch": "touch ./file.test"\n';
      stdout += '\n';

      t.false(exists(path.join(t.context.dir, 'file.test')), 'file was not created');
      t.is(result.stdout, stdout, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });
});

test('presets can be found via npm-preset.preset long name', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};

  return t.context.addPreset('npm-preset-test', scripts, false).then(() => {
    return t.context.modifyPkg({'npm-preset': {presets: ['npm-preset-test']}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir}).then((result) => {
      let stdout = '';

      stdout += '\nnpm-preset-test:\n';
      stdout += '  "touch": "touch ./file.test"\n';
      stdout += '\n';

      t.false(exists(path.join(t.context.dir, 'file.test')), 'file was not created');
      t.is(result.stdout, stdout, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });
});

test('presets can be found via npm-preset.preset short name', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};

  return t.context.addPreset('npm-preset-test', scripts, false).then(() => {
    return t.context.modifyPkg({'npm-preset': {presets: ['test']}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir}).then((result) => {
      let stdout = '';

      stdout += '\nnpm-preset-test:\n';
      stdout += '  "touch": "touch ./file.test"\n';
      stdout += '\n';

      t.false(exists(path.join(t.context.dir, 'file.test')), 'file was not created');
      t.is(result.stdout, stdout, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });
});

test('presets can be an object in npm-preset.preset', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};
  const preset = {
    path: path.join(t.context.dir, 'my-custom-preset.js'),
    name: 'my-custom-preset'
  };

  return new Promise((resolve, reject) => {
    fs.writeFileSync(preset.path, 'module.exports = ' + JSON.stringify(scripts) + ';');
    resolve();
  }).then(() => {
    return t.context.modifyPkg({'npm-preset': {presets: [preset]}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir}).then((result) => {
      let stdout = '';

      stdout += '\nmy-custom-preset:\n';
      stdout += '  "touch": "touch ./file.test"\n';
      stdout += '\n';

      t.false(exists(path.join(t.context.dir, 'file.test')), 'file was not created');
      t.is(result.stdout, stdout, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });
});

test('presets can be a function', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};
  const preset = {
    path: path.join(t.context.dir, 'my-custom-preset.js'),
    name: 'my-custom-preset'
  };

  return new Promise((resolve, reject) => {
    fs.writeFileSync(preset.path, 'module.exports = function() { return ' + JSON.stringify(scripts) + '; };');
    resolve();
  }).then(() => {
    return t.context.modifyPkg({'npm-preset': {presets: [preset]}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir}).then((result) => {
      let stdout = '';

      stdout += '\nmy-custom-preset:\n';
      stdout += '  "touch": "touch ./file.test"\n';
      stdout += '\n';

      t.false(exists(path.join(t.context.dir, 'file.test')), 'file was not created');
      t.is(result.stdout, stdout, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
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
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir}).then((result) => {
      let stdout = '';

      stdout += '\nnpm-preset-test:\n';
      stdout += '  "touch": "touch ./file.test"\n';
      stdout += '\n';

      t.false(exists(path.join(t.context.dir, 'file.test')), 'file was not created');
      t.is(result.stdout, stdout, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });
});

test('invalid presets error', (t) => {
  t.plan(3);

  return t.context.modifyPkg({'npm-preset': {presets: ['test']}}).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
      t.is(result.stdout.trim(), '', 'stdout');
      t.not(result.stderr.trim().length, 0, 'stderr');
      t.not(result.exitCode, 0, 'failure');
    });
  });
});

test('presets can be found with scopes', (t) => {
  t.plan(3);
  const scripts = {touch: 'touch ./file.test'};

  return t.context.addPreset('@test/npm-preset-test', scripts, false).then(() => {
    return t.context.modifyPkg({dependencies: {'@test/npm-preset-test': '1.0.0'}});
  }).then(() => {
    return promiseSpawn('npmp', ['--list'], {cwd: t.context.dir}).then((result) => {
      let stdout = '';

      stdout += '\n@test/npm-preset-test:\n';
      stdout += '  "touch": "touch ./file.test"\n';
      stdout += '\n';

      t.false(exists(path.join(t.context.dir, 'file.test')), 'file was not created');
      t.is(result.stdout, stdout, 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });
});

test('should shorten paths by default', (t) => {
  const base = path.join(__dirname, '..', '..');

  t.plan(3);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'echo ' + base }}}).then(() => {
    return promiseSpawn('npmp', ['echo'], {cwd: t.context.dir}).then((result) => {
      t.false(new RegExp(base, 'g').test(result.stdout.trim()), 'stdout');
      t.true(new RegExp('<npmp>', 'g').test(result.stdout.trim()), 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
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
    t.false(new RegExp(base, 'g').test(result.stdout.trim()), 'stdout');
    t.true(new RegExp('<npmp-test>', 'g').test(result.stdout.trim()), 'stdout');
    t.is(result.stderr.trim().length, 0, 'no stderr');
  });
});

test('should shorten preset paths with long name', (t) => {
  const base = path.join(t.context.dir, 'node_modules', 'npm-preset-test');

  t.plan(3);
  return t.context.addPreset('npm-preset-test', {echo: 'echo ' + base}).then(() => {
    return promiseSpawn('npmp', ['echo'], {cwd: t.context.dir}).then((result) => {
      t.false(new RegExp(base, 'g').test(result.stdout.trim()), 'stdout');
      t.true(new RegExp('<npmp-test>', 'g').test(result.stdout.trim()), 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });
});

['-q', '--quiet'].forEach(function(o) {
  test(o, (t) => {
    t.plan(2);
    return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'npmp echo2', echo2: 'echo hello && echo no 1>&2'}}}).then(() => {
      return promiseSpawn('npmp', [o, 'echo'], {cwd: t.context.dir}).then((result) => {
        t.is(result.stdout.trim().length, 0, 'no stdout');
        t.is(result.stderr.trim(), 'no', 'stderr');
      });
    });
  });
});

['-si', '--silent'].forEach(function(o) {
  test(o, (t) => {
    t.plan(2);
    return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'npmp echo2', echo2: 'echo hello && echo no 1>&2'}}}).then(() => {
      return promiseSpawn('npmp', [o, 'echo'], {cwd: t.context.dir}).then((result) => {
        t.is(result.stdout.trim().length, 0, 'no stdout');
        t.is(result.stderr.trim().length, 0, 'no stderr');
      });
    });
  });
});

['-co', '--commands-only'].forEach(function(o) {
  test(o, (t) => {
    t.plan(2);
    return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'npmp echo2', echo2: 'echo 1'}}}).then(() => {
      return promiseSpawn('npmp', [o, 'echo'], {cwd: t.context.dir}).then((result) => {
        t.is(result.stdout.trim(), '1', 'stdout of 1');
        t.is(result.stderr.trim().length, 0, 'no stderr');
      });
    });
  });
});

['-ns', '--no-shorten'].forEach(function(o) {
  test(o, (t) => {
    const base = path.join(__dirname, '..', '..');

    t.plan(3);
    return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'npmp echo2', echo2: 'echo ' + base}}}).then(() => {
      return promiseSpawn('npmp', [o, 'echo'], {cwd: t.context.dir}).then((result) => {
        t.true(new RegExp(base, 'g').test(result.stdout.trim()), 'stdout');
        t.false(new RegExp('<npmp>', 'g').test(result.stdout.trim()), 'stdout');
        t.is(result.stderr.trim().length, 0, 'no stderr');
      });
    });
  });
});

test('invalid script', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch ./file.test'}}}).then(() => {
    return promiseSpawn('npmp', ['nope'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
      t.not(result.exitCode, 0, 'did not succeed');
    });
  });
});

test('no scripts', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {}}}).then(() => {
    return promiseSpawn('npmp', ['nope'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
      t.not(result.exitCode, 0, 'did not succeed');
    });
  });
});

test('no script passed in', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch ./file.test'}}}).then(() => {
    return promiseSpawn('npmp', [], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
      t.not(result.exitCode, 0, 'did not succeed');
    });
  });
});

test('stderr works', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo: '>&2 echo wat'}}}).then(() => {
    return promiseSpawn('npmp', ['--no-shorten', 'echo'], {cwd: t.context.dir}).then((result) => {
      t.is(result.stderr.trim(), 'wat', 'stderr reported');
    });
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
    return promiseSpawn('npmp', ['touch'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
    });
  });
});

test('serial: double', (t) => {
  t.plan(2);
  return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch file.test', touch2: 'touch file2.test'}}}).then(() => {
    return promiseSpawn('npmp', ['touch', 'touch2'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
    });
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
    return promiseSpawn('npmp', ['touch:*'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
      t.false(exists(path.join(t.context.dir, 'file3.test')), 'file was not created');
      t.false(exists(path.join(t.context.dir, 'file4.test')), 'file was not created');
    });
  });
});

test('parallel: single', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch ./file.test'}}}).then(() => {
    return promiseSpawn('npmp', ['-p', 'touch'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
    });
  });
});

test('parallel: double', (t) => {
  t.plan(2);
  return t.context.modifyPkg({'npm-preset': {scripts: {touch: 'touch file.test', touch2: 'touch file2.test'}}}).then(() => {
    return promiseSpawn('npmp', ['-p', 'touch', 'touch2'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
    });
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
    return promiseSpawn('npmp', ['-p', 'touch:*'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
      t.false(exists(path.join(t.context.dir, 'file3.test')), 'file was not created');
      t.false(exists(path.join(t.context.dir, 'file4.test')), 'file was not created');
    });
  });
});

test('serial and parallel: single', (t) => {
  t.plan(2);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    touch: 'touch ./file.test',
    touch2: 'touch ./file2.test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['touch', '-p', 'touch2'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
    });
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
    return promiseSpawn('npmp', ['touch', 'touch2', '-p', 'touch3', 'touch4'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file3.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file4.test')), 'file was created');
    });
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
    return promiseSpawn('npmp', ['-s', 'serial:*', '-p', 'parallel:*'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file3.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file4.test')), 'file was created');

      t.false(exists(path.join(t.context.dir, 'file5.test')), 'file was created');
      t.false(exists(path.join(t.context.dir, 'file6.test')), 'file was created');
      t.false(exists(path.join(t.context.dir, 'file7.test')), 'file was created');
      t.false(exists(path.join(t.context.dir, 'file8.test')), 'file was created');
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
    return promiseSpawn('npmp', ['serial'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
    });
  });
});

test('parallel: nested', (t) => {
  t.plan(2);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    'parallel': 'npmp -p parallel:*',
    'parallel:one': 'touch ./file.test',
    'parallel:two': 'touch ./file2.test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['parallel'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
    });
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
    return promiseSpawn('npmp', ['--commands-only', 'test'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['1', '2'], 'runs deeply nested');
    });
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
    return promiseSpawn('npmp', ['--commands-only', 'test:*'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['1', '2', '3', '4', '5', '6', '7', '8'], 'serial order');
    });
  });
});

test('verify serial default', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    'test:one': 'echo 1',
    'test:two': 'sleep 1 && echo 2',
    'test:three': 'echo 3'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-s', 'test:*'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['1', '2', '3'], 'serial order');
    });
  });
});

test('verify parallel order', (t) => {
  t.plan(4);
  return t.context.modifyPkg({'npm-preset': {scripts: {
    'test:one': 'echo 1',
    'test:two': 'sleep 1 && echo 2',
    'test:three': 'echo 3'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'test:*'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.notDeepEqual(stdouts, ['1', '2', '3'], 'non serial order');
      t.not(stdouts.indexOf('1'), -1, '1 was printed');
      t.not(stdouts.indexOf('2'), -1, '2 was printed');
      t.not(stdouts.indexOf('3'), -1, '3 was printed');
    });
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
    return promiseSpawn('npmp', ['one'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
      t.not(result.exitCode, 0, 'fails');
    });
  });
});

test('serial: second exit failure', (t) => {
  t.plan(2);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'echo test',
    two: 'sleep 1 && exit 1'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one', 'two'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
      t.is(result.stdout.trim(), 'test', 'test is printed');
      t.not(result.exitCode, 0, 'fails');
    });
  });
});

test('parallel: first exit failure', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'exit 1'
  }}}).then(() => {
    return promiseSpawn('npmp', ['-p', 'one'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
      t.not(result.exitCode, 0, 'fails');
    });
  });
});

test('parallel: second exit failure', (t) => {
  t.plan(2);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'echo test',
    two: 'sleep 1 && exit 1'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one', 'two'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
      t.is(result.stdout.trim(), 'test', 'test is printed');
      t.not(result.exitCode, 0, 'fails');
    });
  });
});

test('serial: pre script', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'echo test',
    preone: 'echo pre'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['pre', 'test'], 'pre is run before main');
    });
  });
});

test('serial: post script', (t) => {

  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'echo test',
    postone: 'echo post'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['test', 'post'], 'post is after before main');
    });
  });
});

test('serial: pre and post script', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    preone: 'echo pre',
    one: 'echo test',
    postone: 'echo post'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['pre', 'test', 'post'], 'pre test and post');
    });
  });
});

test('serial: pre and double pre ', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    preone: 'echo pre',
    prepreone: 'echo prepre',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['prepre', 'pre', 'test'], 'double pre');
    });
  });

});

test('serial: post and double post', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    postpostone: 'echo postpost',
    postone: 'echo post',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['test', 'post', 'postpost'], 'double post');
    });
  });
});

test('serial: pre failure', (t) => {
  t.plan(2);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    preone: 'exit 1',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
      t.is(result.stdout.trim().length, 0, 'nothing printed');
      t.not(result.exitCode, 0, 'failed');
    });
  });
});

test('serial: post failure', (t) => {
  t.plan(2);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    postone: 'exit 1',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', 'one'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['test'], 'test printed');
      t.not(result.exitCode, 0, 'failed');
    });
  });
});

test('parallel: pre script', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'echo test',
    preone: 'echo pre'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['pre', 'test'], 'pre is run before main');
    });
  });
});

test('parallel: post script', (t) => {

  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    one: 'echo test',
    postone: 'echo post'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['test', 'post'], 'post is after before main');
    });
  });
});

test('parallel: pre and post script', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    preone: 'echo pre',
    one: 'echo test',
    postone: 'echo post'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['pre', 'test', 'post'], 'pre test and post');
    });
  });
});

test('parallel: pre and double pre ', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    preone: 'echo pre',
    prepreone: 'echo prepre',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['prepre', 'pre', 'test'], 'double pre');
    });
  });

});

test('parallel: post and double post', (t) => {
  t.plan(1);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    postpostone: 'echo postpost',
    postone: 'echo post',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['test', 'post', 'postpost'], 'double post');
    });
  });
});

test('parallel: pre failure', (t) => {
  t.plan(2);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    preone: 'exit 1',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
      t.is(result.stdout.trim().length, 0, 'nothing printed');
      t.not(result.exitCode, 0, 'failed');
    });
  });
});

test('parallel: post failure', (t) => {
  t.plan(2);

  return t.context.modifyPkg({'npm-preset': {scripts: {
    postone: 'exit 1',
    one: 'echo test'
  }}}).then(() => {
    return promiseSpawn('npmp', ['--commands-only', '-p', 'one'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['test'], 'test printed');
      t.not(result.exitCode, 0, 'failed');
    });
  });
});

test('&& works', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'echo hello && echo world'}}}).then(() => {
    return promiseSpawn('npmp', ['-co', 'echo'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['hello', 'world'], 'sub args worked');
  });
});

test('|| works', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'false || echo world'}}}).then(() => {
    return promiseSpawn('npmp', ['-co', 'echo'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['world'], 'sub args worked');
  });
});

test('; works', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'echo hello; echo world'}}}).then(() => {
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
  return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'echo hello world > test.txt'}}}).then(() => {
    return promiseSpawn('npmp', ['echo'], {cwd: t.context.dir});
  }).then((result) => {
    const data = fs.readFileSync(path.join(t.context.dir, 'test.txt'), 'utf8');

    t.deepEqual(data, 'hello world\n', 'sub args worked');
  });
});

test('>> works', (t) => {
  t.plan(1);
  return t.context.modifyPkg({'npm-preset': {scripts: {echo: 'echo hello > test.txt', echo2: 'echo world >> test.txt'}}}).then(() => {
    return promiseSpawn('npmp', ['echo', 'echo2'], {cwd: t.context.dir});
  }).then((result) => {
    const data = fs.readFileSync(path.join(t.context.dir, 'test.txt'), 'utf8');

    t.deepEqual(data, 'hello\nworld\n', 'sub args worked');
  });
});

test('bin in node_modules works', (t) => {
  t.plan(1);

  fs.writeFileSync(
    path.join(t.context.dir, 'node_modules', '.bin', 'test-me'),
    '#!/usr/bin/env node\nconsole.log("hello world");',
    {mode: '0777'}
  );

  return t.context.modifyPkg({'npm-preset': {scripts: {test: 'test-me'}}}).then(() => {
    return promiseSpawn('npmp', ['-co', 'test'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['hello world'], 'sub args worked');
  });
});

test('bin in preset node_modules works', (t) => {
  t.plan(1);

  return t.context.addPreset('npm-preset-test', {test: 'test-me'}).then(() => {
    const dir = path.join(t.context.dir, 'node_modules', 'npm-preset-test', 'node_modules', '.bin');

    shelljs.mkdir('-p', dir);
    fs.writeFileSync(
      path.join(dir, 'test-me'),
      '#!/usr/bin/env node\nconsole.log("hello world");',
      {mode: '0777'}
    );
    return promiseSpawn('npmp', ['-co', 'test'], {cwd: t.context.dir});
  }).then((result) => {
    const stdouts = result.stdout.trim().split('\n');

    t.deepEqual(stdouts, ['hello world'], 'sub args worked');
  });
});

