'use strict';

const mapPromise = function(array, fn) {
  return Promise.all(array.map((v) => fn(v)));
};

module.exports = mapPromise;
