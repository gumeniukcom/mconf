import path from 'node:path';
import { createRequire } from 'node:module';

const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const requireFromHere = createRequire(import.meta.url);

/**
 * @typedef {Object} MconfOptions
 * @property {string} [envName='NODE_ENV']      Name of the env var to read.
 * @property {boolean} [deepMerge=true]         Whether to deep-merge layers; otherwise shallow.
 * @property {string} [baseEnv='production']    Layer applied before the resolved env.
 * @property {string} [fallbackEnv='develop']   Used when the resolved env is not in availableEnvs.
 * @property {boolean} [strict=false]           Throw instead of falling back on unknown env.
 */

/**
 * Loads layered Node.js configuration files based on an environment variable.
 *
 * The configuration directory is expected to contain one CommonJS file per
 * environment (matching the names passed in `availableEnvs`). On `getConfig()`,
 * the loader merges the `baseEnv` layer first and then the resolved env layer
 * on top of it, so common defaults can live in one place.
 */
export class Mconf {
  /**
   * @param {string} configDir              Absolute path to the directory holding the configs.
   * @param {string[]} availableEnvs        Whitelisted environment names; each must be a safe identifier.
   * @param {MconfOptions} [options]
   */
  constructor(configDir, availableEnvs, options = {}) {
    if (typeof configDir !== 'string' || configDir.length === 0) {
      throw new TypeError('Mconf: configDir must be a non-empty string');
    }
    if (!Array.isArray(availableEnvs)) {
      throw new TypeError('Mconf: availableEnvs must be an array');
    }
    if (availableEnvs.length === 0) {
      throw new TypeError('Mconf: availableEnvs must contain at least one entry');
    }
    for (const name of availableEnvs) {
      assertSafeName(name, 'availableEnvs entry');
    }

    const baseEnv = options.baseEnv ?? 'production';
    const fallbackEnv = options.fallbackEnv ?? 'develop';
    assertSafeName(baseEnv, 'options.baseEnv');
    assertSafeName(fallbackEnv, 'options.fallbackEnv');

    this.configDir = configDir.replace(/[/\\]+$/, '');
    this.availableEnvs = [...availableEnvs];
    this.envName = options.envName ?? 'NODE_ENV';
    this.deepMerge = options.deepMerge ?? true;
    this.baseEnv = baseEnv;
    this.fallbackEnv = fallbackEnv;
    this.strict = Boolean(options.strict);
  }

  /**
   * Set the env var name used to detect the current environment.
   * @param {string} name
   * @returns {this}
   */
  setEnvName(name) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new TypeError('Mconf: envName must be a non-empty string');
    }
    this.envName = name;
    return this;
  }

  /**
   * Alias of {@link Mconf#setEnvName} kept for parity with older docs.
   * @param {string} name
   * @returns {this}
   */
  setEnv(name) {
    return this.setEnvName(name);
  }

  /**
   * Toggle deep-merge layering.
   * @param {boolean} deep
   * @returns {this}
   */
  setDeepMerge(deep) {
    this.deepMerge = Boolean(deep);
    return this;
  }

  /**
   * Read the current environment value from `process.env`.
   * @returns {string | undefined}
   */
  getEnvironmentFromGlobalEnv() {
    return process.env[this.envName];
  }

  /**
   * Resolve and merge configuration layers.
   * @returns {Record<string, unknown>}
   */
  getConfig() {
    const requestedEnv = this.getEnvironmentFromGlobalEnv();
    let env = requestedEnv;
    if (!this._isEnvironmentAvailable(env)) {
      if (this.strict) {
        throw new Error(
          `Mconf: environment ${JSON.stringify(requestedEnv)} is not in availableEnvs ` +
            `[${this.availableEnvs.join(', ')}]`,
        );
      }
      env = this.fallbackEnv;
    }

    const hierarchy = env === this.baseEnv ? [this.baseEnv] : [this.baseEnv, env];
    let result = {};
    for (const name of hierarchy) {
      const layer = this._loadLayer(name);
      result = this.deepMerge ? mergeDeep(result, layer) : Object.assign(result, layer);
    }
    result.environment = hierarchy[hierarchy.length - 1];
    return result;
  }

  /**
   * @param {string | undefined} environment
   * @returns {boolean}
   */
  _isEnvironmentAvailable(environment) {
    return typeof environment === 'string' && this.availableEnvs.includes(environment);
  }

  /**
   * @param {string} name
   * @returns {Record<string, unknown>}
   */
  _loadLayer(name) {
    const fullPath = path.resolve(this.configDir, name);
    let loaded;
    try {
      loaded = requireFromHere(fullPath);
    } catch (e) {
      if (e && e.code === 'MODULE_NOT_FOUND') {
        throw new Error(`Mconf: config "${name}" not found at ${fullPath}`, { cause: e });
      }
      throw new Error(
        `Mconf: failed to load config "${name}" from ${fullPath}: ${e instanceof Error ? e.message : String(e)}`,
        { cause: e },
      );
    }
    const value =
      loaded && typeof loaded === 'object' && 'default' in loaded ? loaded.default : loaded;
    if (!isPlainObject(value)) {
      throw new TypeError(
        `Mconf: config "${name}" must export a plain object, got ${describe(value)}`,
      );
    }
    return value;
  }
}

/**
 * @param {unknown} target
 * @param {Record<string, unknown>} source
 */
function mergeDeep(target, source) {
  const out = isPlainObject(target) ? target : {};
  for (const key of Object.keys(source)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    const value = source[key];
    if (isPlainObject(value)) {
      out[key] = mergeDeep(isPlainObject(out[key]) ? out[key] : {}, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * @param {unknown} name
 * @param {string} label
 */
function assertSafeName(name, label) {
  if (typeof name !== 'string' || !NAME_PATTERN.test(name)) {
    throw new TypeError(
      `Mconf: ${label} ${JSON.stringify(name)} is invalid; must match ${NAME_PATTERN}`,
    );
  }
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function describe(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
