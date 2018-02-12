module.exports = {
  "extends": "influential",
  "rules": {
    // pimp-my-sql uses functions named Model, and Query
    'new-cap': 0,
    'import/no-internal-modules': [ 'error', {
      'allow': [ '**/lib/*', '**/fixtures/*' ],
    }]
  }
};
