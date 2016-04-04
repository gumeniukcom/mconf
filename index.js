/**
 * Stanislav Gumeniuk i@vigo.su
 */


"use strict";

var merger = require('extend');

class Config {

    constructor(pathToConfigDir, availableConfigs) {

        pathToConfigDir = Config._clearPathToConfigDir(pathToConfigDir);
        availableConfigs = Config._clearAvailableConfigs(availableConfigs);

        this.envName = 'NODE_ENV';
        this.availableConfigs = availableConfigs;// || ['production', 'rc', 'develop'];
        this.configHierarchy = ['production'];
        this.pathToConfigDir = pathToConfigDir;
        this.deepMerge = true;
    }

    setEnvName(envName) {
        this.envName = envName;
        return this;
    }

    setDeepMerge(deep) {
        this.deepMerge = deep;
        return this;
    }


    getConfig() {
        var env = this.getEnvironmentFromGlobalEnv();
        if (!this._isEnvironmentAvailable(env)) {
            env = 'develop';
        }
        this._addEnvironmentToHierarchy(env);
        return this._initConfig();
    }

    getEnvironmentFromGlobalEnv() {
        var systemProcess = null;
        try {
            systemProcess = process;
        } catch (e) {
            systemProcess = system; //Prop for phantomjs
        }
        return systemProcess.env[this.envName];
    }

    static _clearPathToConfigDir(pathToConfigDir) {
        if (!pathToConfigDir) {
            throw new Error('Need set path to config dir');
        }
        if (pathToConfigDir.substr(-1) === '/') {
            pathToConfigDir = pathToConfigDir.substr(0, pathToConfigDir.length - 1);
        }

        return pathToConfigDir;
    }

    static _clearAvailableConfigs(availableConfigs) {
        if (!availableConfigs) {
            throw new Error('Need set available configs');
        }

        if (!(availableConfigs instanceof Array)) {
            throw new Error('Available configs should be an array.');
        }

        if (availableConfigs.length === 0) {
            throw new Error('Available configs should be an array with more than 0 elements.');
        }

        return availableConfigs;
    }

    _isEnvironmentAvailable(environment) {
        return this.availableConfigs.indexOf(environment) !== -1;
    }

    _addEnvironmentToHierarchy(environment) {
        this.configHierarchy.push(environment);
        return this;
    }

    _initConfig() {
        var result = {};
        var pathToConfigDir = this.pathToConfigDir;
        var self = this;
        this.configHierarchy
            .forEach(function (configName) {
                var path = pathToConfigDir + '/' + configName;
                try {
                    var config = require(path);
                } catch (e) {
                    throw new Error('Config: "' + path + '" not found');
                }

                merger(self.deepMerge?true:false,result, config);

                result.environment = configName;
            });
        return result;
    }
}

module.exports = Config;