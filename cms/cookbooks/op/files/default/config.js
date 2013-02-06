var settings = {
  // rdio api.
  RDIO_KEY: null,
  RDIO_SECRET: null,
  
  // echonest api
  ECHO_KEY: null,
  ECHO_CONSUMER: null,
  ECHO_SECRET: null,
  
  // last.fm api
  LAST_KEY: null,
  LAST_SECRET: null,
  
  DB_PATH: null,
  DB_VERSION: 3,
  
  
  
  CONTEXT_DIR: '/tmp/genassist/contexts',
  APP_HOST: '127.0.0.1',
  APP_PORT: 2000,
  
  PROXY_HOST: 'genassist.tagfriendly.com',
  PROXY_PORT: 80,
  
  CONTEXT_DB_PATH: '/home/node/dbs/context.db',
  CONTEXT_DB_VERSION: 0,
  
  RELATED_DB_PATH: '/home/node/dbs/albums.db',
  RELATED_DB_VERSION: 0,
  
  CACHE_PATH: '/home/node/cache'
};
exports.settings = settings;