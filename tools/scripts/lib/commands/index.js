module.exports = {
  cleanTypescriptBuild: require.resolve('@tools/clean-typescript-build/bin'),
  jest: require.resolve('@tools/jest/bin'),
  gitTagVersions: require.resolve('@tools/git-tag-versions/bin'),
  preloadedNode: require.resolve('@tools/preloaded-node/bin'),
  standardjs: require.resolve('@tools/standardjs/bin'),
  tslint: require.resolve('@tools/tslint/bin'),
  typescript: require.resolve('@tools/typescript/bin'),
  workspace: require.resolve('@tools/workspace/bin')
}
