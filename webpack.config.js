const path = require("path");
const webpack = require("webpack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    target: "node",
    entry: path.resolve(__dirname, "./src/main.ts"),
    output: {
        path: path.resolve(__dirname, "./", "dist"),
        filename: "main.js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            // disable type checker - we will use it in fork plugin
                            // IMPORTANT! use happyPackMode mode to speed-up compilation and reduce errors reported to webpack
                            happyPackMode: true,
                            transpileOnly: true
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            checkSyntacticErrors: true,
            tslint: path.resolve(__dirname, "tslint.json"),
            tsconfig: path.resolve(__dirname, "tsconfig.json")
        }),
        new CopyWebpackPlugin([
            {
                from: path.resolve(__dirname, "web.config"),
                to: "file"
            }
        ]),
        new webpack.DefinePlugin({
            __APPVERSION__: JSON.stringify(require(path.resolve(__dirname, "./package.json")).version)
        })
    ],
    mode: process.env.NODE_ENV || "development"
};
