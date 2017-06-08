const path = require('path');

const distribute = {
    context: __dirname,
    entry: {
        main: ['babel-polyfill', './src/js/app.module.js'],
        worker: ['babel-polyfill', './src/js/viewer/rendering-worker.js'],
    },
    output: {
        path: path.join(__dirname, 'dist/'),
        filename: '[name].bundle.js',
    },
    externals: {
        angular: 'angular',
        jquery: 'jquery',
        toastr: 'toastr',
        underscore: 'underscore',
    },
    module: {
        loaders: [{
            loader: 'babel-loader',
            include: path.join(__dirname, 'src/'),
            test: /\.js$/,
            query: {
                presets: ['es2015'],
            },
        }],
    },
};

module.exports = distribute;
