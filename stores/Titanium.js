

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

		this.trace = (params = {}) => {

			params = { ...params };
			aca.leaveBreadcrumb(params.message, params);
		};

	}

}

// #region ---[ Configure ACA Adapter ]---

// ---------------------------------------------------------
//    Configure ACA Adapter
// ---------------------------------------------------------
let aca;

try {
	aca = require(`com.appcelerator.aca`);
} catch (error) {

	console.error(`Error loading module com.appcelerator.aca`, error);
	aca = {
		logHandledException: error => { console.debug(`aca.logHandledException(${error})`); },
		leaveBreadcrumb:     (breadcrumb, data) => { console.debug(`aca.leaveBreadcrumb(${breadcrumb})`); },
		setUsername:         username => { console.debug(`aca.setUsername(${username})`); },
		setMetadata:         (key, value) => { console.debug(`aca.setMetadata(${key}:${value})`); },
		setOptOutStatus:     optOutStatus => { console.debug(`aca.setOptOutStatus(${optOutStatus})`); },
		getOptOutStatus:     () => { return false; },
		setBreadcrumbLimit:  (breadcrumbLimit = 100) => { console.debug(`aca.setBreadcrumbLimit(${breadcrumbLimit})`); },
	};
}


// #endregion ---[ Configure ACA Adapter ]---

module.exports = TitaniumStore;
