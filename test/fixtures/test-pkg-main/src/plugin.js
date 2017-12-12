import ReturnMe from 'test-pkg-two';

export default class TestingThing {
  constructor() {
    this.bar = 'bar';
  }
  foo() {
    return ReturnMe(this.bar);
  }
}

const t = new TestingThing();
console.log(t.foo());

// intentional double empty line to cause error


// long comment to cause a warning in eslint
// aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
