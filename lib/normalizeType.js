/*
 *  Normalizes a type:
 *  'dbpedia-owl:BasketballPlayer'
 *     -> ['Basketball', 'Player']
 */

var natural = require("natural");
natural.PorterStemmer.attach();

function normalize(type) {
    // Cut specifier and split up camel case
    type = type.replace('dbpedia-owl:', '');
    type = type.replace(/([a-z](?=[A-Z]))/g, '$1 ');
    type = type.toLowerCase();
    return type.tokenizeAndStem();
}

function isValidType(type) {
  return type.match(/^dbpedia-owl:[A-Za-z]+/i);
}

module.exports = function(type) {
  var result = { type: type, valid: false };
  if (isValidType(type)) {
    result.valid = true;
    result.normalized = normalize(type);
  }
  return result;
};
