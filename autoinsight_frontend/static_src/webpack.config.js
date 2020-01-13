// const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  mode: 'development',
  entry: [
    // require.resolve('webpack-dev-server/client') + '?http://localhost:3000',
    // require.resolve('webpack/hot/dev-server'),
    // 'webpack-dev-server/client?http://localhost:3000',
    // 'webpack/hot/only-dev-server',
    'babel-polyfill',
    'react-hot-loader/patch',
    './src/js/index.jsx',
    './src/css/index.css',
  ],
  output: {
    path: `${__dirname}/../static/autoinsight_frontend/js`,
    // filename: 'bundle.[hash].js'
    filename: 'site.js',
    publicPath: '/site_media/static/js/',
    // publicPath: 'http://0.0.0.0:3000/static/dist/js/',
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            // options: {
            //     plugins: ['react-hot-loader/babel'],
            //     // This is a feature of `babel-loader` for webpack (not Babel itself).
            //     // It enables caching results in ./node_modules/.cache/babel-loader/
            //     // directory for faster rebuilds.
            //     cacheDirectory: true,
            // }
          },
        ],
      },
      {
        test: /\.(png|jpg)$/,
        use: ['file-loader'],
      },
      {
        test: /\.(scss|css)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader?-url',
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
    ],
  },
  devServer: {
    historyApiFallback: true,
    compress: true,
    publicPath: '/static/autoinsight_frontend/js/',
    host: '0.0.0.0',
    port: 3000,
    inline: true,
    hot: true,
    proxy: {
      '**': 'http://localhost:8000',
    },
  },
  // devServer: {
  //     host: 'localhost',
  //     port: port,
  //     open: true,
  //     historyApiFallback: true
  // },
  plugins: [
    // new webpack.NamedModulesPlugin() //브라우저에서 HMR 에러발생시 module name 표시
    // new webpack.HotModuleReplacementPlugin()
    // new webpack.NoErrorsPlugin(), // don't reload if there is an error
    // new BundleTracker({filename: './webpack-stats.json'}),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'disabled',
      generateStatsFile: true,
      statsOptions: { source: false },
    }),
    // new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /ko/),
  ],
};
