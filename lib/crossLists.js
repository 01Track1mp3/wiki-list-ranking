var _ = require('lodash');

var TFIDFWEIGHT = 0.5;
var TEXTEVIDENCEWEIGHT = 1 - TFIDFWEIGHT;

exports.crossLists = function(tfIdfList, textEvidenceList) {
  var crossedList = [];

  tfIdfList = _.sortBy(tfIdfList, 'score').reverse();
  textEvidenceList = _.sortBy(textEvidenceList, 'score').reverse();

  _.each(tfIdfList, function(entry, indexTfIdf) {
    var typeObj = {type: entry.type}

    var indexTestEvidence = _.findIndex(textEvidenceList, 'type', entry.type);

    typeObj.score = (indexTfIdf * TFIDFWEIGHT) + (indexTestEvidence * TEXTEVIDENCEWEIGHT);
  });

    return _.sortBy(crossedList, 'score');
}
