const distribute = require('./webpack.config.dist.js');
const path = require('path');

// develop build is the same as distribute but without externals and with source
// map
const develop = Object.assign({}, distribute);

develop.output.path = path.join(__dirname, 'devel/');

delete develop.externals;

develop.devtool = 'source-map';
develop.output.devtoolLineToLine = true;
develop.output.pathinfo = true;
develop.output.sourceMapFilename = '[name].bundle.js.map';

module.exports = develop;
