'use strict';

// Intentionally broken: references an undefined identifier so that requiring
// this file throws something other than MODULE_NOT_FOUND. The error-handling
// branch in src/index.js exists specifically for this situation.
module.exports = {
  // eslint-disable-next-line no-undef
  value: definitelyNotDefined,
};
