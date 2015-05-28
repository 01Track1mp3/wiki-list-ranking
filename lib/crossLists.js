/*
 *  Cross two lists based on their ranking
 */

var _ = require('lodash');

var TFIDFWEIGHT = 0.5;
var TEXTEVIDENCEWEIGHT = 1.0 - TFIDFWEIGHT;

module.exports = function(tfIdfList, textEvidenceList) {
  var crossedList = [];

  tfIdfList = _.sortBy(tfIdfList, 'score').reverse();
  textEvidenceList = _.sortBy(textEvidenceList, 'score').reverse();

  _.each(tfIdfList, function(entry, indexTfIdf) {
    indexTfIdf += 1;
    var indexTextEvidence = _.findIndex(textEvidenceList, 'type', entry.type) + 1;

    var score = (indexTfIdf * TFIDFWEIGHT) + (indexTextEvidence * TEXTEVIDENCEWEIGHT);
    var typeObj = { type: entry.type, score: score };

    crossedList.push(typeObj);
  });

  return _.pluck(_.sortBy(crossedList, 'score'), 'type');
};
