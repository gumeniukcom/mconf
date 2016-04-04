/**
 * Stanislav Gumeniuk i@vigo.su
 */

var assert = require('chai').assert;
var mockery = require('mockery');

var CONST_GLOBAL_ENV_NAME = 'NODE_ENV';

var default_path = '../config';
var default_path_to_mock_config = './test_mocks/configs';
var default_available_config = ['production', 'rc', 'develop'];

describe('services/cache', function () {

    var config;

    before(function () {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });

        Config = require('../index');
    });


    after(function () {
        mockery.disable();
    });

    afterEach(function () {
        mockery.deregisterAll();
    });


    describe('Check constructor', function () {
        it('return error on not setted path to config dir', function () {
            assert.throw(function () {
                new Config()
            }, 'Need set path to config dir');
        });

        it('return error on not setted available configs', function () {
            var path = '../config/';
            assert.throw(function () {
                new Config(path)
            }, 'Need set available configs');
        });

        it('return error on  available configs are not array ( object given )', function () {
            var path = '../config/';
            assert.throw(function () {
                new Config(path, {foo: 'bar'})
            }, 'Available configs should be an array.');
        });

        it('return error on  available configs are not array ( string given )', function () {
            var path = '../config/';
            assert.throw(function () {
                new Config(path, 'foo')
            }, 'Available configs should be an array');
        });

        it('return error on  available configs are empty array', function () {
            var path = '../config/';
            assert.throw(function () {
                new Config(path, [])
            }, 'Available configs should be an array with more than 0 elements.');
        });

    });

    describe('Get environment from global ENV', function () {
        it('return string', function () {

            process.env[CONST_GLOBAL_ENV_NAME] = 'test';

            var config = new Config(default_path, default_available_config);

            assert.typeOf(config.getEnvironmentFromGlobalEnv(), 'string');
        });
        it('return real value', function () {

            process.env[CONST_GLOBAL_ENV_NAME] = 'test';

            var config = new Config(default_path, default_available_config);

            assert.equal(config.getEnvironmentFromGlobalEnv(), 'test');
        });

        it('return real value after change default global env name', function () {

            var CONST_GLOBAL_ENV_NAME_NEW = 'MAIL_ENV';

            process.env[CONST_GLOBAL_ENV_NAME_NEW] = 'test_new_value';

            var config = new Config(default_path, default_available_config);

            assert.equal(config.setEnvName(CONST_GLOBAL_ENV_NAME_NEW).getEnvironmentFromGlobalEnv(), 'test_new_value');
        });
    });

    describe('Check environment hierarchy', function () {
        it('return boolean', function () {
            var config = new Config(default_path, default_available_config);

            assert.typeOf(config._isEnvironmentAvailable('foo'), 'boolean');
        });

        it('return true for environment existing in hierarchy', function () {
            var config = new Config(default_path, default_available_config);

            assert.equal(config._isEnvironmentAvailable('production'), true);
        });

        it('return false for environment not existing in hierarchy', function () {
            var config = new Config(default_path, default_available_config);

            assert.equal(config._isEnvironmentAvailable('foo'), false);
        });

        it('adding env to hierarchy', function () {
            var config = new Config(default_path, default_available_config);
            config.configHierarchy = ['foo'];

            var expectedConfigHierarchy = ['foo', 'bar'];
            config._addEnvironmentToHierarchy('bar');
            assert.sameMembers(config.configHierarchy, expectedConfigHierarchy);
        })
    });

    describe('Check config loading', function () {

        it('return object', function () {

            mockery.registerMock('../config/production', {
                foo: "bar",
                first: {
                    name: 'value'
                }
            });

            mockery.registerMock('../config/develop', {
                bar: "foo",
                first: {
                    name: 'new value'
                }
            });

            var config = new Config(default_path, default_available_config);
            assert.isObject(config.getConfig());
        });

        it('throw error on not found config', function () {

            mockery.registerMock('../config/production', {
                foo: "bar",
                first: {
                    name: 'value'
                }
            });

            var CONST_GLOBAL_ENV_NAME_NEW = 'MAIL_ENV';

            process.env[CONST_GLOBAL_ENV_NAME_NEW] = 'rc';

            var config = new Config(default_path, default_available_config);

            config.setEnvName(CONST_GLOBAL_ENV_NAME_NEW);

            assert.throw(function () {
                config.getConfig()
            }, 'Mconf: config "rc" not found in ../config/rc');
        });

        it('throw error on error in config', function () {

            mockery.registerMock(default_path_to_mock_config + '/production', {
                foo: "bar",
                first: {
                    name: 'value'
                }
            });

            var CONST_GLOBAL_ENV_NAME_NEW = 'MAIL_ENV';

            process.env[CONST_GLOBAL_ENV_NAME_NEW] = 'develop';

            var config = new Config(default_path_to_mock_config, default_available_config);

            config.setEnvName(CONST_GLOBAL_ENV_NAME_NEW);

            assert.throw(function () {
                config.getConfig()
            }, 'Mconf: some error in your config "develop" not found in ./test_mocks/configs/develop');
        });


        it('return really union config with deep merge', function () {
            mockery.registerMock('../config/production', {
                foo: "bar",
                first: {
                    name: 'value',
                    bar: 'foo'
                }
            });

            mockery.registerMock('../config/develop', {
                bar: "foo",
                first: {
                    name: 'new value'
                }
            });

            var expectedConfig = {
                foo: "bar",
                first: {
                    name: 'new value',
                    bar: 'foo'
                },
                bar: "foo",
                "environment": "develop"

            };
            var config = new Config(default_path, default_available_config);
            assert.deepEqual(config.getConfig(), expectedConfig);
        });

        it('return really union config with undeep merge', function () {
            mockery.registerMock('../config/production', {
                foo: "bar",
                first: {
                    name: 'value',
                    bar: 'foo'
                }
            });

            mockery.registerMock('../config/develop', {
                bar: "foo",
                first: {
                    name: 'new value'
                }
            });

            var expectedConfig = {
                foo: "bar",
                first: {
                    name: 'new value'
                },
                bar: "foo",
                "environment": "develop"

            };
            var config = new Config(default_path, default_available_config);
            assert.deepEqual(config.setDeepMerge(false).getConfig(), expectedConfig);
        });
    })

});