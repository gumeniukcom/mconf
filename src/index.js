/**
 * Stanislav Gumeniuk i@vigo.su
 */


"use strict";

import merger from 'extend';

export default class {

    constructor(...args) {

        let pathToConfigDir = clearPathToConfigDir(args[0]);
        let availableConfigs = clearAvailableConfigs(args[1]);

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
        let env = this.getEnvironmentFromGlobalEnv();
        if (!this._isEnvironmentAvailable(env)) {
            env = 'develop';
        }
        this._addEnvironmentToHierarchy(env);
        return this._initConfig();
    }

    getEnvironmentFromGlobalEnv() {
        let systemProcess = null;
        try {
            systemProcess = process;
        } catch (e) {
            systemProcess = system; //Prop for phantomjs
        }
        return systemProcess.env[this.envName];
    }

    _isEnvironmentAvailable(environment) {
        return this.availableConfigs.indexOf(environment) !== -1;
    }

    _addEnvironmentToHierarchy(environment) {
        this.configHierarchy.push(environment);
        return this;
    }

    _initConfig() {
        let result = {};
        let pathToConfigDir = this.pathToConfigDir;

        this.configHierarchy
            .forEach((configName) => {
                let path = pathToConfigDir + '/' + configName;
                try {
                    var config = require(path);
                } catch (e) {
                    if (e.code == 'MODULE_NOT_FOUND') {
                        throw new Error('Mconf: config "' + configName + '" not found in ' + path);
                    }
                    throw new Error('Mconf: some error in your config "' + configName + '" not found in ' + path);
                }

                merger(this.deepMerge ? true : false, result, config);

                result.environment = configName;
            });
        return result;
    }
}

function clearPathToConfigDir(pathToConfigDir) {
    if (!pathToConfigDir) {
        throw new Error('Need set path to config dir');
    }
    if (pathToConfigDir.substr(-1) === '/') {
        pathToConfigDir = pathToConfigDir.substr(0, pathToConfigDir.length - 1);
    }

    return pathToConfigDir;
}

function clearAvailableConfigs(availableConfigs) {
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