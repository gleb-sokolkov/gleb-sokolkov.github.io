const merge = require("webpack-merge").merge;
const base = require('./webpack.base.config');

module.exports = merge(base, {
    mode: 'development',
    devtool: 'source-map',
    watch: true,
    watchOptions: {
        poll: 1000,
    },
})