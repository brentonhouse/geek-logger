
const levels = require(`../config/levels`);
const extras = require(`../config/extras`);

const all_level_names = Object.keys(levels);
const all_extra_names = Object.keys(extras);

class Noop {

	constructor() {

		for (const level of all_level_names) {
			this[level] = () => {};
		}

		for (const level of all_extra_names) {
			this[level] = () => {};
		}

		this.log = () => {};
	}

}

module.exports = Noop;


