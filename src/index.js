import postcss from "postcss";
import Promise from "bluebird";
import phpfn from "phpfn";
import hh from "http-https";
import isUrl from "is-url";

const trim = phpfn("trim");
const space = postcss.list.space;

export default postcss.plugin("postcss-import-url", postcssImportUrl);

function postcssImportUrl(options = {}) {
	return function(css) {
		const imports = [];
		css.walkAtRules("import", function checkAtRule(atRule) {
			var [remoteFile, ...otherParams] = space(atRule.params);
			remoteFile = cleanupRemoteFile(remoteFile);
			if (!isUrl(remoteFile)) return;
			var mediaQueries = otherParams.join(" ");
			var promise = createPromise(remoteFile).then(function(otherNode) {
				if (mediaQueries) {
					var mediaNode = postcss.atRule({ name: "media", params: mediaQueries });
					mediaNode.append(otherNode);
					otherNode = mediaNode;
				}
				// console.log(otherNode.toString());
				atRule.replaceWith(otherNode);
			});
			imports.push(promise);
		});
		return Promise.all(imports);
	};
}

function createPromise(remoteFile) {
	function executor(resolve, reject) {
		var request = hh.get(remoteFile, function(response) {
			var body = "";
			response.on("data", chunk => body += chunk.toString());
			response.on("end", () => resolve(body));
		});
		request.on("error", reject);
		request.end();
	}
	return new Promise(executor);
}

function cleanupRemoteFile(value) {
	if (value.substr(0, 3) === "url") {
		value = value.substr(3);
	}
	value = trim(value, `'"()`);
	return value;
}