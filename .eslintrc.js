module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: ['android/**', 'ios/**', 'node_modules/**', '.expo/**', 'dist/**'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn'
  }
};
