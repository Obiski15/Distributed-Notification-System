const nodeExternals = require("webpack-node-externals")

module.exports = function (options, webpack) {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      extensionAlias: {
        ".js": [".js", ".ts"],
      },
    },
    externals: [
      nodeExternals({
        allowlist: [/^@dns\/shared/],
      }),
    ],
  }
}
