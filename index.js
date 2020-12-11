var postcss = require('postcss');
var request = require('request');
var isUrl = require('is-url');
var trim = require('lodash.trim');
var resolveRelative = require('resolve-relative-url');
var assign = require('lodash.assign');
var defaults = {
    recursive: true,
    resolveUrls: false,
    modernBrowser: false,
    userAgent: null,
};
var space = postcss.list.space;
var urlRegexp = /url\(["']?.+?['"]?\)/g;

function postcssImportUrl(options) {
    options = assign({}, defaults, options || {});

    function importUrl(tree, dummy, parentRemoteFile) {
        parentRemoteFile = parentRemoteFile || tree.source.input.file;
        var imports = [];
        tree.walkAtRules('import', function checkAtRule(atRule) {
            var params = space(atRule.params);
            var remoteFile = cleanupRemoteFile(params[0]);
            if (parentRemoteFile) {
                remoteFile = resolveRelative(remoteFile, parentRemoteFile);
            }
            if (!isUrl(remoteFile)) return;
            imports[imports.length] = createPromise(remoteFile, options).then(function (r) {
                var newNode = postcss.parse(r.body);
                var mediaQueries = params.slice(1).join(' ');
                if (mediaQueries) {
                    var mediaNode = postcss.atRule({
                        name: 'media',
                        params: mediaQueries,
                    });
                    mediaNode.append(newNode);
                    newNode = mediaNode;
                }

                if (options.resolveUrls) {
                    // Convert relative paths to absolute paths
                    newNode = newNode.replaceValues(urlRegexp, { fast: 'url(' }, function (url) {
                        return resolveUrls(url, remoteFile);
                    });
                }

                var p = options.recursive
                    ? importUrl(newNode, null, r.parent)
                    : Promise.resolve(newNode);
                return p.then(function (tree) {
                    atRule.replaceWith(tree);
                });
            });
        });
        return Promise.all(imports).then(function () {
            return tree;
        });
    }

    return {
        postcssPlugin: 'postcss-import-url',
        Once: importUrl,
    };
}

module.exports = postcssImportUrl;
module.exports.postcss = true;

function cleanupRemoteFile(value) {
    if (value.substr(0, 3) === 'url') {
        value = value.substr(3);
    }
    value = trim(value, '\'"()');
    return value;
}

function resolveUrls(to, from) {
    return 'url("' + resolveRelative(cleanupRemoteFile(to), from) + '")';
}

function createPromise(remoteFile, options) {
    var reqOptions = {
        url: remoteFile,
        headers: {
            connection: 'keep-alive',
        },
    };
    if (options.modernBrowser) {
        reqOptions.headers['user-agent'] =
            'Mozilla/5.0 AppleWebKit/538.0 Chrome/80.0.0.0 Safari/538';
    }
    if (options.userAgent) {
        reqOptions.headers['user-agent'] = String(options.userAgent);
    }
    function executor(resolve, reject) {
        request(remoteFile, reqOptions, function (error, response) {
            if (error) {
                return reject(error);
            }
            resolve({
                body: response.body,
                parent: remoteFile,
            });
        });
    }
    return new Promise(executor);
}
