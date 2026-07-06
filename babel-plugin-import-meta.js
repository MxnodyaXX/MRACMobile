/**
 * Rewrites `import.meta` to a safe object literal.
 *
 * Some deps (e.g. zustand's ESM build) reference `import.meta.env.MODE`.
 * React Native polyfills `import.meta`, but a web classic-script bundle cannot
 * use it and throws "Cannot use 'import.meta' outside a module", crashing the
 * whole bundle. Replacing the meta-property with `{ env: { MODE: <NODE_ENV> } }`
 * satisfies those checks on every platform without changing behavior.
 */
module.exports = function importMetaSafe({ types: t }) {
  return {
    name: 'transform-import-meta-safe',
    visitor: {
      MetaProperty(path) {
        const { node } = path;
        if (node.meta && node.meta.name === 'import' && node.property && node.property.name === 'meta') {
          path.replaceWith(
            t.objectExpression([
              t.objectProperty(
                t.identifier('env'),
                t.objectExpression([
                  t.objectProperty(
                    t.identifier('MODE'),
                    t.memberExpression(
                      t.memberExpression(t.identifier('process'), t.identifier('env')),
                      t.identifier('NODE_ENV'),
                    ),
                  ),
                ]),
              ),
            ]),
          );
        }
      },
    },
  };
};
