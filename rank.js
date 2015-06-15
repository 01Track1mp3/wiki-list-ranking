// external packages
var _ = require("lodash");
var natural = require("natural");
var tfIdf = require("tf-idf-wiki-lists").tfIdf;

// internal packages
var rank = require("./lib/rankTypes");
var crossLists = require("./lib/crossLists");
var Requests = require("./lib/requests");

// global variables
var resources = null;
var parentResource = null;

// var resources = require("tf-idf-wiki-lists").resources.nba;
// var parentResource = ['http://dbpedia.org/resource/Lists_of_National_Basketball_Association_players'];
//var parentResource = ['http://dbpedia.org/resource/List_of_Donalds'];
var tfIdfCounts = null; // use this to access counts of the original resource list
var tfIdfResults = null;
var abstractResults = null;
var parent = {abstract: null, title: null};

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
      typeUri: result.typeUri,
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
  /* var entitiesToAbstracts = createMapFromShape(results, "resource", "abstract");

  abstractResults = groupResultsByMapAndFilter(
    tfIdfResults,
    entitiesToAbstracts,
    "type",
    "entities"
  ); */
  abstractResults = results;
};

var fetchAndStoreAbstracts = function() {
  return Requests.abstracts(resources)
    .then(storeAbstracts);
};

var fetchAndStoreParentAbstract = function() {
  return Requests.abstracts(parentResource)
    .then(function(response) {
      parent.abstract = response[0].abstract;
    });
};

//== Title Fetching

var storeTitles = function(results) {
  /* var entitiesToTitles = createMapFromShape(results, "resource", "title");

  titleResults = groupResultsByMapAndFilter(
    tfIdfResults,
    entitiesToTitles,
    "type",
    "entities"
  ); */

  titleResults = results;
};

var fetchAndStoreTitles = function() {
  return Requests.titles(resources)
    .then(storeTitles);
};

var fetchAndStoreParentTitle = function() {
  return Requests.titles(parentResource)
    .then(function(response) {
      parent.title = response[0].title;
    });
};

//== List Crossing

var rankTextEvidence = function() {
  return tfIdfResults.map(function(result) {
    var scores = result.stemmed.map(function(stemmedTerm) {
      return rank(stemmedTerm, titleResults[result.type], abstractResults[result.type]).score;
    });
    return { type: result.type, typeUri: result.typeUri, score: _.min(scores) };
  });
};

var rankTextEvidenceParent = function() {
  return tfIdfResults.map(function(result) {
    var scores = result.stemmed.map(function(stemmedTerm) {
      return rank(stemmedTerm, [parent.title], [parent.abstract]).score;
    });
    return { type: result.type, typeUri: result.typeUri, score: _.min(scores) };
  });
};

var computeRanking = function() {
  var parentTextEvidenceList = rankTextEvidenceParent();
  var textEvidenceList = rankTextEvidence();
  var crossedResults = crossLists(tfIdfResults, textEvidenceList, parentTextEvidenceList);

  return {
    resources: resources,
    parentResource: parentResource[0],
    textEvidenceList: textEvidenceList,
    parentTextEvidenceList: parentTextEvidenceList,
    crossedResults: crossedResults,
    titleResults: titleResults,
    tfIdfResults: tfIdfResults,
    abstractResults: abstractResults,
    parentResults: parent
  };
};

/** START THE RANKING **/

module.exports = function(_resources, _parentResource) {
  resources = _resources;
  parentResource = [ _parentResource ];

  if (!_.isArray(resources)) throw "resources must be an array";
  if (!_.isString(parentResource[0])) throw "parentResource must be a string";

  return fetchAndStoreTfIdf(resources)
    .then(fetchAndStoreParentAbstract)
    .then(fetchAndStoreParentTitle)
    .then(fetchAndStoreAbstracts)
    .then(fetchAndStoreTitles)
    .then(computeRanking);
};
