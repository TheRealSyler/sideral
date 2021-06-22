import { Configuration } from 'webpack';
import { Configuration as Dev } from 'webpack-dev-server';
import { resolve } from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
// const WebpackBundleAnalyzer = require('webpack-bundle-analyzer');

interface C extends Dev, Configuration { }

const config: C = {
  entry: {
    index: `${__dirname}/src/sprite/spriteIndex.ts`,
  },
  output: {
    path: resolve(__dirname, 'dist'),
    chunkFilename: '[name].chunk.js',
    filename: '[name].bundle.js',
    publicPath: '/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: `${__dirname}/public/index.html`,
      favicon: `${__dirname}/public/icon.png`
    }),
    new ForkTsCheckerWebpackPlugin(),
    // new WebpackBundleAnalyzer.BundleAnalyzerPlugin()
  ],
  module: {
    rules: [
      {
        test: /.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /.tsx?$/,
        loader: 'ts-loader',
      },
      {
        test: /.(eot|woff2?|svg|ttf|png|jpe?g)([?]?.*)$/,
        loader: 'file-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },

  optimization: {
    usedExports: true,
    splitChunks: {
      chunks: 'all',
      minSize: 2000,
    },
  },
  devServer: {
    port: 7000
  }
};

module.exports = config;
