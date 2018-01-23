'use strict';

const mapSeriesPromise = (array, fn) => {
  const nextValue = array.shift();
  const promise = fn(nextValue);

  // if we still have array values left
  // do the next one after this one
  if (array.length) {
    return promise.then(() => mapSeriesPromise(array, fn));
  }

  // this is the last promise
  return promise;
};

module.exports = mapSeriesPromise;
