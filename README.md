# postcss-import-url

[PostCSS] plugin inlines remote files.

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
postcss([ require('postcss-import-url') ])
```

See [PostCSS] docs for examples for your environment.

### Options

- `recurse` (boolean) When `true`, the plugin will import URLs recursively. For example:

  **style1.css**
  ```css
  @import url("http://example.com/style2.css");
  ```

  **style2.css**
  ```css
  @import url("http://example.com/style3.css");
  ```

  **style3.css**
  ```css
  p {color: red;}
  ```

  Will result in:
  ```css
  p {color: red;}
  ```

  Instead of:
  ```css
  @import url("http://example.com/style3.css");
  ```

  Default is `false`.
