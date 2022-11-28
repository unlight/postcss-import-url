const postcss = require('postcss');
const expect = require('expect');
const fs = require('fs');
const plugin = require('../');
const tcpp = require('tcp-ping');
const log = require('ololog');

const fixture1Css = fs.readFileSync(__dirname + '/fixture-1/style.css', {
    encoding: 'utf8',
});

const testEqual = function (input, output, pluginOptions, postcssOptions, done) {
    getResult(input, pluginOptions, postcssOptions).then(result => {
        expect(result.css.trim()).toEqual(output.trim());
        expect(result.warnings()).toHaveLength(0);
        done();
    }, done);
};

const testContains = function (input, value, pluginOptions, postcssOptions, done) {
    getResult(input, pluginOptions, postcssOptions).then(result => {
        expect(result.css).toContain(value);
        expect(result.warnings()).toHaveLength(0);
        done();
    }, done);
};

async function getResult(input, pluginOptions, postcssOptions) {
    return postcss([plugin(pluginOptions)]).process(input, {
        from: undefined,
        ...postcssOptions,
    });
}

describe('import with media queries', function () {
    it('only screen', async () => {
        const input =
            "@import 'http://fonts.googleapis.com/css?family=Tangerine' only screen and (color)";
        const result = await getResult(input);
        expect(result.css).toContain('@media only screen and (color)');
    });

    it('rule with and', function (done) {
        const input =
            "@import 'http://fonts.googleapis.com/css?family=Tangerine' screen and (orientation:landscape)";
        testContains(input, '@media screen and (orientation:landscape)', {}, {}, done);
    });

    it('rule projection, tv', function (done) {
        const input =
            "@import url('http://fonts.googleapis.com/css?family=Tangerine') projection, tv";
        testContains(input, '@media projection, tv', {}, {}, done);
    });

    it('rule print', function (done) {
        const input =
            "@import url('http://fonts.googleapis.com/css?family=Tangerine') print";
        testContains(input, '@media print', {}, {}, done);
    });

    it('rule layer', function (done) {
        const input =
            "@import url('http://fonts.googleapis.com/css?family=Tangerine') layer(test);";
        testContains(input, '@layer test {', {}, {}, done);
    });

    it('rule anonymous layer', function (done) {
        const input =
            "@import url('http://fonts.googleapis.com/css?family=Tangerine') layer;";
        testContains(input, '@layer {', {}, {}, done);
    });

    it('contains it', function (done) {
        const input =
            "@import url('http://fonts.googleapis.com/css?family=Tangerine') (min-width: 25em);";
        testContains(input, '(min-width: 25em)', {}, {}, done);
    });

    describe('media query', function () {
        it('contains font-family', function (done) {
            const input =
                "@import url('http://fonts.googleapis.com/css?family=Tangerine') (min-width: 25em);";
            testContains(input, "font-family: 'Tangerine'", {}, {}, done);
        });

        it('contains src local', async () => {
            const input =
                "@import url('http://fonts.googleapis.com/css?family=Tangerine') (min-width: 25em);";
            const result = await getResult(input);
            expect(result.css).toContain('@media (min-width: 25em) {@font-face');
        });

        it('contains layer', function (done) {
            const input =
                "@import url('http://fonts.googleapis.com/css?family=Tangerine') layer(test) (min-width: 25em);";
            testContains(input, '@layer test {@media (min-width: 25em)', {}, {}, done);
        });
    });
});

describe('skip non remote files', function () {
    it('local', function (done) {
        testEqual("@import 'a.css';", "@import 'a.css';", {}, {}, done);
    });

    it('relative parent', function (done) {
        const input = "@import '../a.css'";
        testEqual(input, input, {}, {}, done);
    });

    it('relative child', function (done) {
        const input = "@import './a/b.css'";
        testEqual(input, input, {}, {}, done);
    });

    it.skip('no protocol', async () => {
        const input = '@import url(//example.com/a.css)';
        const result = await getResult(input);
    });
});

describe('import url tangerine', function () {
    function assertOutputTangerine(result) {
        expect(result.css).toContain("font-family: 'Tangerine'");
        expect(result.css).toContain('font-style: normal');
        expect(result.css).toContain('font-weight: 400');
        expect(result.css).toContain('fonts.gstatic.com/s/tangerine');
    }

    it('empty', async () => {
        const input =
            "@import 'http://fonts.googleapis.com/css?family=Tangerine'            ;";
        const result = await getResult(input);
        assertOutputTangerine(result);
    });

    it('double quotes', async () => {
        const input = '@import "http://fonts.googleapis.com/css?family=Tangerine";';
        const result = await getResult(input);
        assertOutputTangerine(result);
    });

    it('single quotes', async () => {
        const input = "@import 'http://fonts.googleapis.com/css?family=Tangerine';";
        const result = await getResult(input);
        assertOutputTangerine(result);
    });

    it('url single quotes', async () => {
        const input =
            "@import url('http://fonts.googleapis.com/css?family=Tangerine');";
        const result = await getResult(input);
        assertOutputTangerine(result);
    });

    it('url double quotes', async () => {
        const input =
            '@import url("http://fonts.googleapis.com/css?family=Tangerine");';
        const result = await getResult(input);
        assertOutputTangerine(result);
    });

    it('url no quotes', async () => {
        const input = '@import url(http://fonts.googleapis.com/css?family=Tangerine);';
        const result = await getResult(input);
        assertOutputTangerine(result);
    });
});

describe('recursive import', function () {
    it('ping server', done => {
        tcpp.probe('localhost', 1234, function (err) {
            done(err);
        });
    });

    var opts = {
        recursive: true,
    };

    describe('fixture-1', function () {
        it('fixture-1 contains class a1', function (done) {
            const input = '@import url(http://localhost:1234/fixture-1/style.css)';
            testContains(input, '.a1', opts, {}, done);
        });

        it('fixture-1 contains class a', function (done) {
            const input = '@import url(http://localhost:1234/fixture-1/style.css)';
            testContains(input, "content: '.a'", opts, {}, done);
        });

        it('fixture-1 contains class style content', function (done) {
            const input = '@import url(http://localhost:1234/fixture-1/style.css)';
            testContains(input, "content: '.style'", opts, {}, done);
        });

        it('fixture-1 contains class a when passed as a string', function (done) {
            const input = fixture1Css;
            testContains(
                input,
                "content: '.a'",
                opts,
                {
                    from: 'http://localhost:1234/fixture-1/style.css',
                },
                done,
            );
        });
    });

    describe('fixture-2', function () {
        it('fixture-2 contains class a1', function (done) {
            const input = '@import url(http://localhost:1234/fixture-2/style.css)';
            testContains(input, "content: '.a1'", opts, {}, done);
        });

        it('fixture-2 contains class a', function (done) {
            const input = '@import url(http://localhost:1234/fixture-2/style.css)';
            testContains(input, "content: '.a'", opts, {}, done);
        });

        it('fixture-2 contains class b1', function (done) {
            const input = '@import url(http://localhost:1234/fixture-2/style.css)';
            testContains(input, "content: '.b1'", opts, {}, done);
        });

        it('fixture-2 contains class b', function (done) {
            const input = '@import url(http://localhost:1234/fixture-2/style.css)';
            testContains(input, "content: '.b'", opts, {}, done);
        });

        it('fixture-2 contains class style content', function (done) {
            const input = '@import url(http://localhost:1234/fixture-2/style.css)';
            testContains(input, "content: '.style'", opts, {}, done);
        });
    });

    describe('fixture-3 convert relative paths in property values', function () {
        it('does not resolve relative URLs by default', function (done) {
            const input = '@import url(http://localhost:1234/fixture-3/style.css)';
            testContains(input, "src: url('./font.woff');", {}, {}, done);
        });

        it('does not resolve relative URLs when option.resolveURLs is false', function (done) {
            const input = '@import url(http://localhost:1234/fixture-3/style.css)';
            testContains(
                input,
                "src: url('./font.woff');",
                { resolveUrls: false },
                {},
                done,
            );
        });

        var _opts = { resolveUrls: true };

        it('resolves relative URLs when option.resolveURLs is true', function (done) {
            const input = '@import url(http://localhost:1234/fixture-3/style.css)';
            testContains(
                input,
                'src: url("http://localhost:1234/fixture-3/font.woff");',
                _opts,
                {},
                done,
            );
        });

        it('does not modify absolute paths', function (done) {
            const input = '@import url(http://localhost:1234/fixture-3/style.css)';
            testContains(
                input,
                'background-image: url("http://example.com/absolute.png");',
                _opts,
                {},
                done,
            );
        });

        it('makes root relative paths absolute', function (done) {
            const input = '@import url(http://localhost:1234/fixture-3/style.css)';
            testContains(
                input,
                'background-image: url("http://localhost:1234/root-relative.png")',
                _opts,
                {},
                done,
            );
        });

        it('makes implicit sibling paths absolute', function (done) {
            const input = '@import url(http://localhost:1234/fixture-3/style.css)';
            testContains(
                input,
                'background-image: url("http://localhost:1234/fixture-3/implicit-sibling.png")',
                _opts,
                {},
                done,
            );
        });

        it('makes relative sibling paths absolute', function (done) {
            const input = '@import url(http://localhost:1234/fixture-3/style.css)';
            testContains(
                input,
                'background-image: url("http://localhost:1234/fixture-3/sibling.png")',
                _opts,
                {},
                done,
            );
        });

        it('makes parent relative paths absolute', function (done) {
            const input = '@import url(http://localhost:1234/fixture-3/style.css)';
            testContains(
                input,
                'background-image: url("http://localhost:1234/parent.png")',
                _opts,
                {},
                done,
            );
        });

        it('makes grandparent relative paths absolute', function (done) {
            const input = '@import url(http://localhost:1234/fixture-3/style.css)';
            testContains(
                input,
                'background-image: url("http://localhost:1234/grandparent.png")',
                _opts,
                {},
                done,
            );
        });

        var _optsRecursive = { resolveUrls: true, recursive: true };

        // Test paths are resolved for recursively imported stylesheets
        it('makes relative sibling paths absolute - recursive', function (done) {
            const input = '@import url(http://localhost:1234/fixture-3/style.css)';
            testContains(
                input,
                'background-image: url("http://localhost:1234/fixture-3/recursive/sibling-recursive.png")',
                _optsRecursive,
                {},
                done,
            );
        });

        it('makes parent relative paths absolute - recursive', function (done) {
            const input = '@import url(http://localhost:1234/fixture-3/style.css)';
            testContains(
                input,
                'background-image: url("http://localhost:1234/fixture-3/parent-recursive.png")',
                _optsRecursive,
                {},
                done,
            );
        });

        it('makes grandparent relative paths absolute - recursive', function (done) {
            const input = '@import url(http://localhost:1234/fixture-3/style.css)';
            testContains(
                input,
                'background-image: url("http://localhost:1234/grandparent-recursive.png")',
                _optsRecursive,
                {},
                done,
            );
        });
    });
});

describe('google font woff', function () {
    it('option modernBrowser should import woff', function (done) {
        const input = '@import url(http://fonts.googleapis.com/css?family=Tangerine);';
        testContains(
            input,
            "woff2) format('woff2')",
            { modernBrowser: true },
            {},
            done,
        );
    });

    it('option agent should import woff', function (done) {
        const input = '@import url(http://fonts.googleapis.com/css?family=Tangerine);';
        var opts = {
            userAgent:
                'Mozilla/5.0 AppleWebKit/537.36 Chrome/80.0.2840.99 Safari/537.36',
        };
        testContains(input, "woff2) format('woff2')", opts, {}, done);
    });
});

describe('source property', () => {
    it('regular import', async () => {
        const input = '@import url(http://fonts.googleapis.com/css?family=Tangerine)';
        const result = await getResult(input);
        expect(result.root.source.input.css).toEqual(input);
    });

    it('media import', async () => {
        const input =
            '@import url(http://fonts.googleapis.com/css?family=Tangerine) print';
        const result = await getResult(input);
        expect(result.root.source.input.css).toEqual(input);
    });
});
