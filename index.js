var _ = require("lodash");
var tfIdf = require("tf-idf-wiki-lists").tfIdf;
var normalize = require("./lib/normalizeType");
var abstracts = require("./lib/abstracts");

var normalizeTfIdfResults = function(tfIdfResults) {
	return _.map(tfIdfResults, function(result) {
		return {
			type: result.type,
			score: result.tfIdf
		};
	});
};

// fetch idfs
var resources = require("tf-idf-wiki-lists").resources.donalds;
// var resources = _resources.splice(0, 2);

var idfPromise = new Promise(function(resolve) {
  tfIdf(resources, function(results) {
    resolve(normalizeTfIdfResults(results));
  });
})
.then(function(results) { 
  return _(results)
    .map(function(result) { 
      var norm = normalize(result.type);
      if (norm.valid) {
        result.normalized = norm.normalized;
        return result;
      }
      return null;
    })
    .filter(function(result) {
      return result !== null;
    })
    .value();
});

idfPromise.then(function(results) {  
  abstracts(resources).then(function(abstracts) {
    console.log(results, abstracts);
  });
});
