/*
 *  Cross two lists based on their ranking
 */

var _ = require('lodash');

var TFIDFWEIGHT = 0.5;
var TEXTEVIDENCEWEIGHT = 1.0 - TFIDFWEIGHT;

function crossScore(tfIdfScore, textEvidenceScore) {
  return tfIdfScore * TFIDFWEIGHT + textEvidenceScore * TEXTEVIDENCEWEIGHT;
}

/* Normalize the score to a value between 0 and 1 */
function normalizeList(textEvidenceList) {
  var max = _.max(textEvidenceList, function(type) { return type.score; }).score;

  return textEvidenceList.map(function(type) {
    type.score = type.score / max;
    return type;
  });
}

module.exports = function(tfIdfList, textEvidenceList) {
  textEvidenceList = normalizeList(textEvidenceList);

  return textEvidenceList.map(function(textEvidenceEntry) {
    var tfIdfEntry = _.find(tfIdfList, 'type', textEvidenceEntry.type);
    textEvidenceEntry.score = crossScore(tfIdfEntry.score, textEvidenceEntry.score);
    return textEvidenceEntry;
  });
};
