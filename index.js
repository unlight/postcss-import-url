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
  dataUrls: false,
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
          let hasLayer = params.find(param => param.includes('layer'));
          let hasSupports = params.find(param => param.includes('supports'));

          const mediaQueries = params
            .slice(hasLayer ? (hasSupports ? 3 : 2) : 1)
            .join(' ');

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

          if (hasSupports) {
            const supportQuery = params.find(param =>
              param.includes('supports'),
            );

            let init = supportQuery.indexOf('(');
            let fin = supportQuery.indexOf(')');
            let query = supportQuery.substr(init + 1, fin - init - 1);

            const supportsNode = postcss.atRule({
              name: 'supports',
              params: `(${query})`,
              source: atRule.source,
            });
            supportsNode.append(newNode);
            newNode = supportsNode;
          } else {
            newNode.source = atRule.source;
          }

          if (hasLayer) {
            const layer = params.find(param => param.includes('layer'));

            let init = layer.indexOf('(');
            let fin = layer.indexOf(')');
            let layerName = layer.substr(init + 1, fin - init - 1);

            const layerNode = postcss.atRule({
              name: 'layer',
              params: layerName,
              source: newNode.source,
            });

            layerNode.append(newNode);
            newNode = layerNode;
          }

          if (options.resolveUrls) {
            // Convert relative paths to absolute paths
            newNode = newNode.replaceValues(urlRegexp, { fast: 'url(' }, url =>
              resolveUrls(url, remoteFile),
            );
          }

          const importedTree = await (options.recursive
            ? importUrl(newNode, null, r.parent)
            : Promise.resolve(newNode));

          if (options.dataUrls) {
            atRule.params = `url(data:text/css;base64,${Buffer.from(
              importedTree.toString(),
            ).toString('base64')})`;
          } else {
            atRule.replaceWith(importedTree);
          }
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
  return 'url("' + resolveRelative(cleanupRemoteFile(to), from) + '")';
}

function createPromise(remoteFile, options) {
  const reqOptions = urlParse(remoteFile);
  reqOptions.headers = {};
  reqOptions.headers['connection'] = 'keep-alive';
  if (options.modernBrowser) {
    reqOptions.headers['user-agent'] =
      'Mozilla/5.0 AppleWebKit/538.0 Chrome/88.0.0.0 Safari/538';
  }
  if (options.userAgent) {
    reqOptions.headers['user-agent'] = String(options.userAgent);
  }
  function executor(resolve, reject) {
    const request = hh.get(reqOptions, response => {
      let body = '';
      response.on('data', chunk => {
        body += chunk.toString();
      });
      response.on('end', () => {
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
}

function urlParse(remoteFile) {
  const reqOptions = url.parse(remoteFile);
  return reqOptions;
}
