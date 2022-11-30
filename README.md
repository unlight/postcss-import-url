# postcss-import-url

[PostCSS](https://github.com/postcss/postcss) plugin inlines remote files.

```css
/* Input example */
@import 'https://fonts.googleapis.com/css?family=Tangerine';
body {
  font-size: 13px;
}
```

```css
/* Output example */
@font-face {
  font-family: 'Tangerine';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/tangerine/v12/IurY6Y5j_oScZZow4VOxCZZM.woff2)
    format('woff2');
}
body {
  font-size: 13px;
}
```

## Usage

```js
const importUrl = require('postcss-import-url');
const options = {};
postcss([importUrl(options)]).process(css, {
  // Define a `from` option to resolve relative @imports in the initial css to a url.
  from: 'https://example.com/styles.css',
});
```

See [PostCSS](https://github.com/postcss/postcss#usage) docs for examples for your environment.

## Options

- `recursive` (boolean) To import URLs recursively (default: `true`)
- `resolveUrls` (boolean) To transform relative URLs found in remote stylesheets into fully qualified URLs ([see #18](https://github.com/unlight/postcss-import-url/pull/18)) (default: `false`)
- `modernBrowser` (boolean) Set user-agent string to 'Mozilla/5.0 AppleWebKit/537.36 Chrome/80.0.0.0 Safari/537.36', this option maybe useful for importing fonts from Google. Google check `user-agent` header string and respond can be different (default: `false`)
- `userAgent` (string) Custom user-agent header (default: `null`)

## Known Issues

- Google fonts returns different file types per the user agent. Because postcss runs in a shell,
  Google returns truetype fonts rather than the better woff2 format.
  Use option `modernBrowser` to explicitly load woff2 fonts.
