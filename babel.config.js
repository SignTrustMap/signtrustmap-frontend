module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      function ({ template }) {
        return {
          visitor: {
            MemberExpression(path) {
              if (
                path.node.object?.type === 'MetaProperty' &&
                path.node.object.meta?.name === 'import' &&
                path.node.object.property?.name === 'meta' &&
                path.node.property?.name === 'url'
              ) {
                path.replaceWith(
                  template.expression("require('url').pathToFileURL(__filename).href")()
                );
              }
            },
          },
        };
      },
    ],
  };
};
