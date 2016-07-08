# postcss-import-url

[PostCSS](https://github.com/postcss/postcss) plugin inlines remote files.

```css
/* Input example */
@import "http://fonts.googleapis.com/css?family=Tangerine";
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
    src: local('Tangerine'), url(http://fonts.gstatic.com/s/tangerine/v7/HGfsyCL5WASpHOFnouG-RKCWcynf_cDxXwCLxiixG1c.ttf) format('truetype')
}
body {
	font-size: 13px;
}
```
## Usage

```js
var importUrl = require('postcss-import-url');
var options = {};
postcss([importUrl(options)]);
```

See [PostCSS](https://github.com/postcss/postcss#usage) docs for examples for your environment.

## Options
* `recursive` (boolean) To import URLs recursively (default: `true`)

## Changelog
1.0.0 (Nov 1, 2015)
- first release

2.0.0 (Jul 8, 2016)
- added recursive option

2.1.0 (Jul 9, 2016)
- replaced Object.assign by _.assign