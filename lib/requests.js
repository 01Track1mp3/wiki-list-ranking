var sparqler = require("sparqler");
var _ = require("lodash");
var Promise = require("bluebird");
var natural = require("natural");

var dbpediaSparqler = new sparqler.Sparqler("http://dbpedia.org/sparql");
var graph = "<http://dbpedia.org>";

// enable tokenizing and stemming on strings
natural.PorterStemmer.attach();

var timeoutWrapper = function(callback, index) {
  if (typeof callback != "function") {
    throw new Error("callback has to be a function");
  }

  if (typeof index != "number") {
    throw new Error("index has to be a number");
  }

  return setTimeout(callback, index * 50);
};

var flattenResponseForKey = function(response, key) {
  return _(dbpediaSparqler.sparqlFlatten(response))
    .mapValues(key)
    .map(function(value) { return value; })
    .value();
};

var flattenTitle = function(response) {
  var titles = flattenResponseForKey(response, "title");
  if (titles && titles.length > 0) {
    return titles[0];
  }

  return "";
};

var flattenAbstract = function(response) {
  var abstracts = flattenResponseForKey(response, "abstract");
  if (abstracts && abstracts.length > 0) {
    return abstracts[0];
  }

  return "";
};

var getAbstractOf = function(uri, callback) {
	var query = "select ?abstract from $graph where { <$uri> dbpedia-owl:abstract ?abstract. FILTER (langMatches(lang(?abstract),'en')) }";
	var sQuery = dbpediaSparqler.createQuery(query);

	sQuery
    .setParameter("graph", graph)
		.setParameter("uri", encodeURI(uri))
    .execute(callback);
};

var getTitleOf = function(uri, callback) {
  var query = "select ?title from $graph where { <$uri> rdfs:label ?title. FILTER (langMatches(lang(?title),'en')) }";
  var sQuery = dbpediaSparqler.createQuery(query);

  sQuery
    .setParameter("graph", graph)
    .setParameter("uri", encodeURI(uri))
    .execute(callback);
};

var getAbstractsOf = function(uris) {
  return _.map(uris, function(uri, index) { return new Promise(
    function(resolve) {
      timeoutWrapper(function() { 
        getAbstractOf(uri, function(response) { 
          resolve({
            resource: uri,
            abstract: flattenAbstract(response)
          }); 
        }); 
      }, index);
    });
  });
};

var getTitlesOf = function(uris) {
  return _.map(uris, function(uri, index) { return new Promise(
    function(resolve) {
      timeoutWrapper(function() { 
        getTitleOf(uri, function(response) { 
          resolve({
            resource: uri,
            title: flattenTitle(response)
          }); 
        }); 
      }, index);
    });
  });
};

var getStemmedResultsOf = function(promises, key) {
  return Promise
    .all(promises)
    .map(function(result) { result[key] = result[key].toLowerCase(); return result; })
    .map(function(result) { result[key] = result[key].tokenizeAndStem(); return result; });
};

var getStemmedAbstractsOf = function(uris) {
  return getStemmedResultsOf( getAbstractsOf(uris), "abstract" );
};

var getStemmedTitlesOf = function(uris) {
  return getStemmedResultsOf( getTitlesOf(uris), "title" );
};

module.exports = {
  abstracts: getStemmedAbstractsOf,
  titles: getStemmedTitlesOf
};

/* 

module.exports([
  "http://dbpedia.org/resource/Lists_of_writers", 
  "http://dbpedia.org/resource/List_of_National_Basketball_Association_players_(C)",
  "http://dbpedia.org/resource/Jason_Caffey"]).then(function(text) { console.log(text); });

*/
