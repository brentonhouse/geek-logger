
const levels = require(`../config/levels`);
const extras = require(`../config/extras`);
const formats = require(`../config/formats`);

const all_level_names = Object.keys(levels);
const all_extra_names = Object.keys(extras);

class Console {

	constructor({ levels = all_level_names, extras = [], default_format = formats.timestamp_message_args, level_formats = {} } = {}) {

		if (typeof default_format === `string`) {
			default_format = formats[default_format];
		}
		// console.debug(default_format);
		const levelSet = stringArrayToSet({ levels, default_format, level_formats });
		const extraSet = stringArrayToSet({ levels: extras, default_format, level_formats });

		for (const level of all_level_names) {
			// Is this log level enabled?
			if (levelSet[level]) {

				const console_level = getConsoleLevel(level);
				this[level] = args => console[console_level](levelSet[level](args));

			} else {
				this[level] =  () => {};
			}
		}

		for (const level of all_extra_names) {

			// Is this log level enabled?
			if (extraSet[level]) {

				const console_level = getConsoleLevel(level);
				this[level] = args => console[console_level](extraSet[level](args));

			} else {
				this[level] =  () => {};
			}
		}

		this.log = args => {
			console.debug(default_format(args));
		};

	}


}

module.exports = Console;

function getConsoleLevel(level = `debug`) {

	let console_level = `debug`;

	if (levels[level] <= levels.error) {
		console_level = `error`;
	} else if (levels[level] === levels.warn) {
		console_level = `warn`;
	} else if (levels[level] <= levels.info) {
		console_level = `info`;
	}

	return console_level;
}


/**
 * Returns a Set-like object with strArray's elements as keys (each with the
 * value true).
 * @param {Array} strArray - Array of Set-elements as strings.
 * @param {?string} [errMsg] - Custom error message thrown on invalid input.
 * @param strArray.levels
 * @param strArray.default_format
 * @param strArray.level_formats
 * @returns {object} - TODO: add return description.
 * @private
 */
function stringArrayToSet({ levels, default_format, level_formats }) {
	if (!levels) {
		return {};
	}

	const  errMsg = `Cannot make set from type other than Array of string elements`;

	if (!Array.isArray(levels)) {
	  throw new Error(errMsg);
	}

	return levels.reduce((set, level_name) =>  {
	  if (typeof level_name !== `string`) {
		 throw new Error(errMsg);
	  }

		set[level_name] = typeof level_formats[level_name] === `function` ? level_formats[level_name] : (formats[level_formats[level_name]] || default_format);

	  return set;
	}, {});
}
