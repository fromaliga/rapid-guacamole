const path = require(`path`);
const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const config = {
  context: path.resolve(__dirname, `source`),
  mode: process.env.NODE_ENV,
  optimization: {
    minimize: isProd,
  },
  entry: {
    main: `./js/core/main.js`,
  },
  devtool: isDev ? 'inline-source-map' : false,
  output: {
    filename: `[name].js`,
    path: path.join(__dirname, `build/js`),
  },
  plugins: [],
  module: {
    rules: [],
  },
};

config.module.rules.push({
  test: /\.js$/,
  exclude: /node_modules/,
  loader: {
    loader: `babel-loader`,
  },
});

module.exports = config;
