const merge = require("webpack-merge").merge;
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const base = require('./webpack.base.config');

module.exports = merge(base, {
    mode: 'production',
    optimization: {
        minimize: true,
        minimizer: [
            new OptimizeCssAssetsPlugin(),
            new TerserPlugin({
                parallel: true,
            })
        ],
    },
});