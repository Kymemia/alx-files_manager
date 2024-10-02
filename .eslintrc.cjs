module.exports = {
  env: {
    browser: true,         
    es2021: true,          
    node: true,            
  },
  extends: [
    'eslint:recommended',  
    'plugin:node/recommended',  
  ],
  parserOptions: {
    ecmaVersion: 12,       
    sourceType: 'module',  
  },
  rules: {
    'no-unused-vars': 'warn',  
    'no-console': 'off',       
    'node/no-unsupported-features/es-syntax': [
      'error',
      { ignores: ['modules'] },
    ],
  },
};

