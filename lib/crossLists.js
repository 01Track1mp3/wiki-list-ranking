/*
 *  Cross two lists based on their ranking
 */

var _ = require('lodash');

var TFIDFWEIGHT = 0.3;
var TEXTEVIDENCEWEIGHT = 0.3;
var PARENTWEIGHT = 0.3;

function crossScore(tfIdfScore, textEvidenceScore, parentScore) {
  return tfIdfScore * TFIDFWEIGHT +
    textEvidenceScore * TEXTEVIDENCEWEIGHT +
    parentScore * PARENTWEIGHT;
}

/* Normalize the score to a value between 0 and 1 */
function normalizeList(textEvidenceList) {
  var max = _.max(textEvidenceList, function(type) { return type.score; }).score;

  if (max === 0)
    return textEvidenceList;
  return textEvidenceList.map(function(type) {
    type.score = type.score / max;
    return type;
  });
}

module.exports = function(tfIdfList, textEvidenceList, parentTextEvidenceList) {
  tfIdfList = normalizeList(tfIdfList);
  textEvidenceList = normalizeList(textEvidenceList);
  parentTextEvidenceList = normalizeList(parentTextEvidenceList);

  return textEvidenceList.map(function(textEvidenceEntry) {
    var parentEntry = _.find(parentTextEvidenceList, 'type', textEvidenceEntry.type);
    var tfIdfEntry = _.find(tfIdfList, 'type', textEvidenceEntry.type);
    var score = crossScore(tfIdfEntry.score, textEvidenceEntry.score, parentEntry.score);
    return { type: textEvidenceEntry.type, score: score };
  });
};
