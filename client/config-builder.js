const path = require('path');
const webpack = require('webpack');

const DynamicCdnWebpackPlugin = require('dynamic-cdn-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

function configBuilder(deploy = false) {
    const config = {
        context: __dirname,
        entry: {
            app: ['babel-polyfill', path.resolve(__dirname, 'src/app')],
            worker: ['babel-polyfill', path.resolve(__dirname, 'src/worker/index.js')],
        },
        output: {
            filename: '[name].js',
        },
        resolve: {
            alias: {
                app: path.resolve(__dirname, 'src/app'),
                assets: path.resolve(__dirname, 'src/assets'),
                worker: path.resolve(__dirname, 'src/worker'),
            },
        },
        module: {
            rules: [{
                test: /\.js$/,
                include: path.resolve(__dirname, 'src/'),
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: ['env'],
                        cacheDirectory: true,
                    },
                }],
            },
            {
                test: /\.html$/,
                use: [{
                    loader: 'html-loader',
                    options: {
                        minimize: true,
                    },
                }],
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            minimize: true,
                        },
                    },
                ],
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        outputPath: 'img/',
                    },
                }],
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        outputPath: 'fnt/',
                    },
                }],
            },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                excludeChunks: ['worker'],
                template: 'src/assets/html/index.html',
            }),
            new webpack.ProvidePlugin({
                // jquery object must be global or bootstrap won't be able to find it
                $: 'jquery',
                jQuery: 'jquery',
            }),
        ],
    };

    if (deploy) {
        config.output.path = path.join(__dirname, 'dist/');

        config.plugins.push(
            new DynamicCdnWebpackPlugin({
                only: [
                    'angular',
                    'bootstrap',
                    'jquery',
                    'mathjs',
                    'sortablejs',
                    'toastr',
                    'underscore',
                ],
            }),
            new UglifyJsPlugin(),
        );
    } else { // if (!deploy)
        config.output.path = path.join(__dirname, 'devel/');

        config.devtool = 'source-map';
        config.output.sourceMapFilename = '[name].js.map';
    }

    return config;
}

module.exports = configBuilder;
