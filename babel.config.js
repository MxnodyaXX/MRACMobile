module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // Rewrite `import.meta` (used by zustand ESM) so the web bundle doesn't crash.
      './babel-plugin-import-meta.js',
    ],
  };
};
