'use strict';

module.exports = {
  service: 'mconf-test',
  port: 80,
  feature: {
    enabled: false,
    flags: {
      a: 1,
      b: 2,
    },
  },
  list: ['prod-a', 'prod-b'],
};
