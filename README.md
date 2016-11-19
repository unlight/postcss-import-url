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
* `modernBrowser` (boolean) set user-agent string to 'Mozilla/5.0 AppleWebKit/537.36 Chrome/54.0.2840.99 Safari/537.36', this option maybe useful for importing fonts from Google. Google check `user-agent` header string and respond can be different (default: `false`)
* `userAgent` (string) Custom user-agent header (default: `null`)

## Known Issues
* Google fonts returns different file types per the user agent. Because postcss runs in a shell, 
Google returns truetype fonts rather than the better woff2 format.

## Changelog
* 2.2.0 (19 Nov 2016) - added option modernBrowser
* 2.1.1 (19 Oct 2016) - added to readme google font notice
* 2.1.0 (09 Jul 2016) - replaced Object.assign by _.assign
* 2.0.0 (08 Jul 2016) - added recursive option
* 1.0.0 (01 Nov 2015) - first release