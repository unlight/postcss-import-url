var postcss = require('postcss');
var hh = require('http-https');
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
var url = require('url');
var urlRegexp = /url\(["']?.+?['"]?\)/g;

function postcssImportUrl(options) {
    options = assign({}, defaults, options || {});
    return function importUrl(tree, dummy, parentRemoteFile) {
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
    };
}

module.exports = postcss.plugin('postcss-import-url', postcssImportUrl);

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
    var reqOptions = url.parse(remoteFile);
    reqOptions.headers = {};
    reqOptions.headers['connection'] = 'keep-alive';
    if (options.modernBrowser) {
        reqOptions.headers['user-agent'] =
            'Mozilla/5.0 AppleWebKit/538.0 Chrome/65.0.0.0 Safari/538';
    }
    if (options.userAgent) {
        reqOptions.headers['user-agent'] = String(options.userAgent);
    }
    function executor(resolve, reject) {
        var request = hh.get(reqOptions, function (response) {
            var body = '';
            response.on('data', function (chunk) {
                body += chunk.toString();
            });
            response.on('end', function () {
                resolve({
                    body: body,
                    parent: remoteFile,
                });
            });
        });
        request.on('error', reject);
        request.end();
    }
    return new Promise(executor);
}
