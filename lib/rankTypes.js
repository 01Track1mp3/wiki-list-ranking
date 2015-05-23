/*
 *  Rank a term based on how oftern it appears in a title and abstract
 *  Title and abstract have to be normalized and tokenized
 */

var _ = require('lodash');

var TITLEWEIGHT = 3;
var ABSTRACTWEIGHT = 1;

function countMatches(term, termList) {
  var count = 0;
  _.each(termList, function(val) {
    if (val === term) {
      count++;
    }
  });
  return count;
}

exports.rankType = function(type, title, abstract) {
  var rankObj = {type: type, rank: 0};

  rankObj.rank += countMatches(type, title) * TITLEWEIGHT;
  rankObj.rank += countMatches(type, abstract) * ABSTRACTWEIGHT;

  return rankObj;
}
