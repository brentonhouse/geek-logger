

class TitaniumStore {

	constructor() {

		this.event = ({ message, level, ...args }) => {

			const result = Ti.Analytics.featureEvent(message, args);
			if (result === -1) {
				console.warn(`🗓️  Ti.Analytics.featureEvent - Validation Error: ${message}`, args);
			} else if (result === -2) {
				console.warn(`🗓️  Ti.Analytics.featureEvent - Validation Disabled: ${message}`, args);
			}
		};
	}

}

module.exports = TitaniumStore;
