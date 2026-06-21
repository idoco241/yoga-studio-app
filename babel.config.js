module.exports = function (api) {
  api.cache(true);
  return {
    // hermes-v1 (the default for engine=hermes in SDK 56+) skips private-field
    // transforms assuming hermesc handles them natively. EAS's hermesc AOT
    // compilation rejects private class field syntax (#x). Forcing 'default'
    // selects the hermes-v0 config which includes @babel/plugin-transform-class-
    // properties and transforms private fields before hermesc sees them.
    presets: [['babel-preset-expo', { unstable_transformProfile: 'default' }]],
    plugins: [
      // @supabase/supabase-js uses import(/* webpackIgnore: true */ variable) to
      // optionally load @opentelemetry/api at runtime. Hermes AOT rejects this
      // construct. Replace it with Promise.resolve(null) — OTel is never available
      // in React Native anyway so the runtime behaviour is identical.
      function stubWebpackIgnoreDynamicImports({ types: t }) {
        return {
          visitor: {
            ImportExpression(path) {
              const arg = path.node.source;
              const allComments = [
                ...(path.node.leadingComments || []),
                ...(path.node.innerComments || []),
                ...(arg.leadingComments || []),
                ...(arg.innerComments || []),
              ];
              if (allComments.some((c) => c.value.includes('webpackIgnore'))) {
                path.replaceWith(
                  t.callExpression(
                    t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
                    [t.nullLiteral()]
                  )
                );
              }
            },
          },
        };
      },
    ],
  };
};
