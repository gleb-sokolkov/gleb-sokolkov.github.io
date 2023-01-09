const path = require('path');

module.exports = {
  port: 3000,
  paths: {
    common: {
      dirnames: {
        public: path.resolve(__dirname, 'public'),
      },
      files: {

      },
    },
  },
  webpack: {
    output: {
      dist: path.resolve(__dirname, 'public'),
      images: 'images/[hash].[ext][query]',
      fonts: 'fonts/[hash].[ext][query]',
    },
    entries: {
      index: {
        js: path.resolve(__dirname, 'client/index.js'),
        html: {
          title: 'Static',
          filename: 'index.html',
          template: path.resolve(__dirname, 'client/html/index.html'),
          chunks: ['index'],
        },
      },
      bundles: {
        js: 'js/[name].bundle.js',
        css: 'css/[name].bundle.css',
      },
    },
  },
};
