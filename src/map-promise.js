'use strict';

const mapPromise = (array, fn) => {
  const promises = [];

  array.forEach((v) => {
    promises.push(fn(v));
  });

  return Promise.all(promises);
};

module.exports = mapPromise;
