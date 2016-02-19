# mconf
=======

[![Build Status](https://travis-ci.org/ViGo5190/mconf.svg?branch=master)](https://travis-ci.org/ViGo5190/mconf)
[![Coverage Status](https://coveralls.io/repos/github/ViGo5190/mconf/badge.svg?branch=master)](https://coveralls.io/github/ViGo5190/mconf?branch=master)

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
* By default will be used `develop` config.

# Environment name

By default using `NODE_ENV`, but if you need to use another environment name:

   ```
   var config = new Config(__dirname,['production', 'develop']);
   module.exports = config
      .setEnv('YOUR_ENV_NAME')
      .getConfig();
   ```
# Merge config strategy

By default using `deep merge` strategy. But if you want non deep merge ( rewrite), you should use:

   ```
   var config = new Config(__dirname,['production', 'develop']);
   module.exports = config
      .setDeepMerge(false)
      .getConfig();
   ```

