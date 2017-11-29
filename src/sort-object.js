/**
 * Attempt to sort an object alphabeticlly by keys
 *
 * @param {Object} obj
 *        The object to sort
 *
 * @return {Object}
 *         The now sorted object
 */
var sortObject = function(obj) {
	var newObj = {};
	Object.keys(obj).sort().forEach(function(k) {
		newObj[k] = obj[k];
	});
	return newObj;
};

module.exports = sortObject;
