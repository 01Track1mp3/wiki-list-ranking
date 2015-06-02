/*
 *  Rank a term based on how oftern it appears in a title and abstract
 *  Title and abstract have to be normalized and tokenized
 */

var _ = require('lodash');

var TITLEWEIGHT = 3;
var ABSTRACTWEIGHT = 1;

function countMatches(term, termLists) {
  var count = 0;
  _.each(termLists, function(termList) {
    _.each(termList, function(val) {
      if (val === term) {
        count++;
      }
    });
  });
  return count;
}

module.exports = function(type, title, abstract) {
  var rankObj = {type: type, score: 0};

  rankObj.score += countMatches(type, title) * TITLEWEIGHT;
  rankObj.score += countMatches(type, abstract) * ABSTRACTWEIGHT;

  return rankObj;
};
