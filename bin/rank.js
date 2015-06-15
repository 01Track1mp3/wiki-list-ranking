var rank = require("../rank");

var resources = require("tf-idf-wiki-lists").resources.nba;
var parentResource = 'http://dbpedia.org/resource/Lists_of_National_Basketball_Association_players';

rank(resources, parentResource)
  .then(function(results) {
    var tfIdfResults = results.tfIdf;
    var textEvidenceList = results.textEvidenceList;
    var parentTextEvidenceList = results.parentTextEvidenceList;
    var crossedResults = results.crossedResults;

    console.log('TfIdfResults: ');
    console.log(tfIdfResults.map(function(resource) {
      return {type: resource.type, score: resource.score};
    }));
    console.log('\nTextEvidenceResults: ');
    console.log(textEvidenceList);
    console.log('\nParentEvidenceResults: ');
    console.log(parentTextEvidenceList);
    console.log('\nRanked results: ');
    console.log(crossedResults);
  });
