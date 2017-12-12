import test from 'ava';
import path from 'path';
import uuid from 'uuid';
import fs from 'fs';
import shelljs from 'shelljs';
import npmRun from 'npm-run';
import Promise from 'bluebird';
import chokidar from 'chokidar';

const fixtureDir = path.join(__dirname, '..', 'fixtures');
const npmPresetDir = path.join(__dirname, '..', '..');
const testPkgDir = path.join(fixtureDir, 'test-pkg-main');

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
  return promiseSpawn('node', [path.join(npmPresetDir, 'test', 'scripts', 'clean.js')]).then(() => {
    return promiseSpawn('node', [path.join(npmPresetDir, 'test', 'scripts', 'setup.js')]);
  });
});

test.after.always((t) => {
  return promiseSpawn('node', [path.join(npmPresetDir, 'test', 'scripts', 'clean.js')]);
});

test.beforeEach((t) => {
  const tempdir = path.join(shelljs.tempdir(), uuid.v4());

  t.context.dir = tempdir;

  return promiseSpawn('cp', ['-R', testPkgDir + path.sep, tempdir], {});
});

test.afterEach.always((t) => {
  if (t.context.timeout) {
    clearTimeout(t.context.timeout);
  }
  if (t.context.watcher) {
    t.context.watcher.close();
  }

  if (t.context.child) {
    t.context.child.kill();
  }

  if (t.context.dir) {
    return promiseSpawn('rm', ['-rf', t.context.dir], {});
  }
});

test('build:css', (t) => {
  t.plan(1);
  return promiseSpawn('npms', ['build:css'], {cwd: t.context.dir}).then(() => {
    t.true(exists(path.join(t.context.dir, 'dist', 'test-pkg-main.css')), '.css file was built');
  });
});

test('build:js', (t) => {
  t.plan(4);
  return promiseSpawn('npms', ['build:js'], {cwd: t.context.dir}).then(() => {
    t.true(exists(path.join(t.context.dir, 'dist', 'test-pkg-main.js')), '.js file was built');
    t.true(exists(path.join(t.context.dir, 'dist', 'test-pkg-main.min.js')), '.min.js file was built');
    t.true(exists(path.join(t.context.dir, 'dist', 'test-pkg-main.es.js')), '.es.js file was built');
    t.true(exists(path.join(t.context.dir, 'dist', 'test-pkg-main.cjs.js')), '.cjs.js file was built');
  });
});

test('build:test', (t) => {
  t.plan(1);
  return promiseSpawn('npms', ['build:test'], {cwd: t.context.dir}).then(() => {
    t.true(exists(path.join(t.context.dir, 'test', 'dist', 'bundle.js')), 'test bundle was built');
  });
});

test('build:lang', (t) => {
  t.plan(1);
  return promiseSpawn('npms', ['build:lang'], {cwd: t.context.dir}).then(() => {
    t.true(exists(path.join(t.context.dir, 'dist', 'lang')), 'lang folder exists');
  });
});

test('docs', (t) => {
  t.plan(1);
  return promiseSpawn('npms', ['docs'], {cwd: t.context.dir}).then(() => {
    t.true(exists(path.join(t.context.dir, 'docs', 'api', 'index.html')), 'api docs built');
  });
});

test('lint', (t) => {
  t.plan(2);
  return promiseSpawn('npms', ['lint'], {cwd: t.context.dir, ignoreExitCode: true}).then((result) => {
    t.not(result.exitCode, 0, 'did not succeed');
    t.true(result.stdout.length > 0, 'printed to stdout');
  });
});

test('clean', (t) => {
  t.plan(6);

  t.false(exists(path.join(t.context.dir, 'dist')), 'dist folder does not exist');
  t.false(exists(path.join(t.context.dir, 'test', 'dist')), 'test/dist folder does not exist');

  // does not die when there is nothing to clean
  return promiseSpawn('npms', ['clean'], {cwd: t.context.dir}).then(() => {
    t.false(exists(path.join(t.context.dir, 'dist')), 'dist folder does not exist');
    t.false(exists(path.join(t.context.dir, 'test', 'dist')), 'test/dist folder does not exist');

    shelljs.mkdir('-p', path.join(t.context.dir, 'test', 'dist'));
    shelljs.mkdir('-p', path.join(t.context.dir, 'dist'));
    return promiseSpawn('npms', ['clean'], {cwd: t.context.dir});
  }).then(() => {
    // cleans
    t.false(exists(path.join(t.context.dir, 'dist')), 'dist folder does not exist');
    t.false(exists(path.join(t.context.dir, 'test', 'dist')), 'test/dist folder does not exist');
  });
});

test('mkdir', (t) => {
  t.plan(6);

  t.false(exists(path.join(t.context.dir, 'dist')), 'dist folder does not exist');
  t.false(exists(path.join(t.context.dir, 'test', 'dist')), 'test/dist folder does not exist');

  return promiseSpawn('npms', ['mkdir'], {cwd: t.context.dir}).then(() => {
    t.true(exists(path.join(t.context.dir, 'dist')), 'dist folder does not exist');
    t.true(exists(path.join(t.context.dir, 'test', 'dist')), 'test/dist folder does not exist');
    return promiseSpawn('npms', ['mkdir'], {cwd: t.context.dir});
  }).then(() => {
    t.true(exists(path.join(t.context.dir, 'dist')), 'dist folder does not exist');
    t.true(exists(path.join(t.context.dir, 'test', 'dist')), 'test/dist folder does not exist');
  });
});

test.cb('watch:js-modules', (t) => {
  const adds = [];
  const changes = [];

  t.plan(4);

  shelljs.mkdir('-p', path.join(t.context.dir, 'dist'));
  t.context.watcher = chokidar.watch(path.join(t.context.dir, 'dist', '*'))
    .on('add', (e) => {
      t.log(e);
      adds.push(e);

      if (adds.length === 2) {
        t.not(adds.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.es.js')), -1, 'es file created');
        t.not(adds.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.cjs.js')), -1, 'cjs file created');

        fs.appendFileSync(path.join(t.context.dir, 'src', 'plugin.js'), ' ');
      }
    })
    .on('addDir', (e) => t.fail(`a dir ${e} was created unexpectedly`))
    .on('change', (e) => {
      t.log(e);
      changes.push(e);

      if (changes.length === 2) {
        t.not(changes.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.es.js')), -1, 'es file changed');
        t.not(changes.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.cjs.js')), -1, 'cjs file changed');
        t.end();
      }
    })
    .on('unlink', (e) => t.fail(`a file ${e} was deleted unexpectedly`))
    .on('unlinkDir', (e) => t.fail(`a dir ${e} was deleted unexpectedly`));

  t.context.child = npmRun.spawn('npms', ['watch:js-modules'], {cwd: t.context.dir});

  t.context.child.on('close', (exitCode) => {
    t.fail('watcher died');
    t.end();
  });

  t.context.timeout = setTimeout(() => {
    t.fail('timeout');
    t.end();
  }, 5000);
});

test.cb('watch:js-umd', (t) => {
  const adds = [];
  const changes = [];

  t.plan(2);

  shelljs.mkdir('-p', path.join(t.context.dir, 'dist'));
  t.context.watcher = chokidar.watch(path.join(t.context.dir, 'dist', '*'))
    .on('add', (e) => {
      t.log(e);
      adds.push(e);

      if (adds.length === 1) {
        t.not(adds.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.js')), -1, 'js file created');
        fs.appendFileSync(path.join(t.context.dir, 'src', 'plugin.js'), ' ');
      }
    })
    .on('addDir', (e) => t.fail(`a dir ${e} was created unexpectedly`))
    .on('change', (e) => {
      t.log(e);
      changes.push(e);

      if (changes.length === 1) {
        t.not(changes.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.js')), -1, 'js file changed');
        t.end();
      }
    })
    .on('unlink', (e) => t.fail(`a file ${e} was deleted unexpectedly`))
    .on('unlinkDir', (e) => t.fail(`a dir ${e} was deleted unexpectedly`));

  t.context.child = npmRun.spawn('npms', ['watch:js-umd'], {cwd: t.context.dir});

  t.context.child.on('close', (exitCode) => {
    t.fail('watcher died');
    t.end();
  });

  t.context.timeout = setTimeout(() => {
    t.fail('timeout');
    t.end();
  }, 5000);
});

test.cb('watch:test', (t) => {
  const adds = [];
  const changes = [];

  t.plan(2);

  shelljs.mkdir('-p', path.join(t.context.dir, 'test', 'dist'));
  t.context.watcher = chokidar.watch(path.join(t.context.dir, 'test', 'dist', '*'))
    .on('add', (e) => {
      t.log(e);
      adds.push(e);

      if (adds.length === 1) {
        t.not(adds.indexOf(path.join(t.context.dir, 'test', 'dist', 'bundle.js')), -1, 'js file created');
        fs.appendFileSync(path.join(t.context.dir, 'src', 'plugin.js'), ' ');
      }
    })
    .on('addDir', (e) => t.fail(`a dir ${e} was created unexpectedly`))
    .on('change', (e) => {
      t.log(e);
      changes.push(e);

      if (changes.length === 1) {
        t.not(changes.indexOf(path.join(t.context.dir, 'test', 'dist', 'bundle.js')), -1, 'js file changed');
        t.end();
      }
    })
    .on('unlink', (e) => t.fail(`a file ${e} was deleted unexpectedly`))
    .on('unlinkDir', (e) => t.fail(`a dir ${e} was deleted unexpectedly`));

  t.context.child = npmRun.spawn('npms', ['watch:test'], {cwd: t.context.dir});

  t.context.child.on('close', (exitCode) => {
    t.fail('watcher died');
    t.end();
  });

  t.context.timeout = setTimeout(() => {
    t.fail('timeout');
    t.end();
  }, 5000);

});

test.cb('watch:css', (t) => {
  const adds = [];
  const changes = [];

  t.plan(2);

  shelljs.mkdir('-p', path.join(t.context.dir, 'dist'));
  t.context.watcher = chokidar.watch(path.join(t.context.dir, 'dist', '*'))
    .on('add', (e) => {
      t.log(e);
      adds.push(e);

      if (adds.length === 1) {
        t.not(adds.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.css')), -1, 'css file created');
        fs.appendFileSync(path.join(t.context.dir, 'src', 'plugin.scss'), ' ');
      }
    })
    .on('addDir', (e) => t.fail(`a dir ${e} was created unexpectedly`))
    .on('change', (e) => {
      t.log(e);
      changes.push(e);

      if (changes.length === 1) {
        t.not(changes.indexOf(path.join(t.context.dir, 'dist', 'test-pkg-main.css')), -1, 'css file changed');
        t.end();
      }
    })
    .on('unlink', (e) => t.fail(`a file ${e} was deleted unexpectedly`))
    .on('unlinkDir', (e) => t.fail(`a dir ${e} was deleted unexpectedly`));

  t.context.child = npmRun.spawn('npms', ['watch:css'], {cwd: t.context.dir});

  t.context.child.on('close', (exitCode) => {
    t.fail('watcher died');
    t.end();
  });

  t.context.timeout = setTimeout(() => {
    t.fail('timeout');
    t.end();
  }, 5000);

});
