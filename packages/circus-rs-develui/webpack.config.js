const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const nodeEnv =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';

module.exports = {
  mode: nodeEnv,
  entry: {
    index: './src/index.tsx'
  },
  output: {
    path: path.join(__dirname, 'public'),
    filename: '[name].js'
  },
  resolve: {
    modules: [path.join(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  module: {
    rules: [
      {
        test: t =>
          /\.(jsx?|tsx?)/.test(t) &&
          (/(circus-rs|rb-components)/.test(t) || !/node_modules/.test(t)),
        use: ['babel-loader']
      },
      {
        test: /\.(woff|woff2|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: { limit: 1000000 }
          }
        ]
      },
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      },
      {
        test: /\.css/,
        use: ['style-laoder', 'css-loader']
      },
      {
        test: /\.(frag|vert)$/,
        use: ['webpack-glsl-loader']
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(nodeEnv)
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'index.html',
          to: 'index.html',
          context: 'src'
        }
      ]
    })
  ],
  devServer: {
    host: process.env.DEVSERVER_HOST,
    port: process.env.DEVSERVER_PORT,
    contentBase: path.join(__dirname, 'public'),
    disableHostCheck: true,
    historyApiFallback: {
      rewrites: [{ from: /^\/*/, to: '/index.html' }],
    },
  },
  devtool: 'source-map',
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  }
};
