var postcss = require("postcss");
var Promise = require("bluebird");
var trim = require("phpfn")("trim");
var hh = require("http-https");
var isUrl = require("is-url");

var space = postcss.list.space;

module.exports = postcss.plugin("postcss-import-url", postcssImportUrl);

function postcssImportUrl(options) {
	options = options || {};
	return function(css) {
		var imports = [];
		css.walkAtRules("import", function checkAtRule(atRule) {
			var params = space(atRule.params);
			var remoteFile = cleanupRemoteFile(params[0]);
			var mediaQueries = params.slice(1).join(" ");
			if (mediaQueries) {
				var mediaNode = postcss.atRule({ name: "media", params: mediaQueries });				
			}
			if (!isUrl(remoteFile)) return;
			var promise = createPromise(remoteFile).then(function(body) {
				var otherNodes = body;
				if (mediaNode) {
					mediaNode.append(body);
					otherNodes = mediaNode;
				}
				// console.log(otherNodes.toString());
				atRule.replaceWith(otherNodes);
			});
			imports.push(promise);
		});
		return Promise.all(imports);
	};
}

function cleanupRemoteFile(value) {
	if (value.substr(0, 3) === "url") {
		value = value.substr(3);
	}
	value = trim(value, "'\"()");
	return value;
}

function createPromise(remoteFile) {
	function executor(resolve, reject) {
		var request = hh.get(remoteFile, function(response) {
			var body = "";
			response.on("data", function(chunk) {
				body += chunk.toString();
			});
			response.on("end", function() {
				resolve(body);
			});
		});
		request.on("error", reject);
		request.end();
	}
	return new Promise(executor);
}