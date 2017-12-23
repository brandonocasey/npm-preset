import test from 'ava';
import path from 'path';
import uuid from 'uuid';
import fs from 'fs';
import shelljs from 'shelljs';
import npmRun from 'npm-run';
import Promise from 'bluebird';

const fixtureDir = path.join(__dirname, '..', 'fixtures', 'test-pkg-main');
const baseDir = path.join(__dirname, '..', '..');

const promiseSpawn = function(bin, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = npmRun.spawn(bin, args, options);
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
    return t.context.modifyPkg({scripts: {touch: 'touch ./file.test'}}).then(() => {
      return promiseSpawn('npms', [o, 'touch'], {cwd: t.context.dir}).then((result) => {
        t.false(exists(path.join(t.context.dir, 'file.test')), 'file was created');
        t.not(result.stdout.trim(), 0, 'stdout');
        t.is(result.stderr.trim().length, 0, 'no stderr');
      });
    });
  });
});

['-V', '--version'].forEach(function(o) {
  test(o, (t) => {
    t.plan(3);
    return t.context.modifyPkg({scripts: {touch: 'touch ./file.test'}}).then(() => {
      return promiseSpawn('npms', [o, 'touch'], {cwd: t.context.dir}).then((result) => {
        t.false(exists(path.join(t.context.dir, 'file.test')), 'file was created');
        t.not(result.stdout.trim(), 0, 'stdout');
        t.is(result.stderr.trim().length, 0, 'no stderr');
      });
    });
  });
});

['-l', '--list'].forEach(function(o) {
  test(o, (t) => {
    t.plan(3);
    return t.context.modifyPkg({scripts: {touch: 'touch ./file.test'}}).then(() => {
      return promiseSpawn('npms', [o, 'touch'], {cwd: t.context.dir}).then((result) => {
        t.false(exists(path.join(t.context.dir, 'file.test')), 'file was created');
        t.is(result.stdout.trim(), '"touch": "touch ./file.test"', 'stdout');
        t.is(result.stderr.trim().length, 0, 'no stderr');
      });
    });
  });
});

['-ns', '--no-shorten'].forEach(function(o) {
  test(o, (t) => {
    const base = path.join(__dirname, '..', '..');

    t.plan(3);
    return t.context.modifyPkg({scripts: {echo: 'echo ' + base}}).then(() => {
      return promiseSpawn('npms', [o, 'echo'], {cwd: t.context.dir}).then((result) => {
        t.true(new RegExp(base, 'g').test(result.stdout.trim()), 'stdout');
        t.false(new RegExp('<npms>', 'g').test(result.stdout.trim()), 'stdout');
        t.is(result.stderr.trim().length, 0, 'no stderr');
      });
    });
  });
});

test('should shorten paths by default', (t) => {
  const base = path.join(__dirname, '..', '..');

  t.plan(3);
  return t.context.modifyPkg({scripts: {echo: 'echo ' + base }}).then(() => {
    return promiseSpawn('npms', ['echo'], {cwd: t.context.dir}).then((result) => {
      t.false(new RegExp(base, 'g').test(result.stdout.trim()), 'stdout');
      t.true(new RegExp('<npms>', 'g').test(result.stdout.trim()), 'stdout');
      t.is(result.stderr.trim().length, 0, 'no stderr');
    });
  });
});

['-q', '--quiet'].forEach(function(o) {
  test(o, (t) => {
    t.plan(3);
    return t.context.modifyPkg({scripts: {touch: 'touch ./file.test'}}).then(() => {
      return promiseSpawn('npms', [o, 'touch'], {cwd: t.context.dir}).then((result) => {
        t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
        t.is(result.stdout.trim().length, 0, 'no stdout');
        t.is(result.stderr.trim().length, 0, 'no stderr');
      });
    });
  });
});

['-co', '--commands-only'].forEach(function(o) {
  test(o, (t) => {
    t.plan(2);
    return t.context.modifyPkg({scripts: {touch: 'echo 1'}}).then(() => {
      return promiseSpawn('npms', [o, 'touch'], {cwd: t.context.dir}).then((result) => {
        t.is(result.stdout.trim(), '1', 'stdout of 1');
        t.is(result.stderr.trim().length, 0, 'no stderr');
      });
    });
  });
});

test('serial: single', (t) => {
  t.plan(1);
  return t.context.modifyPkg({scripts: {touch: 'touch ./file.test'}}).then(() => {
    return promiseSpawn('npms', ['touch'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
    });
  });
});

test('serial: double', (t) => {
  t.plan(2);
  return t.context.modifyPkg({scripts: {touch: 'touch file.test', touch2: 'touch file2.test'}}).then(() => {
    return promiseSpawn('npms', ['touch', 'touch2'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
    });
  });
});

test('serial: *', (t) => {
  t.plan(4);
  return t.context.modifyPkg({scripts: {
    'touch:one': 'touch file.test',
    'touch:two': 'touch file2.test',
    'touch': 'touch file3.test',
    'touch:one:two': 'touch file4.test'
  }}).then(() => {
    return promiseSpawn('npms', ['touch:*'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
      t.false(exists(path.join(t.context.dir, 'file3.test')), 'file was not created');
      t.false(exists(path.join(t.context.dir, 'file4.test')), 'file was not created');
    });
  });
});

test('parallel: single', (t) => {
  t.plan(1);
  return t.context.modifyPkg({scripts: {touch: 'touch ./file.test'}}).then(() => {
    return promiseSpawn('npms', ['-p', 'touch'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
    });
  });
});

test('parallel: double', (t) => {
  t.plan(2);
  return t.context.modifyPkg({scripts: {touch: 'touch file.test', touch2: 'touch file2.test'}}).then(() => {
    return promiseSpawn('npms', ['-p', 'touch', 'touch2'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
    });
  });
});

test('parallel: *', (t) => {
  t.plan(4);
  return t.context.modifyPkg({scripts: {
    'touch:one': 'touch file.test',
    'touch:two': 'touch file2.test',
    'touch': 'touch file3.test',
    'touch:one:two': 'touch file4.test'
  }}).then(() => {
    return promiseSpawn('npms', ['-p', 'touch:*'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
      t.false(exists(path.join(t.context.dir, 'file3.test')), 'file was not created');
      t.false(exists(path.join(t.context.dir, 'file4.test')), 'file was not created');
    });
  });
});

test('serial and parallel: single', (t) => {
  t.plan(2);
  return t.context.modifyPkg({scripts: {
    touch: 'touch ./file.test',
    touch2: 'touch ./file2.test'
  }}).then(() => {
    return promiseSpawn('npms', ['touch', '-p', 'touch2'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
    });
  });
});

test('serial and parallel: double', (t) => {
  t.plan(4);
  return t.context.modifyPkg({scripts: {
    touch: 'touch ./file.test',
    touch2: 'touch ./file2.test',
    touch3: 'touch ./file3.test',
    touch4: 'touch ./file4.test'
  }}).then(() => {
    return promiseSpawn('npms', ['touch', 'touch2', '-p', 'touch3', 'touch4'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file3.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file4.test')), 'file was created');
    });
  });
});

test('serial and parallel: *', (t) => {
  t.plan(8);
  return t.context.modifyPkg({scripts: {
    'serial:one': 'touch ./file.test',
    'serial:two': 'touch ./file2.test',
    'parallel:one': 'touch ./file3.test',
    'parallel:two': 'touch ./file4.test',
    // there should not be run
    'parallel:one:one': 'touch ./file5.test',
    'parallel': 'touch ./file6.test',
    'serial:one:one': 'touch ./file7.test',
    'serial': 'touch ./file8.test'
  }}).then(() => {
    return promiseSpawn('npms', ['-s', 'serial:*', '-p', 'parallel:*'], {cwd: t.context.dir}).then(() => {
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
  return t.context.modifyPkg({scripts: {
    'serial': 'npms serial:*',
    'serial:one': 'touch ./file.test',
    'serial:two': 'touch ./file2.test'
  }}).then(() => {
    return promiseSpawn('npms', ['serial'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
    });
  });
});

test('parallel: nested', (t) => {
  t.plan(2);
  return t.context.modifyPkg({scripts: {
    'parallel': 'npms -p parallel:*',
    'parallel:one': 'touch ./file.test',
    'parallel:two': 'touch ./file2.test'
  }}).then(() => {
    return promiseSpawn('npms', ['parallel'], {cwd: t.context.dir}).then(() => {
      t.true(exists(path.join(t.context.dir, 'file.test')), 'file was created');
      t.true(exists(path.join(t.context.dir, 'file2.test')), 'file was created');
    });
  });
});

test('verify serial default', (t) => {
  t.plan(1);
  return t.context.modifyPkg({scripts: {
    'test:one': 'echo 1',
    'test:two': 'echo 2',
    'test:three': 'echo 3',
    'test:four': 'echo 4',
    'test:five': 'echo 5',
    'test:six': 'echo 6',
    'test:seven': 'echo 7',
    'test:eight': 'echo 8'
  }}).then(() => {
    return promiseSpawn('npms', ['--commands-only', 'test:*'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['1', '2', '3', '4', '5', '6', '7', '8'], 'serial order');
    });
  });
});

test('verify serial default', (t) => {
  t.plan(1);
  return t.context.modifyPkg({scripts: {
    'test:one': 'echo 1',
    'test:two': 'sleep 1 && echo 2',
    'test:three': 'echo 3'
  }}).then(() => {
    return promiseSpawn('npms', ['--commands-only', '-s', 'test:*'], {cwd: t.context.dir}).then((result) => {
      const stdouts = result.stdout.trim().split('\n');

      t.deepEqual(stdouts, ['1', '2', '3'], 'serial order');
    });
  });
});

test('verify parallel order', (t) => {
  t.plan(4);
  return t.context.modifyPkg({scripts: {
    'test:one': 'echo 1',
    'test:two': 'sleep 1 && echo 2',
    'test:three': 'echo 3'
  }}).then(() => {
    return promiseSpawn('npms', ['--commands-only', '-p', 'test:*'], {cwd: t.context.dir}).then((result) => {
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

  return t.context.modifyPkg({scripts: {
    'test:one': 'sleep 1 && echo 1',
    'test:two': 'echo 2',
    'test:three': 'echo 3',
    'test:four': 'echo 4',
    'test:five': 'sleep 1 && echo 5',
    'test:six': 'echo 6',
    'test:seven': 'echo 7',
    'test:eight': 'echo 8'
  }}).then(() => {
    return promiseSpawn('npms', ['--commands-only',
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

  return t.context.modifyPkg({scripts: {
    one: 'exit 1'
  }}).then(() => {
    return promiseSpawn('npms', ['one'], {cwd: t.context.dir}).then((result) => {
      t.not(result.exitCode, 0, 'fails');
    });
  });
});

test('serial: second exit failure', (t) => {
  t.plan(1);

  return t.context.modifyPkg({scripts: {
    one: 'echo test',
    two: 'exit 1'
  }}).then(() => {
    return promiseSpawn('npms', ['one', 'two'], {cwd: t.context.dir}).then((result) => {
      t.not(result.exitCode, 0, 'fails');
    });
  });
});

test('parallel: first exit failure', (t) => {
  t.plan(1);

  return t.context.modifyPkg({scripts: {
    one: 'exit 1'
  }}).then(() => {
    return promiseSpawn('npms', ['-p', 'one'], {cwd: t.context.dir}).then((result) => {
      t.not(result.exitCode, 0, 'fails');
    });
  });
});

test('parallel: second exit failure', (t) => {
  t.plan(1);

  return t.context.modifyPkg({scripts: {
    one: 'echo test',
    two: 'exit 1'
  }}).then(() => {
    return promiseSpawn('npms', ['-p', 'one', 'two'], {cwd: t.context.dir}).then((result) => {
      t.not(result.exitCode, 0, 'fails');
    });
  });
});
