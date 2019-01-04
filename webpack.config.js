const path = require("path");
const webpack = require("webpack");

module.exports = {
	entry: "./src/main.js",
	devServer: {
		hot: true,
		watchOptions: {
			poll: true
		}
	},
	module: {
		rules: [
			{
				test: /\.m?js$/,
				exclude: /(node_modules)/,
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@babel/preset-env"]
					}
				}
			}
		]
	},
	resolve: {
		extensions: [".js"]
	},
	output: {
		path: `${__dirname}/dist/`,
		filename: "bundle.js"
	}
};
