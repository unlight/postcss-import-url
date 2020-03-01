module.exports = {
    root: true,
    env: {
        node: true,
        browser: true,
        mocha: true,
        es6: true,
    },
    extends: ['eslint:recommended'],
    plugins: [],
    rules: {
        // core
        indent: [1, 4],
        semi: [1, 'always'],
        'max-lines': [1, { max: 200 }],
        'max-params': [1, { max: 5 }],
        'no-unneeded-ternary': [1],
    },
    overrides: [
        {
            files: ['test/**/*.js'],
            rules: {
                'max-lines': 0,
            },
        },
    ],
};
