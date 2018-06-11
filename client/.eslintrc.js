const path = require('path');

const config = {
    extends: 'airbnb',
    env: {
        browser: true,
    },
    rules: {
        indent: ['error', 4],
        'no-multi-spaces': [
            'error',
            {
                exceptions: {
                    VariableDeclarator: true,
                    ImportDeclaration: true,
                },
            },
        ],
        'no-bitwise': 0,
        'key-spacing': 0,
    },
    settings: {
        'import/resolver': {
            webpack: {
                config: path.resolve(__dirname, 'webpack.config.devel.js'),
            },
        },
    },
};

module.exports = config;
