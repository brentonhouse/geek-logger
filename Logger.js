'use strict';

const levels = require('./config/levels');
const extras = require('./config/extras');
const formats = require('./config/formats');

const all_level_names = Object.keys(levels);
const all_extra_names = Object.keys(extras);

const ConsoleStore = require('./stores/Console');

const micromatch = require('./micromatch');
const _ = require('lodash');

let default_logger;

class Logger {

	constructor({
		parent,
		level:max_level = levels.warn,
		stores = [ new ConsoleStore() ],
		meta,
		namespace = 'default',
	} = {}) {


		if (! (parent instanceof Logger)) {
			parent = undefined;
		} else {
			max_level = parent.max_level;
			stores = [];
		}

		this.max_level = max_level;

		this.isInstance = true;
		const executions = {};
		let metadata_base = {};
		const metadata_extra = {};
		this.stores = stores;
		let metadata_func = () => {
			return {};
		};

		this.parent = parent;
		this.namespace = namespace;

		if (this.namespace && ! all_namespaces.has(this.namespace)) {
			all_namespaces.set(this.namespace, false);
			applyFilters();
		}


		const mergeParams = params => {
			const timestamp = new Date().toISOString();
			const result = _.defaults({}, params, { namespace: this.namespace, timestamp },  metadata_extra, metadata_func(), metadata_base);
			// console.error(`🦠  mergeParams result: ${JSON.stringify(result, null, 2)}`);
			return result;

		};

		if (typeof max_level === 'string') {
			max_level = levels[max_level] || levels.warn;
		}

		if (typeof meta === 'object') {
			metadata_base = meta;
		} else if (typeof meta === 'function') {
			metadata_func = meta;
		}

		for (const level_name of all_level_names) {

			// Is this log level enabled?
			if (levels[level_name] <= max_level) {

				if (parent) {
					this[level_name] = async params => {
						params = getLogParams(params);
						const current_namespace = params.namespace || this.namespace;
						if (all_namespaces.get(current_namespace)) {
							return parent[level_name](mergeParams(params));
						} else {
							// console.warn(`skipping.  namespace is not enabled: ${current_namespace}`);
							return;
						}
					};
					continue;
				}

				executions[level_name] = [];

				for (const store of stores) {
					if (typeof store[level_name] === 'function') {
						executions[level_name].push(store[level_name]);
					}
				}

				this[level_name] = async (message, params = {}) => {

					params = getLogParams(message, params, level_name);
					const current_namespace = params.namespace || this.namespace;
					if (all_namespaces.get(current_namespace)) {
						return Promise.all(executions[level_name].map(job => job(mergeParams(params))));
					} else {
						// console.warn(`skipping.  namespace is not enabled: ${current_namespace}`);
						return;
					}
				};

			} else {
				this[level_name] =  async () => {};
			}

		}

		for (const level_name of all_extra_names) {

			if (parent) {
				this[level_name] = async params => {
					params = getLogParams(params);
					const current_namespace = params.namespace || this.namespace;
					if (all_namespaces.get(current_namespace)) {
						return parent[level_name](mergeParams(params));
					} else {
						// console.warn(`skipping.  namespace is not enabled: ${current_namespace}`);
						return;
					}
				};
				continue;
			}

			// console.error(`🔥  level_name: ${level_name}`);
			executions[level_name] = [];

			for (const store of stores) {
				if (typeof store[level_name] === 'function') {
					executions[level_name].push(store[level_name]);
				}
			}

			this[level_name] = async (message, params = {}) => {

				params = getLogParams(message, params, level_name);
				const current_namespace = params.namespace || this.namespace;
				if (all_namespaces.get(current_namespace)) {
					return Promise.all(executions[level_name].map(job => job(mergeParams(params))));
				} else {
					console.warn(`skipping.  namespace is not enabled: ${current_namespace}`);
					return;
				}
			};

		}

		if (parent) {

			this.log = async (level, message, params = {}) => {
				params = getLogLevelParams(params);
				const current_namespace = params.namespace || this.namespace;
				if (all_namespaces.get(current_namespace)) {
					return parent.log(mergeParams(params));
				} else {
					console.warn(`skipping.  namespace is not enabled: ${current_namespace}`);
				}
			};

		} else {

			this.log = async (level, message, params = {}) => {
				params = getLogLevelParams(params);

				const current_namespace = params.namespace || this.namespace;
				if (all_namespaces.get(current_namespace)) {
					return Promise.all(executions[params.level].map(job => job(mergeParams(params))));
				} else {
					console.warn(`skipping.  namespace is not enabled: ${current_namespace}`);
					return;
				}

			};
		}

		this.meta = params => {
			Object.assign(metadata_extra, params);
		};

		Object.defineProperty(this, 'metadata', {
			enumerable: true,
			get () { return mergeParams(); },
		 });

	}

}


Object.defineProperty(Logger, 'defaultLogger', {
	enumerable: true,
	get () {
		// console.debug(`🦠  default_logger: ${JSON.stringify(default_logger, null, 2)}`);
		return default_logger;
	},
	set (logger) {
		if (logger instanceof Logger) {
			default_logger = logger;
			Logger.isConfigured = true;
		} else {
			console.error('defaultLogger is not an instance of Logger');
		}
	 },
});

Object.defineProperty(Logger, 'metadata', {
	enumerable: true,
	get () {
		if (Logger.defaultLogger) {
			// console.warn(`📌  you are here → Logger.defaultLogger found`);
			return Logger.defaultLogger.metadata;
		} else {
			console.warn(`📌  you are here → Logger.defaultLogger NOT found`);
			return undefined;
		}
	},
});

Object.defineProperty(Logger, 'namespaces', {
	enumerable: true,
	get () {
		return [ ...all_namespaces.keys() ];
	},
});

Logger.meta = async (...args) => {
	if (Logger.defaultLogger) {
		return Logger.defaultLogger.meta(...args);
	}
};

for (const level_name of all_level_names.concat(all_extra_names)) {
	Logger[level_name] = async (...args) => {
		if (Logger.defaultLogger) {
			return Logger.defaultLogger[level_name](...args);
		}
	};
}

Logger.stores = {
	// TIBUG: Relative path requires broken on iOS.  TIMOB-28037
	Console:  require('./stores/Console'),
	// TIBUG: Relative path requires broken on iOS.  TIMOB-28037
	Titanium: require('./stores/Titanium'),
};

Logger.createLogger = (namespace = 'default', params = {}) => {
	params.parent = params.parent || Logger.defaultLogger;
	params.namespace = namespace;
	return new Logger(params);
};

const all_namespaces = new Map();
let namespace_filters = [];

Logger.filter = (filters = []) => {
	// console.trace(`📌  you are here → Logger.filter()`);

	if (_.isString(filters)) {
		filters = _.split(_.trim(filters), /\s*,\s*/g).filter(o => o);
	}

	if (!_.isArray(filters)) {
		//TODO: throw error?
		return;
	}

	namespace_filters = filters;
	applyFilters();
};

const getLogParams = (message = '', params = {}) => {
	if (typeof message === 'object') {
		return message;
	} else if (typeof message === 'string') {
		if (typeof params !== 'object') {
			console.warn('log params is not an object.');
			params = {};
		}
		params.message = message;
		return params;
	}

	console.warn('invalid parameters sent to Logger');
	return { message: '' };

};

const getLogLevelParams = (level, message, params = {}) => {

	if (typeof params !== 'object') {
		console.warn('log params is not an object.');
		params = {};
	}

	if (typeof message === 'string') {
		params.message = message;
	} else if (typeof message === 'object') {
		params = message;
	}

	if (typeof level === 'string') {
		params.level = level;
	} else if (typeof level === 'object') {
		params = level;
	}

	return params;

};

const applyFilters = () => {

	// console.trace(`📌  you are here → Logger.applyFilters()`);
	// console.debug(`🦠  Logger.namespaces: ${JSON.stringify(Logger.namespaces, null, 2)}`);
	// console.debug(`🦠  namespace_filters: ${JSON.stringify(namespace_filters, null, 2)}`);

	// const matches = micromatch(Logger.namespaces, namespace_filters);
	// console.debug(`🦠  matches: ${JSON.stringify(matches, null, 2)}`);

	for (const namespace of Logger.namespaces) {
		// console.debug(`🦠  namespace: ${JSON.stringify(namespace, null, 2)}`);
		// console.debug(`🦠  micromatch.all(namespace, namespace_filters): ${JSON.stringify(micromatch.all(namespace, namespace_filters), null, 2)}`);
		all_namespaces.set(namespace, micromatch.all(namespace, namespace_filters));
	}
};


Logger.isConfigured = false;

Logger.levels = levels;
Logger.extras = extras;
Logger.formats = formats;

module.exports = Logger;
