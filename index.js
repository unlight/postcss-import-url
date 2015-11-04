"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var _postcss = require("postcss");

var _postcss2 = _interopRequireDefault(_postcss);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _phpfn = require("phpfn");

var _phpfn2 = _interopRequireDefault(_phpfn);

var _httpHttps = require("http-https");

var _httpHttps2 = _interopRequireDefault(_httpHttps);

var _isUrl = require("is-url");

var _isUrl2 = _interopRequireDefault(_isUrl);

var trim = (0, _phpfn2["default"])("trim");
var space = _postcss2["default"].list.space;

exports["default"] = _postcss2["default"].plugin("postcss-import-url", postcssImportUrl);

function postcssImportUrl() {
	var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	return function (css) {
		var imports = [];
		css.walkAtRules("import", function checkAtRule(atRule) {
			var _space = space(atRule.params);

			var _space2 = _toArray(_space);

			var remoteFile = _space2[0];

			var otherParams = _space2.slice(1);

			remoteFile = cleanupRemoteFile(remoteFile);
			if (!(0, _isUrl2["default"])(remoteFile)) return;
			var mediaQueries = otherParams.join(" ");
			var promise = createPromise(remoteFile).then(function (otherNode) {
				if (mediaQueries) {
					var mediaNode = _postcss2["default"].atRule({ name: "media", params: mediaQueries });
					mediaNode.append(otherNode);
					otherNode = mediaNode;
				}
				// console.log(otherNode.toString());
				atRule.replaceWith(otherNode);
			});
			imports.push(promise);
		});
		return _bluebird2["default"].all(imports);
	};
}

function createPromise(remoteFile) {
	function executor(resolve, reject) {
		var request = _httpHttps2["default"].get(remoteFile, function (response) {
			var body = "";
			response.on("data", function (chunk) {
				return body += chunk.toString();
			});
			response.on("end", function () {
				return resolve(body);
			});
		});
		request.on("error", reject);
		request.end();
	}
	return new _bluebird2["default"](executor);
}

function cleanupRemoteFile(value) {
	if (value.substr(0, 3) === "url") {
		value = value.substr(3);
	}
	value = trim(value, "'\"()");
	return value;
}
module.exports = exports["default"];
//# sourceMappingURL=index.js.map