

class TitaniumStore {

	constructor() {

		this.event = (params = {}) => {

			params = { ...params };
			delete params.stack_array;
			const result = Ti.Analytics.featureEvent(params.message, params);
			if (result === -1) {
				console.warn(`🗓️  Ti.Analytics.featureEvent - Validation Error: ${params.message}`, params);
			} else if (result === -2) {
				console.warn(`🗓️  Ti.Analytics.featureEvent - Validation Disabled: ${params.message}`, params);
			}
		};
	}

}

module.exports = TitaniumStore;
