var tfIdf = require("tf-idf-wiki-lists").tfIdf;

var normalizeTfIdfResults = function(tfIdfResults) {
	return _.map(tfIdfResults, function(result) {
		return {
			type: result.type,
			score: result.tfIdf
		};
	});
};
