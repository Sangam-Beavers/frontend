export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'Feature',
        'Fix',
        'Build',
        'Chore',
        'Ci',
        'Docs',
        'Style',
        'Refactor',
        'Test',
        'Init',
        'Release',
        'Plus',
        'Minus',
      ],
    ],
    'type-case': [0],
  },
};
