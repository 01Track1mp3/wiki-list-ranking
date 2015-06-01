// external packages
var _ = require("lodash");
var natural = require("natural");
var tfIdf = require("tf-idf-wiki-lists").tfIdf;

// internal packages
var rank = require("./lib/rankTypes");
var crossLists = require("./lib/crossLists");
var Requests = require("./lib/requests");

// global variables
var resources = require("tf-idf-wiki-lists").resources.donalds;
var tfIdfCounts = null; // use this to access counts of the original resource list
var tfIdfResults = null;
var abstractResults = null;

// setup code
natural.PorterStemmer.attach();


/** HELPERS **/

var createMapFromShapeWithIteratees = function(shape, keyIteratee, valueIteratee) {
  return _.reduce(
    shape,
    function(concatenated, result) {
      concatenated[ keyIteratee(result) ] = valueIteratee(result);
      return concatenated;
    }, {});
};

var createMapFromShape = function(shape, keyName, valueName) {
  return createMapFromShapeWithIteratees(
    shape, 
    function(object) { return object[keyName]; }, 
    function(object) { return object[valueName]; }
  );
};

var groupResultsByMapAndFilter = function(results, groupingMap, key, mapKey) {
  return _.reduce(
    results,
    function(concatenated, result) {
      concatenated[ result[key] ] = _(groupingMap)
        .filter(function(value, keyToFilter) { return _.contains(result[mapKey], keyToFilter); })
        .values()
        .value();
      return concatenated;
    }, {});
};

//== TF-IDF Fetching

var promisedTfIdf = function(resources) {
  return new Promise(function(resolve) {
    tfIdf(resources, function(results, counts) { 
      resolve(results);
      tfIdfCounts = counts;
    });
  });
};

var renameResults = function(tfIdfResults) {
  return _.map(tfIdfResults, function(result) {
    return {
      type: result.label,
      entities: result.entities,
      score: result.tfIdf
    };
  });
};

var tokenizeAndStemTypes = function(tfIdfResults) {
  return _.map(tfIdfResults, function(result) {
    return _.extend(result, { stemmed: result.type.tokenizeAndStem() });
  });
};

var storeTfIdf = function(results) {
  tfIdfResults = results;
};

var fetchAndStoreTfIdf = function() {
  return promisedTfIdf(resources)
    .then(renameResults)
    .then(tokenizeAndStemTypes)
    .then(storeTfIdf);
};

//== Abstract Fetching

var storeAbstracts = function(results) {
  var entitiesToAbstracts = createMapFromShape(results, "resource", "abstract");

  abstractResults = groupResultsByMapAndFilter(
    tfIdfResults,
    entitiesToAbstracts,
    "type",
    "entities"
  );
};

var fetchAndStoreAbstracts = function() {
  return Requests.abstracts(resources)
    .then(storeAbstracts);
};

//== Title Fetching

var storeTitles = function(results) {
  var entitiesToTitles = createMapFromShape(results, "resource", "title");

  titleResults = groupResultsByMapAndFilter(
    tfIdfResults,
    entitiesToTitles,
    "type",
    "entities"
  );
};

var fetchAndStoreTitles = function() {
  return Requests.titles(resources)
    .then(storeTitles);
};

//== List Crossing

var rankTextEvidence = function() {
  return tfIdfResults.map(function(result) {
    var score = _.reduce(result.stemmed, function(score, stemmedTerm) {
      return score + rank(stemmedTerm, titleResults[result.type], abstractResults[result.type]).score;
    }, 0);
    return { type: result.type, score: score };
  });
};

var computeRanking = function() {
  var textEvidenceList = rankTextEvidence();
  var crossedResults = crossLists(tfIdfResults, textEvidenceList);

  console.log('Ranked results: ');
  console.log(crossedResults);
};

/** START THE RANKING **/

fetchAndStoreTfIdf()
  .then(fetchAndStoreAbstracts)
  .then(fetchAndStoreTitles)
  .then(computeRanking);
