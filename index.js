const postcss = require('postcss');
const axios = require('axios');
const isUrl = require('is-url');
const trim = require('lodash.trim');
const assign = require('lodash.assign');

const defaults = {
    recursive: true,
    resolveUrls: false,
    modernBrowser: false,
    userAgent: null,
};
const space = postcss.list.space;
const urlRegexp = /url\(["']?.+?['"]?\)/g;

function postcssImportUrl(options) {
    options = assign({}, defaults, options || {});

    async function importUrl(tree, _, parentRemoteFile) {
        parentRemoteFile = parentRemoteFile || tree.source.input.file;
        const imports = [];
        tree.walkAtRules('import', function checkAtRule(atRule) {
            const params = space(atRule.params);
            let remoteFile = cleanupRemoteFile(params[0]);
            if (parentRemoteFile) {
                remoteFile = new URL(remoteFile, parentRemoteFile).href;
            }
            if (!isUrl(remoteFile)) {
                return;
            }
            imports[imports.length] = createPromise(remoteFile, options).then(
                async r => {
                    let newNode = postcss.parse(r.body);
                    const mediaQueries = params.slice(1).join(' ');
                    if (mediaQueries) {
                        const mediaNode = postcss.atRule({
                            name: 'media',
                            params: mediaQueries,
                            source: atRule.source,
                        });
                        mediaNode.append(newNode);
                        newNode = mediaNode;
                    } else {
                        newNode.source = atRule.source;
                    }

                    if (options.resolveUrls) {
                        // Convert relative paths to absolute paths
                        newNode = newNode.replaceValues(
                            urlRegexp,
                            { fast: 'url(' },
                            url => resolveUrls(url, remoteFile),
                        );
                    }

                    const tree = await (options.recursive
                        ? importUrl(newNode, null, r.parent)
                        : Promise.resolve(newNode));
                    atRule.replaceWith(tree);
                },
            );
        });
        await Promise.all(imports);
        return tree;
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
    return 'url("' + new URL(cleanupRemoteFile(to), from).href + '")';
}

function createPromise(remoteFile, options) {
    const reqOptions = {
        url: remoteFile,
        headers: {
            connection: 'keep-alive',
        },
    };
    if (options.modernBrowser) {
        reqOptions.headers['user-agent'] =
            'Mozilla/5.0 AppleWebKit/538.0 Chrome/88.0.0.0 Safari/538';
    }
    if (options.userAgent) {
        reqOptions.headers['user-agent'] = String(options.userAgent);
    }
    function executor(resolve, reject) {
        axios(reqOptions)
            .then(response => {
                resolve({
                    body: response.data,
                    parent: remoteFile,
                });
            })
            .catch(error => {
                return reject(error);
            });
    }
    return new Promise(executor);
}
