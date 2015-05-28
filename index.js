// external packages
var _ = require("lodash");
var natural = require("natural");
var tfIdf = require("tf-idf-wiki-lists").tfIdf;

// internal packages
var rank = require("./lib/rankTypes");
var crossLists = require("./lib/crossLists");
var abstracts = require("./lib/abstracts");
// @fawind: dummy function, build some fetch module for this
var titles = function() { return new Promise(function(resolve) { resolve(""); }); };

// global variables
var resources = require("tf-idf-wiki-lists").resources.donalds;
var tfIdfCounts = null; // use this to access counts of the original resource list
var tfIdfResults = null;
var abstractResults = null;

// setup code
natural.PorterStemmer.attach();


/** HELPERS **/

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
  abstractResults = results;
};

var fetchAndStoreAbstracts = function() {
  return abstracts(resources)
    .then(storeAbstracts);
};

//== Title Fetching

var storeTitles = function(results) {
  titleResults = results;
};

var fetchAndStoreTitles = function() {
  return titles(resources)
    .then(storeTitles);
};

//== List Crossing

var rankTextEvidence = function() {
  return tfIdfResults.map(function(result) {
    var score = _.reduce(result.stemmed, function(score, stemmedTerm) {
      return score + rank(stemmedTerm, titleResults , abstractResults).score;
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
