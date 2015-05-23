/*
 *  Normalizes a type:
 *  'dbpedia-owl:BasketballPlayer'
 *     -> ['Basketball', 'Player']
 */

function normalize(type) {
    // Cut specifier and split up camel case
    type = type.replace('dbpedia-owl:', '');
    type = type.replace(/([a-z](?=[A-Z]))/g, '$1 ');
    return type.split(' ');
}

function isValidType(type) {
  return type.match(/^dbpedia-owl:[A-Za-z]+/i);
}

exports.normalizeType = function(type) {
  var result = { type: type, valid: false };
  if (isValidType(type)) {
    result.valid = true,
    result.normalized = normalize(type);
  }
  return result;
}
