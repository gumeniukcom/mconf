# mconf
=======

Simple config for nodejs.

# Using:

* `npm i mconf --save`
* create directory with configurations
* create files `production.js` and `develop.js` and put them into created directory
* create `index.js` file with:
  ```
  var Config = require('mconf');

  if (!__dirname) {
      var __dirname = require('fs').workingDirectory;
  }

  var config = new Config(__dirname,['production', 'develop']);
  module.exports = config.getConfig();
  ```
* run your node application with export env : `export NODE_ENV=production` for production env.
* By default will be used develop config.
