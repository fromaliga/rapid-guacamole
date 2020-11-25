const path = require(`path`);
const isDev = process.env.NODE_ENV === "development";
const isProd = !isDev;

const config = {
  context: path.resolve(__dirname, `source`),
  mode: process.env.NODE_ENV,
  optimization: {
    minimize: isProd,
  },
  entry: {
    vendor: `./js/vendor/vendor.js`,
  },
  output: {
    filename: `[name].min.js`,
    path: path.join(__dirname, `build/js`),
  },
  plugins: [],
  module: {
    rules: [],
  },
};

if (isProd) {
  config.module.rules.push({
    test: /\.js$/,
    exclude: /node_modules/,
    loader: {
      loader: `babel-loader`,
    },
  });
}

module.exports = config;
