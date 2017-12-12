import TestingThing from '../src/plugin';
import QUnit from 'qunitjs';
import sinon from 'sinon';


// some super long line, some super long line, some super long line, some super long line, some super long line

QUnit.module('test', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
  },
  afterEach() {
    this.clock.restore();
  }
});

QUnit.test('foo fn returns bar', function(assert) {
  const test = new TestingThing();
  const nope = 'not used';

  assert.strictEqual(test.foo(), 'bar', 'bar returns this.bar');
});

