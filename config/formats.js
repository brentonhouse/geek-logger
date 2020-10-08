/* eslint-disable eqeqeq */
/* eslint-disable no-eq-null */
const ansiColors = require('ansi-colors');

// eslint-disable-next-line no-unused-vars
const { black, red, green, yellow, blue, magenta, cyan, white, gray, bold } = ansiColors;
// const colorJson = require('color-json');

const reset = '\u001b[0m';

const colors = [
	20,
	21,
	26,
	27,
	32,
	33,
	38,
	39,
	40,
	41,
	42,
	43,
	44,
	45,
	56,
	57,
	62,
	63,
	68,
	69,
	74,
	75,
	76,
	77,
	78,
	79,
	80,
	81,
	92,
	93,
	98,
	99,
	112,
	113,
	128,
	129,
	134,
	135,
	148,
	149,
	160,
	161,
	162,
	163,
	164,
	165,
	166,
	167,
	168,
	169,
	170,
	171,
	172,
	173,
	178,
	179,
	184,
	185,
	196,
	197,
	198,
	199,
	200,
	201,
	202,
	203,
	204,
	205,
	206,
	207,
	208,
	209,
	214,
	215,
	220,
	221,
];

const generateNamespaceColor = namespace => {
	let hash = 0;

	for (let i = 0; i < namespace.length; i++) {
		hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
		hash |= 0; // Convert to 32bit integer
	}
	const namespaceColor =  colors[Math.abs(hash) % colors.length];
	const colorCode = `\u001B[3${namespaceColor < 8 ? namespaceColor : `8;5;${namespaceColor}`}`;

	return text => `${colorCode};1m ${text}\u001B[0m`;
};


// const available_colors = [ black, red, green, yellow, blue, magenta, cyan ];
const namespace_colors = {};

const getNamespaceColor = namespace => {
	if (!namespace_colors[namespace]) {
		// namespace_colors[namespace] = available_colors[Math.floor(Math.random() * available_colors.length)];
		namespace_colors[namespace] = generateNamespaceColor(namespace);
	}
	return namespace_colors[namespace];
};

exports.message_only = ({ message }) => {
	return `${message}`;
};

exports.timestamp_message = ({ timestamp = new Date().toISOString(), message = '' }) => {
	return `${timestamp} - ${message}`;
};

exports.debug_message_color = ({ namespace, timestamp = new Date().toISOString(), message = '' }) => {
	const ns_color = getNamespaceColor(namespace);
	return `${reset}${ns_color(namespace)} ${gray(message)} ${ns_color(timestamp)}`;
};


exports.timestamp_message_color = ({ timestamp = new Date().toISOString(), message = '' }) => {
	return `${reset}${gray.dim(timestamp)} - ${message}`;
};


exports.timestamp_message_args = ({ level, timestamp = new Date().toISOString(), message = '', ...args } = {}) => {
	if (args == null || typeof args !== 'object' || ! Object.keys(args).length) {
		return exports.timestamp_message({ level, timestamp, message });
	}
	return `${timestamp} - ${message}\n${JSON.stringify(args, null, 2)}`;
};

exports.timestamp_message_args_color = ({ level, timestamp = new Date().toISOString(), message = '', ...args } = {}) => {
	if (args == null || typeof args !== 'object' || ! Object.keys(args).length) {
		return exports.timestamp_message_color({ level, timestamp, message });
	}
	// return `${gray.dim(timestamp)} - ${message}\n${JSON.stringify(args, null, 2)}`;
	return `${reset}${gray.dim(timestamp)} - ${message}\n${JSONC.colorify(args)}`;
};

exports.timestamp_args = ({ level, timestamp = new Date().toISOString(), ...args }) => {
	return `${timestamp} - ${JSON.stringify(args, null, 2)}`;
};

exports.events_color = (args = {}) => {
	const clone = { ...args };
	const { message = '' } = clone;

	clone.message = red.bold('Event Generated: ') + cyan(message);
	return exports.timestamp_message_args_color(clone);

};

exports.events_color_simple = (args = {}) => {
	const clone = { ...args };
	const { message = '' } = clone;
	// let extra;

	// switch (message) {
	// 	case 'screen_view':
	// 		extra = args.screen_name;
	// 		break;

	// 	case 'app_first_launch_update':
	// 		extra = args.app_previous_version;
	// 		break;

	// 	case 'toggle_beta':
	// 		extra = args.allow_beta_updates;
	// 		break;

	// 	case 'toggle_anonymous':
	// 		extra = args.anonymize_name;
	// 		break;

	// 	case 'article_open':
	// 		extra = args.article_id;
	// 		break;

	// 	case 'office_select':
	// 		extra = args.new_office_id;
	// 		break;

	// 	default:

	// }

	if (![ undefined, null ].includes(args.event_value)) {
		clone.message = `${red.bold('Event Generated:')} ${cyan(message)} -- ${green(args.event_value)}`;
	} else {
		clone.message = `${red.bold('Event Generated:')} ${cyan(message)}`;
	}

	return exports.timestamp_message_color(clone);

};

