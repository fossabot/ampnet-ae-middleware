const path = require('path');

module.exports = {
  test: {
    client: 'postgresql',
    connection: {
      host: '127.0.0.1',
      user: 'ae_middleware_test',
      password: 'password',
      port: '5432',
      database: 'ae_middleware_test',
    },
    pool: {
      min: 0,
      max: 10,
      idleTimeoutMillis: 500
    },
    migrations: {
      directory: path.join(__dirname, 'db', 'migrations'),
    }
  },
  development: {
    client: 'postgresql',
    connection: {
      host: '127.0.0.1',
      user: 'ae_middleware',
      password: 'password',
      port: '5432',
      database: 'ae_middleware',
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: path.join(__dirname, 'db', 'migrations'),
    }
  },
  production: {
    // TODO: Think this through, properties should be loaded through process.env 
  }
};