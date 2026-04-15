// Copyright (C) 2020 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement 
// under which you licensed this source code.  
/* jslint es6 */

const templateAnimationEffects = (function () {

	"use strict";

	const effects = {
		"fadeOutUpBig": ["animate__animated", "animate__fadeOutUpBig"],
		"fadeInUpBig": ["animate__animated", "animate__fadeInUpBig"],
		"fadeOutDownBig": ["animate__animated", "animate__fadeOutDownBig"],
		"fadeInDownBig": ["animate__animated", "animate__fadeInDownBig"],
		"fadeOutUpBigFast": ["animate__animated", "animate__fadeOutUpBig", "animate__fast"],
		"fadeInUpBigFast": ["animate__animated", "animate__fadeInUpBig", "animate__fast"],
		"fadeOutDownBigFast": ["animate__animated", "animate__fadeOutDownBig", "animate__fast"],
		"fadeInDownBigFast": ["animate__animated", "animate__fadeInDownBig", "animate__fast"],
		"fadeOut": ["animate__animated", "animate__fadeOut"],
		"fadeOutSlow": ["animate__animated", "animate__fadeOut", "animate__slow"],
		"fadeIn": ["animate__animated", "animate__fadeIn"],
		"fadeInSlow": ["animate__animated", "animate__fadeIn", "animate__slow"],
		"fadeInFast": ["animate__animated", "animate__fadeIn", "animate__fast"],
		"zoomIn": ["animate__animated", "animate__zoomIn"],
		"zoomOut": ["animate__animated", "animate__zoomOut"],
		"fadeOutFast": ["animate__animated", "animate__fadeOut", "animate__fast"]
	};
	
	function setTransition(selectedElement) {
		const selectedEffect = effects.fadeIn;
		for (let i = 0; i < selectedEffect.length; i++) {
			selectedElement.classList.add(selectedEffect[i]);
		}
	}

	return {
		setTransition
	};

}());
// Copyright (C) 2020 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement 
// under which you licensed this source code.  
/* jslint es6 */

const console = (function (defaultConsole) {

	"use strict";

	// #region "Variables"
	let configurationData = {
		"allowLogging": false,
		"showIcon": false,
		"urls": {
			"ipAddress": "127.0.0.1",
			"uriProtocol": "http://",
			"portNumber": ":8008"
		},
		"logger": {
			"limit": 2500
		}
	};

	let allowLogging = false;
	let device = {
		deviceId: getUniqueID()
	};
	let logIndex = 0;
	let logs = [];
	let currentLogCounter = 0;

	let addColors = true;
	let colorType = "browser";
	let showLogIndex = true;
	let showDeviceId = true;
	let addDate = true;

	const logStyles = {
		Reset: "\x1b[0m",
		Bright: "\x1b[1m",
		Dim: "\x1b[2m",
		Underscore: "\x1b[4m",
		Blink: "\x1b[5m",
		Reverse: "\x1b[7m",
		Hidden: "\x1b[8m",
		SpaceChar: "%s"
	};

	const COLORS = {
		Black: {
			browser: "black",
			console: "\x1b[30m"
		},
		Red: {
			browser: "red",
			console: "\x1b[31m",
		},
		Green: {
			browser: "green",
			console: "\x1b[32m",
		},
		Amber: {
			browser: "orange",
			console: "\x1b[33m",
		},
		Blue: {
			browser: "blue",
			console: "\x1b[34m",
		},
		Magenta: {
			browser: "magenta",
			console: "\x1b[35m",
		},
		Cyan: {
			browser: "cyan",
			console: "\x1b[36m",
		},
		White: {
			browser: "white",
			console: "\x1b[37m"
		},
		Gray: {
			browser: "dimgray",
			console: "\x1b[37m"
		}
	};

	const logBgColors = {
		BgBlack: "\x1b[40m",
		BgRed: "\x1b[41m",
		BgGreen: "\x1b[42m",
		BgYellow: "\x1b[43m",
		BgBlue: "\x1b[44m",
		BgMagenta: "\x1b[45m",
		BgCyan: "\x1b[46m",
		BgWhite: "\x1b[47m"
	};

	const LOG_LEVELS = {
		TRACE: { type: 'trace', value: 1, color: COLORS.Black, icon: "fas fa-list-ul" },
		DEBUG: { type: 'debug', value: 2, color: COLORS.Blue, icon: "fas fa-bug" },
		LOG: { type: 'log', value: 4, color: COLORS.Gray, icon: "fas fa-user-circle" },
		INFO: { type: 'info', value: 6, color: COLORS.Green, icon: "fas fa-info-circle" },
		WARN: { type: 'warn', value: 9, color: COLORS.Amber, icon: "fas fa-exclamation-triangle" },
		ERROR: { type: 'error', value: 13, color: COLORS.Red, icon: "fas fa-times-circle" }
	};

	let logLevel = LOG_LEVELS.TRACE;
	let logLevelCountObj = {};
	logLevelCountObj[LOG_LEVELS.TRACE.type] = 0;
	logLevelCountObj[LOG_LEVELS.DEBUG.type] = 0;
	logLevelCountObj[LOG_LEVELS.LOG.type] = 0;
	logLevelCountObj[LOG_LEVELS.INFO.type] = 0;
	logLevelCountObj[LOG_LEVELS.WARN.type] = 0;
	logLevelCountObj[LOG_LEVELS.ERROR.type] = 0;

	// #endregion 

	/**
	 * Returns Urls
	 */
	function getUrls() {
		return configurationData.urls;
	}

	function getLoggerLimit() {
		return configurationData.logger.limit;
	}

	/**
	 * Returns icon based on iconName and iconType
	 * @param {*} iconName 
	 * @param {*} iconType 
	 */
	function getConfigIcon(iconName, iconType) {
		if (!iconName) {
			iconName = 'Swirl'; // defaulting to swirl if no icon name is present
		}
		return configurationData.iconMapping[iconName][iconType];
	}

	/**
	 * Sets the configuration data object.
	 * @param {*} resp 
	 */
	function setData(resp) {
		configurationData = resp;
	}

	/**
	 * Returns the configuration data object.
	 */
	function getConfigurationSettings() {
		return configurationData;
	}

	/**
	 * Wrapper over console.log to allow controlling this based on config.
	 */
	function initialize() {
		allowLogging = false;
		const configData = getConfigurationSettings();
		if (configData) {
			allowLogging = configData.allowLogging;
		}
		CrComLib.publishEvent('b', 'logsbtn.show', configData.showIcon);
		// CrComLib.subscribeState('s', `console.log`, (v) => {
		// 	if()
		//   // console.log("****");
		//   // avfUtility.log(`console.log: ${v}`);
		// });
	}

	function getUniqueID() {
		// Declare a digits variable which stores all digits 
		const digits = '0123456789';
		let OTP = '';
		for (let i = 0; i < 6; i++) {
			OTP += digits[Math.floor(Math.random() * 10)];
		}
		return OTP;
	}

	/**
	 * 
	 * @param {*} logLevelInput 
	 * @param  {...any} input 
	 */
	function internalLog(logLevelInput, ...input) {
		if (allowLogging === true && logLevel.value <= logLevelInput.value) {
			const outputLog = [];
			let outputString = "";
			const dateForLog = new Date().toISOString();

			if (showLogIndex === true) {
				outputString += "%c" + (logIndex) + ') ';
			}
			if (showDeviceId === true) {
				outputString += "%c" + device.deviceId + " - ";
			}
			if (addDate === true) {
				outputString += "%c" + dateForLog + ": ";
			}
			if (addColors === true) {
				if (colorType === "browser") {
					for (let i = 0; i < input.length; i++) {
						//outputString += "%c" + input[i] + " ";
						outputLog.push(input[i]);
					}
					// outputLog.push(outputString);

					// if (showLogIndex === true) {
					//   outputLog.push("color:" + logLevelInput.color.browser);
					// }
					// if (showDeviceId === true) {
					//   outputLog.push("color:" + logLevelInput.color.browser);
					// }
					// if (addDate === true) {
					//   outputLog.push("color:" + logLevelInput.color.browser);
					// }
					// for (let i = 0; i < input.length; i++) {
					//   outputLog.push("color:" + logLevelInput.color.browser);
					// }
					defaultConsole[logLevelInput.type](...outputLog);
				} else if (colorType === "console") {
					defaultConsole[logLevelInput.type](logLevelInput.color.console, ...input, logStyles.Reset);
				} else {
					defaultConsole[logLevelInput.type](...input);
				}
			} else {
				defaultConsole[logLevelInput.type](...input);
			}
			const newLog = { index: logIndex, date: dateForLog, logLevel: logLevelInput, value: input, mergedValue: input.join(" ") };
			incrementLogTypeBasedCount(logLevelInput.type);
			logs.push(newLog);

			// if (templateLogsModule) {
			// 	templateLogsModule.setNewLog(newLog);
			// }
			CrComLib.publishEvent('b', 'console-log-new', true);

			// Rags - later
			// const logLimit = getLoggerLimit();
			// if (logs.length > logLimit) {
			// 	logs.splice(0, 1); // removing the first log from array whenever a new log gets added
			// }

			logIndex += 1;
		} else {
			defaultConsole[logLevelInput.type](...input);
		}
	}

	/**
	 * Function to track log type separately
	 * @param {log type for tracking count} logType 
	 */
	function incrementLogTypeBasedCount(logType) {
		if (!logLevelCountObj.hasOwnProperty(logType)) {
			logLevelCountObj[logType] = 0;
		}
		logLevelCountObj[logType] = parseInt(logLevelCountObj[logType]) + 1;
	}

	function getDeviceDetails() {
		return device;
	}

	/**
	* 
	*/
	function getFullLogs() {
		let output = [];
		try {
			output = (logs) ? JSON.parse(JSON.stringify(logs)) : [];
		} catch {
			output = logs ? logs : [];
		}
		return output;
	}

	function getLogs() {
		let output = [];
		try {
			output = (logs) ? JSON.parse(JSON.stringify(logs)) : [];
		} catch {
			output = logs ? logs : [];
		}
		return output.slice(currentLogCounter, output.length);
	}

	/**
	 * Function to get the complete logger object count-wise
	 */
	function getLogTypeCountDetails() {
		return logLevelCountObj;
	}

	function resetLogLevelCountObj() {
		logLevelCountObj[LOG_LEVELS.TRACE.type] = 0;
		logLevelCountObj[LOG_LEVELS.DEBUG.type] = 0;
		logLevelCountObj[LOG_LEVELS.LOG.type] = 0;
		logLevelCountObj[LOG_LEVELS.INFO.type] = 0;
		logLevelCountObj[LOG_LEVELS.WARN.type] = 0;
		logLevelCountObj[LOG_LEVELS.ERROR.type] = 0;
		return logLevelCountObj;
	}

	/**
	 * 
	 */
	function clearLogs() {
		currentLogCounter = logs.length;
		// logs = [];

		resetLogLevelCountObj();
	}

	/**
	 * 
	 * @param  {...any} input 
	 */
	function debug(...input) {
		internalLog(LOG_LEVELS.DEBUG, ...input);
		// defaultConsole.debug(...input);
	}

	/**
	 * 
	 * @param  {...any} input 
	 */
	function log(...input) {
		internalLog(LOG_LEVELS.LOG, ...input);
		// defaultConsole.log(...input);
	}

	/**
	 * 
	 * @param  {...any} input 
	 */
	function warn(...input) {
		internalLog(LOG_LEVELS.WARN, ...input);
		// defaultConsole.warn(...input);
	}

	/**
	 * 
	 * @param  {...any} input 
	 */
	function error(...input) {
		internalLog(LOG_LEVELS.ERROR, ...input);
		// defaultConsole.error(...input);
	}

	/**
	 * 
	 * @param  {...any} input 
	 */
	function info(...input) {
		internalLog(LOG_LEVELS.INFO, ...input);
		// defaultConsole.info(...input);
	}

	/**
	 * 
	 * @param  {...any} input 
	 */
	function trace(...input) {
		internalLog(LOG_LEVELS.TRACE, ...input);
		// defaultConsole.trace(...input);
	}

	function getCurrentLogCounter() {
		return currentLogCounter;
	}
	/**
	 * Throw any error raised
	 * @param {any} err
	 */
	function onErr(err) {
		error(err);
		throw err;
	}

	return {
		LOG_LEVELS,
		initialize,
		warn,
		error,
		debug,
		info,
		trace,
		log,
		clearLogs,
		getLogs,
		getFullLogs,
		getDeviceDetails,
		getLogTypeCountDetails,
		resetLogLevelCountObj,
		setData,
		getConfigurationSettings,
		getConfigIcon,
		getUrls,
		getLoggerLimit,
		getCurrentLogCounter
	};

}(window.console));

//Then redefine the old console
window.console = console;
/*jslint es6 */
/*global CrComLib, projectConfigModule, navigationModule, templatePageModule, translateModule, serviceModule, utilsModule, templateAppLoaderModule, templateVersionInfoModule */

const hardButtonsModule = (() => {
	'use strict';

	let repeatDigitalInterval = null;
	const REPEAT_DIGITAL_PERIOD = 200;
	const MAX_REPEAT_DIGITALS = 30000 / REPEAT_DIGITAL_PERIOD;

	let currentDevice = "";
	let currentPage = "";
	let clickedOnPage = "";

	/* 
	1. Find all unique signal names
	2. Subscribe state for all signals
	2.1. Create logic as per subscription
	*/
	function getAllSignals(hardButtonsArray) {
		const signalNames = [];
		for (let i = 0; i < hardButtonsArray.project.signals.length; i++) {
			const projectSignal = hardButtonsArray.project.signals[i];
			const signalFound = signalNames.find(signal => signal.signalName === projectSignal.hardButtonSignal);
			if (!signalFound) {
				signalNames.push({
					signalName: projectSignal.hardButtonSignal,
					isReady: false
				});
			}
		}
		for (let j = 0; j < hardButtonsArray.project.pages.length; j++) {
			const projectPage = hardButtonsArray.project.pages[j];
			for (let i = 0; i < projectPage.signals.length; i++) {
				const projectSignal = projectPage.signals[i];
				const signalFound = signalNames.find(signal => signal.signalName === projectSignal.hardButtonSignal);
				if (!signalFound) {
					signalNames.push({
						signalName: projectSignal.hardButtonSignal,
						isReady: false
					});
				}
			}
		}
		for (let k = 0; k < hardButtonsArray.project.devices.length; k++) {
			const projectDevice = hardButtonsArray.project.devices[k];
			for (let i = 0; i < projectDevice.signals.length; i++) {
				const projectSignal = projectDevice.signals[i];
				const signalFound = signalNames.find(signal => signal.signalName === projectSignal.hardButtonSignal);
				if (!signalFound) {
					signalNames.push({
						signalName: projectSignal.hardButtonSignal,
						isReady: false
					});
				}
			}
			for (let j = 0; j < projectDevice.pages.length; j++) {
				const projectPage = projectDevice.pages[j];
				for (let i = 0; i < projectPage.signals.length; i++) {
					const projectSignal = projectPage.signals[i];
					const signalFound = signalNames.find(signal => signal.signalName === projectSignal.hardButtonSignal);
					if (!signalFound) {
						signalNames.push({
							signalName: projectSignal.hardButtonSignal,
							isReady: false
						});
					}
				}
			}
		}
		return signalNames;
	}

	function initialize(deviceNameInput) {
		currentDevice = deviceNameInput;

		return new Promise((resolve, reject) => {
			serviceModule.loadJSON("./assets/data/hard-buttons.json", (dataResponse) => {
				const hardButtonData = JSON.parse(dataResponse);
				const signalNames = getAllSignals(hardButtonData);
				utilsModule.log("signalNames", signalNames);
				for (let i = 0; i < signalNames.length; i++) {
					const iteratedSignal = signalNames[i];
					CrComLib.subscribeState('b', iteratedSignal.signalName, (response) => {
						utilsModule.log("CrComLib.subscribeState: ", iteratedSignal.signalName, response, clickedOnPage);
						if (clickedOnPage !== "" || response === true) {
							if (response === true) {
								clickedOnPage = navigationModule.selectedPage();
							}
							hardButtonClicked(hardButtonData, iteratedSignal.signalName, response);
						}
					});
				}
				resolve(true);
			}, error => {
				console.error("Error in Hard Buttons", error);
				reject(false);
			});
		});
	}

	function hardButtonClicked(hardButtonsArray, signal, response) {
		/* Priority is 
			(a) Device level page (if user is on the selected page)
			(b) Device level
			(c) Project level page (if user is on the selected page)
			(d) Project level
		*/
		currentPage = navigationModule.selectedPage();

		let signalValue = "";
		let navigationPageName = "";

		for (let i = 0; i < hardButtonsArray.project.signals.length; i++) {
			const selectedSignal = hardButtonsArray.project.signals[i];
			if (selectedSignal.hardButtonSignal === signal) {
				if (selectedSignal.navigationPageName !== "") {
					navigationPageName = selectedSignal.navigationPageName;
				}
				if (selectedSignal.digitalJoin !== "") {
					signalValue = selectedSignal.digitalJoin;
				}
			}
		}
		for (let j = 0; j < hardButtonsArray.project.pages.length; j++) {
			const selectedPage = hardButtonsArray.project.pages[j];
			if (selectedPage.pageName === clickedOnPage) {
				for (let i = 0; i < selectedPage.signals.length; i++) {
					const selectedSignal = selectedPage.signals[i];
					if (selectedSignal.hardButtonSignal === signal) {
						if (selectedSignal.navigationPageName !== "") {
							navigationPageName = selectedSignal.navigationPageName;
						}
						if (selectedSignal.digitalJoin !== "") {
							signalValue = selectedSignal.digitalJoin;
						}
					}
				}
			}
		}
		for (let k = 0; k < hardButtonsArray.project.devices.length; k++) {
			const selectedDevice = hardButtonsArray.project.devices[k];
			if (selectedDevice.deviceName === currentDevice) {
				for (let i = 0; i < selectedDevice.signals.length; i++) {
					const selectedSignal = selectedDevice.signals[i];
					if (selectedSignal.hardButtonSignal === signal) {
						if (selectedSignal.navigationPageName !== "") {
							navigationPageName = selectedSignal.navigationPageName;
						}
						if (selectedSignal.digitalJoin !== "") {
							signalValue = selectedSignal.digitalJoin;
						}
					}
				}
				for (let j = 0; j < selectedDevice.pages.length; j++) {
					const selectedPage = selectedDevice.pages[j];
					if (selectedPage.pageName === clickedOnPage) {
						for (let i = 0; i < selectedPage.signals.length; i++) {
							const selectedSignal = selectedPage.signals[i];
							if (selectedSignal.hardButtonSignal === signal) {
								if (selectedSignal.navigationPageName !== "") {
									navigationPageName = selectedSignal.navigationPageName;
								}
								if (selectedSignal.digitalJoin !== "") {
									signalValue = selectedSignal.digitalJoin;
								}
							}
						}
					}
				}
			}
		}

		utilsModule.log("signalValue: ", signalValue);
		utilsModule.log("navigationPageName: ", navigationPageName);
		if (navigationPageName !== "") {
			if (response === true) {
				utilsModule.log("currentPage.toLowerCase().trim(): ", currentPage.toLowerCase().trim());
				utilsModule.log("navigationPageName.toLowerCase().trim(): ", navigationPageName.toLowerCase().trim());
				if (currentPage.toLowerCase().trim() !== navigationPageName.toLowerCase().trim()) {
					templatePageModule.navigateTriggerViewByPageName(navigationPageName);
				}
			}
		}
		if (signalValue != "") {
			if (response === true) {
				CrComLib.publishEvent('b', signalValue, response);
				if (repeatDigitalInterval !== null) {
					window.clearInterval(repeatDigitalInterval);
				}
				let numRepeatDigitals = 0;
				repeatDigitalInterval = window.setInterval(() => {
					utilsModule.log("Prioritized signal name: ", signalValue, ' for response ', response);
					CrComLib.publishEvent('b', signalValue, response);
					if (++numRepeatDigitals >= MAX_REPEAT_DIGITALS) {
						console.warn("Hard Button MAXIMUM Repeat digitals sent");
						window.clearInterval(repeatDigitalInterval);
						CrComLib.publishEvent('b', signalValue, !response);
						if (repeatDigitalInterval !== null) {
							window.clearInterval(repeatDigitalInterval);
						}
					}
				}, REPEAT_DIGITAL_PERIOD);
			} else {
				if (repeatDigitalInterval !== null) {
					window.clearInterval(repeatDigitalInterval);
				}
				CrComLib.publishEvent('b', signalValue, response);
			}
		}
	}

	return {
		initialize
	};

})();/*jslint es6 */
/*global CrComLib, projectConfigModule, templatePageModule, translateModule, serviceModule, utilsModule, templateAppLoaderModule, templateVersionInfoModule */

const navigationModule = (() => {
	'use strict';

	let _pageName = "";

	function goToPage(pageName) {
		const navigationPages = projectConfigModule.getAllPages();
		const pageObject = navigationPages.find(page => page.pageName === pageName);
		templateAppLoaderModule.showLoading(pageObject);
		const routeId = pageObject.pageName + "-import-page";
		const listOfPages = projectConfigModule.getNavigationPages();
		for (let i = 0; i < listOfPages.length; i++) {
			if (routeId !== listOfPages[i].pageName + "-import-page") {
				CrComLib.publishEvent('b', listOfPages[i].pageName + "-import-page-show", false);
			}
		}

		// setTimeout required because hiding is not happening instantaneously with show. Show comes first sometimes.
		setTimeout(() => {
			if (!templateAppLoaderModule.isCachePageLoaded(routeId)) {
				if (document.getElementById(routeId)) {
					const url = pageObject.fullPath + pageObject.fileName;
					document.getElementById(routeId).setAttribute("url", url);
				}
				CrComLib.publishEvent('b', routeId + '-show', true);
			}
			// LOADING INDICATOR - Uncomment the below line along with code in template-page.js file to enable loading indicator
			// CrComLib.publishEvent('b', routeId + '-show-app-loader', false);
			templatePageModule.hideLoading(pageObject); // TODO - check - fix with mutations called in callbackforhideloading

			_pageName = pageName;
			// Allow components and pages to be transitioned
			let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:' + pageObject.pageName + '-import-page', (value) => {
				if (value['loaded']) {
					const setTimeoutDelay = pageObject.preloadPage ? 0 : CrComLib.isCrestronTouchscreen() ? 300 : 50;
					setTimeout(() => updateDiagnosticsOnPageChange(pageObject.pageName), setTimeoutDelay);
					setTimeout(() => {
						CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:' + pageObject.pageName + '-import-page', loadedSubId);
						loadedSubId = '';
					});
				}
			});
		}, 50);
	}

	function selectedPage() {
		return _pageName;
	}

	function updateDiagnosticsOnPageChange(pageName) {
		projectConfigModule.projectConfigData().then((projectConfigResponse) => {
			const pageImporterElement = document.getElementById(pageName + '-import-page');
			if (!pageImporterElement) return;

			// Table Count Updation
			templateVersionInfoModule.tableCount[pageName] = CrComLib.countNumberOfCh5Components(pageImporterElement);
			templateVersionInfoModule.tableCount[pageName].domNodes = pageImporterElement.getElementsByTagName('*').length;

			// Current Page Table Row Updation

			// Diagnostic Info Count Updation
			let totalDomCount = 0;
			let totalComponentsCount = 0;
			let currentCh5ComponentsCount = 0;
			const listOfPages = projectConfigModule.getNavigationPages();
			listOfPages.forEach((page) => totalDomCount += templateVersionInfoModule.tableCount[`${page.pageName}`]?.domNodes || 0);
			listOfPages.forEach((page) => totalComponentsCount += templateVersionInfoModule.tableCount[`${page.pageName}`]?.total || 0);
			listOfPages.forEach(page => {
				const pageImporterElement = document.getElementById(page.pageName + '-import-page');
				if (pageImporterElement) currentCh5ComponentsCount += CrComLib.countNumberOfCh5Components(pageImporterElement)?.total || 0;
			});

			// Updating Table Count for Add Log
			templateVersionInfoModule.componentCount.totalDomCount = totalDomCount;
			templateVersionInfoModule.componentCount.totalComponentsCount = totalComponentsCount;
			templateVersionInfoModule.componentCount.currentCh5Components = currentCh5ComponentsCount;
		});
	}

	return {
		goToPage,
		selectedPage,
		updateDiagnosticsOnPageChange
	};

})();
/* global CrComLib, serviceModule, utilsModule */

const projectConfigModule = (() => {
	'use strict';

	/**
	 * All public and local properties
	 */
	let projectConfigJson = null;
	let appMainfestJson = null;

	/**
	 * This method is used to fetch project-config.json file
	 */
	function readProjectConfigJsonFromFile() {
		return new Promise((resolve, reject) => {
			serviceModule.loadJSON("./assets/data/project-config.json", (dataResponse) => {
				projectConfigJson = JSON.parse(dataResponse);
				CrComLib.publishEvent("o", "shell-project-config", projectConfigJson);
				resolve(projectConfigJson);
			}, error => {
				reject(error);
			});
		});
	}

	/**
	 * This method is used to fetch project-config.json file
	 */
	function readAppManifestJsonFromFile() {
		return new Promise((resolve, reject) => {
			serviceModule.loadJSON("./assets/data/app.manifest.json", (dataResponse) => {
				appMainfestJson = JSON.parse(dataResponse);
				resolve(appMainfestJson);
			}, error => {
				reject(error);
			});
		});
	}

	function getAllStandAloneViewPages() {
		return projectConfigJson.content.pages.filter((pageObj) => {
			return (!utilsModule.isValidObject(pageObj.navigation) && pageObj.standAloneView === true);
		});
	}

	function defaultActiveViewIndex() {
		let activeView = 0; //set the default
		if (projectConfigJson.content.$defaultView === "undefined" && projectConfigJson.content.$defaultView.trim() === "") {
			return activeView;
		}

		let seqObject = projectConfigModule.getNavigationPages();
		for (let i = 0; i < seqObject.length; i++) {
			if (seqObject[i].pageName.trim().toLowerCase() === projectConfigJson.content.$defaultView.trim().toLowerCase()) {
				activeView = i;
				break;
			}
		}
		return activeView;
	}

	function getMenuOrientation() {
		return projectConfigJson.menuOrientation;
	}

	function getNonNavigationPages() {
		return projectConfigJson.content.pages.filter(page => page.navigation === undefined);
	}

	function getNavigationPages() {
		return projectConfigJson.content.pages.filter(page => page.navigation !== undefined).sort(utilsModule.dynamicSort("asc", "navigation", "sequence"));
	}

	function getAllPages() {
		return projectConfigJson.content.pages;
	}

	function getCustomPageUrl(pageName) {
		if (pageName && pageName !== "") {
			const page = projectConfigModule.getNonNavigationPages().find(page => page.pageName === pageName);
			return page.fullPath + page.fileName;
		} else {
			return "";
		}
	}

	function getCustomFooterUrl() {
		return getCustomPageUrl(projectConfigJson.footer.$component);
	}

	function getCustomHeaderUrl() {
		return getCustomPageUrl(projectConfigJson.header.$component);
	}

	async function projectConfigData() {
		if (projectConfigJson !== null) {
			return projectConfigJson;
		} else {
			// wait until the promise returns us a value
			const result = await readProjectConfigJsonFromFile();
			return result;
		}
	}

	async function appMainfestData() {
		if (appMainfestJson !== null) {
			return appMainfestJson;
		} else {
			// wait until the promise returns us a value
			const result = await readAppManifestJsonFromFile();
			return result;
		}
	}

	/**
	 * All public method and properties exporting here
	 */
	return {
		getAllPages,
		projectConfigData,
		appMainfestData,
		getNavigationPages,
		getNonNavigationPages,
		getAllStandAloneViewPages,
		defaultActiveViewIndex,
		getCustomHeaderUrl,
		getCustomFooterUrl,
		getMenuOrientation
	};

})();
// Copyright (C) 2022 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement 
// under which you licensed this source code.

/* global CrComLib, WebXPanel, webXPanelModule */

const serviceModule = (() => {
  'use strict';
  /**
   * All public and local(prefix '_') properties
   */
  let ch5Emulator = CrComLib.Ch5Emulator.getInstance();
  let useWebXPanel;
  let initialized = false;
  let noControlSystemEmulatorScenarios = [];

  /**
   * This is public method so that we can use in other module also
   * @param {string} url pass json file path
   * @param {object} callback method to get the json response
   */
  function loadJSON(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        callback(xhr.responseText);
      }
    };
    xhr.send(null);
  }

  /**
   * This is public method to init the emulator
   * @param {object} emulator pass your emulator response
   */
  function initEmulator(emulator) {
    CrComLib.Ch5Emulator.clear();
    ch5Emulator = CrComLib.Ch5Emulator.getInstance();
    ch5Emulator.loadScenario(emulator);
    ch5Emulator.run();
  }

  /**
   * Load Emulator Json
   * @param {string} url 
   */
  function newJsonLoad(url) {
    // Create new promise with the Promise() constructor;
    // This has as its argument a function with two parameters, resolve and reject
    return new Promise(function (resolve, reject) {
      // Standard XHR to load an image
      let request = new XMLHttpRequest();
      request.open("GET", url);
      request.responseType = "json";
      // When the request loads, check whether it was successful
      request.onload = function () {
        if (request.status === 200 || request.response !== null) {
          // If successful, resolve the promise by passing back the request response
          resolve(request.response);
        } else {
          // If it fails, reject the promise with a error message
          reject(new Error("Json didn't load successfully; error code:" + request.statusText));
        }
      };
      request.onerror = function () {
        // Also deal with the case when the entire request fails to begin with
        // This is probably a network error, so reject the promise with an appropriate message
        reject(new Error("There was a network error."));
      };
      // Send the request
      request.send();
    });
  }

  function promisifyLoadJSON(url) {
    return new Promise(function (resolve, reject) {
      let xhr = new XMLHttpRequest();
      xhr.overrideMimeType("application/json");
      xhr.open("GET", url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          resolve(xhr.responseText);
        }
      };
      xhr.send(null);
    });
  }

  /**
   * Adding Emulator Scenario only when not running in a Crestron Touch screen
   * @param {string} url 
   */
  function addEmulatorScenarioNoControlSystem(url) {
    noControlSystemEmulatorScenarios.push(url);
    if (initialized) {
      setTimeout(drainQueuedNoControlSystemEmulatorScenarios);
    }
  }

  /**
   * Adding Emulator Scenario
   * @param {string} url 
   */
  function addEmulatorScenario(url) {
    promisifyLoadJSON(url).then(
      (scenario) => {
        if (scenario !== null) {
          scenario = JSON.parse(scenario);
          ch5Emulator.loadScenario(scenario);
          ch5Emulator.run();
        }
      },
      (err) => {
        console.error("Could not load url as json file:" + url, err);
      }
    );
  }

  function initialize(projectConfigResponse) {
    initialized = true;
    useWebXPanel = projectConfigResponse.useWebXPanel;
    drainQueuedNoControlSystemEmulatorScenarios();
  }

  function drainQueuedNoControlSystemEmulatorScenarios() {
    // CrComLib.isCrestronTouchscreen() will return true when running on TSW and mobile
    // WebXPanel.isActive will return true when when WebXPanel library can attach to control system 
    // useWebXPanel is true when project-config.json 
    // configures to use web xpanel to connect to control system using webxpanel library

    // apply scenario only 
    // not running on TSW and either No XPanel loaded or XPanel disabled 
    if (!CrComLib.isCrestronTouchscreen()
      && ((typeof WebXPanel == 'undefined' || !WebXPanel.isActive) || !useWebXPanel)) {
      for (let index = 0; index < noControlSystemEmulatorScenarios.length; index++) {
        const url = noControlSystemEmulatorScenarios[index];
        addEmulatorScenario(url);
      }
      noControlSystemEmulatorScenarios = [];
    }
  }

  /**
   * All public method and properties exporting here
   */
  return {
    initialize,
    loadJSON,
    promisifyLoadJSON,
    initEmulator,
    addEmulatorScenario,
    addEmulatorScenarioNoControlSystem
  };

})();
// Copyright (C) 2022 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement 
// under which you licensed this source code.
/* global CrComLib, serviceModule, utilsModule */

const translateModule = (() => {
  'use strict';

  /**
   * All public and local properties
   */
  const langData = [];
  const crComLibTranslator = CrComLib.translationFactory.translator;
  const DEFAULT_LANGUAGE = "en";
  let currentLanguage = "en";
  let languageToSet = "";
  let isTranslationLoaded = false;

  /**
   * This is public method to fetch language data(JSON).
   * @param {string} lng is language code string like en, fr etc...
   */

  function getLanguage(lng) {
    return new Promise((resolve, reject) => {
      if (langData[lng]) {
        console.log("Exists", langData[lng]);
        resolve();
      } else {
        let output = {};
        loadJSON("./app/project/assets/data/translation/", lng).then((responseProject) => {
          output = utilsModule.mergeJSON(output, responseProject);
          loadJSON("./app/template/assets/data/translation/", lng).then((responseTemplate) => {
            output = utilsModule.mergeJSON(output, responseTemplate);
            langData[lng] = {
              translation: output,
            };
            resolve();
          }).catch(() => {
            loadJSON("./app/template/assets/data/translation/", DEFAULT_LANGUAGE).then((responseTemplate) => {
              output = utilsModule.mergeJSON(output, responseTemplate);
              langData[lng] = {
                translation: output,
              };
              resolve();
            }).catch(() => {
              output = utilsModule.mergeJSON(output, responseTemplate);
              langData[lng] = {
                translation: output,
              };
              resolve();
            });
          });
        }).catch(() => {
          // No project json exists
          loadJSON("./app/template/assets/data/translation/", lng).then((responseTemplate) => {
            output = utilsModule.mergeJSON(output, responseTemplate);
            langData[lng] = {
              translation: output,
            };
            resolve();
          }).catch(() => {
            loadJSON("./app/template/assets/data/translation/", DEFAULT_LANGUAGE).then((responseTemplate) => {
              output = utilsModule.mergeJSON(output, responseTemplate);
              langData[lng] = {
                translation: output,
              };
              resolve();
            }).catch(() => {
              reject("Missing template files");
            });
          });
        });
      }
    });
  }

  function initializeDefaultLanguage() {
    return new Promise((resolve) => {
      if (!isTranslationLoaded) {
        projectConfigModule.projectConfigData().then((projectConfigResponse) => {
          const receiveStateLanguage = projectConfigResponse.customSignals.receiveStateLanguage || "template-language";
          const sendEventLanguage = projectConfigResponse.customSignals.sendEventLanguage || "template-language";
          CrComLib.subscribeState("s", receiveStateLanguage, (value) => {
            if (!(value && value !== "")) {
              value = DEFAULT_LANGUAGE;
            }
            setLanguage(value, receiveStateLanguage, sendEventLanguage).then(() => {
              isTranslationLoaded = true;
              resolve();
            });
          });
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 
   * @param {String} keyInput 
   * @param {Object} values 
   */
  function translateInstant(keyInput, values) {
    try {
      return crComLibTranslator.t(keyInput, values);
    } catch (e) {
      return keyInput[0];
    }
  }

  function loadJSON(path, lng) {
    return new Promise((resolve, reject) => {
      const url = path + lng + ".json";
      serviceModule.promisifyLoadJSON(url)
        .then((response) => {
          resolve(JSON.parse(response));
        }).catch(() => {
          reject("No File Found");
        });
    });
  }

  /**
   * Set the language
   * @param {string} lng
   */
  function setLanguage(lng, receiveStateLanguage, sendEventLanguage) {
    return new Promise((resolve) => {
      getLanguage(lng).then(() => {
        crComLibTranslator.changeLanguage(lng);
        currentLanguage = lng;
        const responseArrayForNavPages = projectConfigModule.getNavigationPages();
        for (let i = 0; i < responseArrayForNavPages.length; i++) {
          const menu = document.getElementById("menu-list-id-" + i);
          if (menu) {
            if (responseArrayForNavPages[i].navigation.isI18nLabel === true) {
              menu.setAttribute("label", translateModule.translateInstant(responseArrayForNavPages[i].navigation.label));
            } else {
              menu.setAttribute("label", responseArrayForNavPages[i].navigation.label);
            }
          }
        }
        if (receiveStateLanguage !== sendEventLanguage && sendEventLanguage?.trim()) {
          if (lng !== languageToSet) { // Required since this will address multiple send requests.
            languageToSet = lng;
            CrComLib.publishEvent('s', sendEventLanguage, lng);
          }
        }
        resolve();
      });
    });
  }

  /**
   * This is private method to init ch5 i18next translate library
   */
  function initCh5LibTranslate() {
    CrComLib.registerTranslationInterface(crComLibTranslator, "-+", "+-");
    crComLibTranslator.init({
      fallbackLng: "en",
      language: currentLanguage,
      debug: true,
      resources: langData,
    });
  }

  /**
   * All public or private methods which need to call on init
   */
  initCh5LibTranslate();

  /**
   * All public method and properties exporting here
   */
  return {
    initializeDefaultLanguage,
    translateInstant
  };
})();// Copyright (C) 2022 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement 
// under which you licensed this source code.
/*global CrComLib */

const utilsModule = (() => {
  "use strict";

  const allowLogging = false; // Set this to true for manual debugging

  function log(...input) {
    if (allowLogging === true) {
      console.log(...input);
    }
  }

  function isObject(value) {
		return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Function);
	}

  /**
   * Merge the object into the target object
   * @param  {...any} args 
   */
  function mergeJSON(...args) {
    let target = {};
    // Loop through each object and conduct a merge
    for (let i = 0; i < args.length; i++) {
      target = merger(target, args[i]);
    }
    return target;
  }

  function merger(target, obj) {
    for (let prop in obj) {
      // eslint-disable-next-line no-prototype-builtins
      if (obj.hasOwnProperty(prop)) {
        if (Object.prototype.toString.call(obj[prop]) === '[object Object]') {
          // If we're doing a deep merge and the property is an object
          target[prop] = mergeJSON(target[prop], obj[prop]);
        } else {
          // Otherwise, do a regular merge
          target[prop] = obj[prop];
        }
      }
    }
    return target;
  }

  function dynamicSort(order, ...property) {
    let sort_order = 1;
    if (order === "desc") {
      sort_order = -1;
    }
    return function (a, b) {
      if (property.length > 1) {
        let propA = a[property[0]];
        let propB = b[property[0]];
        for (let i = 1; i < property.length; i++) {
          propA = propA[property[i]];
          propB = propB[property[i]];
        }
        // a should come before b in the sorted order
        if (propA < propB) {
          return -1 * sort_order;
          // a should come after b in the sorted order
        } else if (propA > propB) {
          return 1 * sort_order;
          // a and b are the same
        } else {
          return 0 * sort_order;
        }
      } else {
        // a should come before b in the sorted order
        if (a[property] < b[property]) {
          return -1 * sort_order;
          // a should come after b in the sorted order
        } else if (a[property] > b[property]) {
          return 1 * sort_order;
          // a and b are the same
        } else {
          return 0 * sort_order;
        }
      }
    }
  }

  /**
   * Is object empty
   * @param {object} input 
   */
  function isValidInput(input) {
    if (typeof input === 'number') {
      return true;
    } else if (typeof input === 'string') {
      if (input && input.trim() !== "") {
        return true;
      } else {
        return false;
      }
    } else if (typeof input === 'boolean') {
      return true;
    } else if (typeof input === 'object') {
      if (input) {
        return true;
      } else {
        return false;
      }
    } else if (typeof input === 'undefined') {
      return false;
    } else {
      return false;
    }
  }

  /**
   * Check whether object exists
   * @param {object} input 
   */
  function isValidObject(input) {
    if (!input || Object.keys(input).length === 0 || !isValidInput(input)) {
      return false;
    } else {
      return true;
    }
  }

  /*
   * Get an object value from a specific path
   * @param  {Object}       obj  The object
   * @param  {String|Array} path The path
   * @param  {*}            def  A default value to return [optional]
   * @return {*}                 The value
   */
  function getContent(obj, path, def) {
    /**
     * If the path is a string, convert it to an array
     * @param  {String|Array} path The path
     * @return {Array}             The path array
     */
    const stringToPath = function (path) {
      // If the path isn't a string, return it
      if (typeof path !== 'string') {
        return path;
      } else {
        const output = [];
        path.split('.').forEach(function (item) {
          // Split to an array with bracket notation
          item.split(/\[([^}]+)\]/g).forEach(function (key) {
            // Push to the new array
            if (key.length > 0) {
              output.push(key);
            }
          });
        });
        return output;
      }
    };

    // Get the path as an array
    path = stringToPath(path);

    // Cache the current object
    let current = obj;

    // For each item in the path, dig into the object
    for (let i = 0; i < path.length; i++) {
      // If the item isn't found, return the default (or null)
      if (!current[path[i]]) return def;
      // Otherwise, update the current  value
      current = current[path[i]];
    }
    return current;
  }

  /*
   * Replaces placeholders with real content
   * @param {String} template The template string
   * @param {String} local    A local placeholder to use, if any
   */
  function replacePlaceHolders(template, data) {
    // Check if the template is a string or a function
    template = typeof (template) === 'function' ? template() : template;
    if (['string', 'number'].indexOf(typeof template) === -1) throw 'Please provide a valid template';
    // If no data, return template as-is
    if (!data) return template;
    // Replace our curly braces with data
    template = template.replace(/\{\{([^}]+)\}\}/g, function (match) {
      // Remove the wrapping curly braces
      match = match.slice(2, -2);
      // Get the value
      const val = getContent(data, match.trim());
      // Replace
      if (!val) return '{{' + match + '}}';
      return val;
    });
    return template;
  }

  function replaceAll(str, find, replace) {
		if (str && String(str).trim() !== "") {
			return String(str).split(find).join(replace);
		} else {
			return str;
		}
	}

  function debounce(func, timeout = 300) {
		let timer;
		return (...args) => {
			clearTimeout(timer);
			timer = setTimeout(() => { func.apply(this, args); }, timeout);
		};
	}

	function generateOTP() {
		// Declare a digits variable which stores all digits 
		const digits = '0123456789';
		let OTP = '';
		for (let i = 0; i < 6; i++) {
			OTP += digits[Math.floor(Math.random() * 10)];
		}
		return OTP;
	}

	function isValidURL(inputStr = '') {
		const input = inputStr.toLowerCase();
		let isValidURLEntry = false;
		if ((input !== "")) {
			const colonCount = (input.match(/:/g) === null) ? 0 : input.match(/:/g).length; // storing colon count if its valid
			let ipExp = /^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$/;
			let hostExp = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;
			let httpCheck = (input.indexOf('http://') > -1 || input.indexOf('https://') > -1);
			let checkPortNo = ((colonCount === 0 && !httpCheck) || (colonCount === 1 && httpCheck));
			let dataArr = input.split(':');
			let valueToTestEntry = (httpCheck) ? dataArr[1] : dataArr[0];
			valueToTestEntry = valueToTestEntry.replace(/\//g, '');
			// if a valid count of colon is found, check for valid port number
			if (colonCount == 1 || colonCount == 2) {
				if ((httpCheck && colonCount == 2) ||
					(!httpCheck && colonCount == 1)) {
					let portNo = parseInt(dataArr[dataArr.length - 1]);
					// check if port number is a valid number and lies between 1025 and 65335
					checkPortNo = (!isNaN(portNo) && portNo > 1024 && portNo < 65536);
				}
			}
			isValidURLEntry = (
				checkPortNo &&
				valueToTestEntry !== null &&
				valueToTestEntry !== undefined &&
				valueToTestEntry !== "0.0.0.0" &&
				valueToTestEntry !== "255.255.255.255" &&
				valueToTestEntry.length <= 127 &&
				(ipExp.test(valueToTestEntry) || hostExp.test(valueToTestEntry))
			)
		}
		return isValidURLEntry;
	}

  return {
    log,
    debounce,
    dynamicSort,
    isValidObject,
    isValidInput,
    mergeJSON,
    replacePlaceHolders,
    replaceAll,
    isObject,
    isValidURL,
    generateOTP
  };
  
})();
// Copyright (C) 2022 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code. 

/* global WebXPanel, translateModule*/

var webXPanelModule = (function () {
  "use strict";

  const config = {
    "host": window.location.hostname,
    "port": 49200,
    "roomId": "",
    "ipId": "0x03",
    "tokenSource": "",
    "tokenUrl": "",
    "authToken": ""
  };

  const RENDER_STATUS = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    hide: 'hide',
    loading: 'loading'
  };

  // var status;
  const pcConfig = config;
  const urlConfig = config;
  let connectParams = config;
  let invalidAuthToken = false;
  let alertPopUpShown = false;

  /**
   * Set status bar current state - hidden being default
   * @param {*} classNameToAdd
   */
  function setStatus(classNameToAdd = RENDER_STATUS.hide) {
    let preloader = document.getElementById('pageStatusIdentifier');
    if (preloader) {
      preloader.className = classNameToAdd;
    }
  }

  /**
   * Get WebXPanel configuration present in project-config.json
   */
  function getWebXPanelConfiguration(projectConfig) {
    if (projectConfig.config && projectConfig.config.controlSystem) {
      pcConfig.host = projectConfig.config.controlSystem.host || config.host;
      pcConfig.port = projectConfig.config.controlSystem.port || config.port;
      pcConfig.roomId = projectConfig.config.controlSystem.roomId || config.roomId;
      pcConfig.ipId = projectConfig.config.controlSystem.ipId || config.ipId;
      pcConfig.tokenSource = projectConfig.config.controlSystem.tokenSource || config.tokenSource;
      pcConfig.tokenUrl = projectConfig.config.controlSystem.tokenUrl || config.tokenUrl;
    }
  }

  /**
   * Convert the URL search params from string to object
   * The key should be in lowercase.
   * @param {object} entries
   * @returns
   */
  function paramsToObject() {
    const urlString = window.location.href;
    const urlParams = new URL(urlString);
    const params = new URLSearchParams(urlParams.search);
    const result = {}
    for (const [key, value] of params) {
      result[key.toLowerCase()] = value;
    }
    return result;
  }

  /**
   * Get the url params if defined.
   */
  function getWebXPanelUrlParams() {

    const entries = paramsToObject();

    // default host should be the IP address of the PC
    urlConfig.host = entries["host"] || pcConfig.host;
    urlConfig.port = entries["port"] || pcConfig.port;
    urlConfig.roomId = entries["roomid"] || pcConfig.roomId;
    urlConfig.ipId = entries["ipid"] || pcConfig.ipId;
    urlConfig.tokenSource = entries["tokensource"] || pcConfig.tokenSource;
    urlConfig.tokenUrl = entries["tokenurl"] || pcConfig.tokenUrl;
    urlConfig.authToken = entries["authtoken"];
  }

  /**
   * Set the listeners for WebXPanel
   */
  function setWebXPanelListeners() {
    // A successful WebSocket connection has been established
    WebXPanel.default.addEventListener(WebXPanel.WebXPanelEvents.CONNECT_WS, (event) => {
      updateInfoStatus("app.webxpanel.status.CONNECT_WS");
    });

    WebXPanel.default.addEventListener(WebXPanel.WebXPanelEvents.DISCONNECT_CIP, (msg) => {
      updateInfoStatus("app.webxpanel.status.DISCONNECT_CIP");
      displayConnectionWarning();
    });

    WebXPanel.default.addEventListener(WebXPanel.WebXPanelEvents.ERROR_WS, (msg) => {
      updateInfoStatus("app.webxpanel.status.ERROR_WS");
      displayConnectionWarning();
    });

    WebXPanel.default.addEventListener(WebXPanel.WebXPanelEvents.AUTHENTICATION_FAILED, (msg) => {
      updateInfoStatus("app.webxpanel.status.AUTHENTICATION_FAILED");
      displayConnectionWarning();
    });

    WebXPanel.default.addEventListener(WebXPanel.WebXPanelEvents.AUTHENTICATION_REQUIRED, (msg) => {
      updateInfoStatus("app.webxpanel.status.AUTHENTICATION_REQUIRED");
      displayConnectionWarning();
    });

    WebXPanel.default.addEventListener(WebXPanel.WebXPanelEvents.FETCH_TOKEN_FAILED, (msg) => {
      if (msg.detail && msg.status) {
        let statusMsgPrefix = translateModule.translateInstant("app.webxpanel.statusmessageprefix");
        const status = document.querySelector('#webxpanel-tab-content .connection .status');
        if (status !== null) {
          status.innerHTML = statusMsgPrefix + msg.detail.status + " " + msg.detail.statusText;
        }
      } else {
        updateInfoStatus("app.webxpanel.status.FETCH_TOKEN_FAILED");
      }
      displayConnectionWarning();
    });

    WebXPanel.default.addEventListener(WebXPanel.WebXPanelEvents.CONNECT_CIP, (msg) => {
      setStatus(RENDER_STATUS.success);
      removeConnectionWarning();

      // Hide the bar after 10 seconds
      setTimeout(() => {
        setStatus(RENDER_STATUS.hide);
      }, 10000);
      updateInfoStatus("app.webxpanel.status.CONNECT_CIP");

      const cs = document.querySelector('#webxpanel-tab-content .connection .cs');
      const ipId = document.querySelector('#webxpanel-tab-content .connection .ipid');
      const roomId = document.querySelector('#webxpanel-tab-content .connection .roomid');
      cs.textContent = `CS: wss://${connectParams.host}:${connectParams.port}`;
      ipId.textContent = `IPID: ${urlConfig.ipId}`;
      if (msg.detail.roomId !== "") { roomId.textContent = `Room Id: ${msg.detail.roomId}`; }
    });

    // Authorization
    WebXPanel.default.addEventListener(WebXPanel.WebXPanelEvents.NOT_AUTHORIZED, ({ detail }) => {
      const redirectURL = detail.redirectTo;
      updateInfoStatus("app.webxpanel.status.NOT_AUTHORIZED");

      setTimeout(() => {
        console.log("redirecting to " + redirectURL);
        window.location.replace(redirectURL);
      }, 3000);
    });
  }

  /**
   * Update info status if Info icon is enabled
   */
  function updateInfoStatus(statusMessageKey) {
    let statusMsgPrefix = translateModule.translateInstant("app.webxpanel.statusmessageprefix");
    let statusMessage = translateModule.translateInstant(statusMessageKey);
    if (statusMessage === 'DISCONNECTED' && urlConfig.authToken && !alertPopUpShown) {
      alertPopUpShown = true;
      invalidAuthToken = true;
    }
    if (statusMessage) {
      const status = document.querySelector('#webxpanel-tab-content .connection .status');
      if (status !== null) {
        status.innerHTML = statusMsgPrefix + statusMessage;
      }
    }
  }

  /**
   * Show the badge on the info icon for connection status.
   */
  function displayConnectionWarning() {
    const infoBtn = document.getElementById("infobtn");
    if (infoBtn) {
      infoBtn.classList.add("warn");
    }
  }

  /**
   * Remove the badge on the info icon.
   */
  function removeConnectionWarning() {
    const infoBtn = document.getElementById("infobtn");
    if (infoBtn) {
      infoBtn.classList.remove("warn");
    }
  }

  /**
   * Show WebXPanel connection status
   */
  function webXPanelConnectionStatus() {
    //Display the connection animation on the header bar
    setStatus(RENDER_STATUS.loading);

    // Hide the animation after 30 seconds
    setTimeout(() => {
      setStatus(RENDER_STATUS.hide);
    }, 30000);
  }


  /**
   * Connect to the control system through websocket connection.
   * Show the status in the header bar using CSS animation.
   * @param {object} projectConfig
   */
  function connectWebXPanel(projectConfig) {
    connectParams = config;
    // status = document.querySelector('#webxpanel-tab-content .connection .status');

    webXPanelConnectionStatus();
    // Merge the configuration params, params of the URL takes precedence
    getWebXPanelConfiguration(projectConfig);
    getWebXPanelUrlParams();

    // Assign the combined configuration
    connectParams = urlConfig;

    WebXPanel.default.initialize(connectParams);

    updateInfoStatus("app.webxpanel.status.CONNECT_WS");

    const cs = document.querySelector('#webxpanel-tab-content .connection .cs');
    const ipId = document.querySelector('#webxpanel-tab-content .connection .ipid');
    const roomId = document.querySelector('#webxpanel-tab-content .connection .roomid');
    if (connectParams.host !== "") {
      cs.textContent = `CS: wss://${connectParams.host}:${connectParams.port}`;
    }
    if (connectParams.ipId !== "") {
      ipId.textContent = `IPID: ${Number(connectParams.ipId).toString(16)}`;
    }
    if (connectParams.roomId !== "") {
      roomId.textContent = `Room Id: ${connectParams.roomId}`;
    }

    // WebXPanel listeners are called in the below method
    setWebXPanelListeners();
  }

  /**
   * Initialize WebXPanel
   */
  function connect(projectConfig) {
    // Connect only in browser environment
    if (typeof WebXPanel !== "undefined" && WebXPanel.isActive) {
      connectWebXPanel(projectConfig);
    } else {
      return;
    }
  }

  function getWebXPanel(isBrowser) {
    const Panel = WebXPanel.getWebXPanel(isBrowser);
    WebXPanel = { ...Panel, default: Panel.WebXPanel };
  }

  function isAuthTokenValid() {
    return invalidAuthToken;
  }

  /**
   * All public method and properties exporting here
   */
  return {
    connect,
    getWebXPanel,
    paramsToObject,
    isAuthTokenValid
  };

})();
/*jslint es6 */
/*global CrComLib, webXPanelModule, hardButtonsModule, templateVersionInfoModule, projectConfigModule, featureModule, templateAppLoaderModule, translateModule, serviceModule, utilsModule, navigationModule */

const templatePageModule = (() => {
	'use strict';

	let triggerview = null;
	let horizontalMenuSwiperThumb = null;
	let selectedPage = { name: "" };
	let totalPreloadPage = 0;
	let preloadPageLoaded = 0;
	let firstLoad = false;
	let pageLoadTimeout = 2000;
	let isWebXPanelInitialized = false; // avoid calling connection method multiple times


	/**
	 * This is public method for bottom navigation to navigate to next page
	 * @param {number} idx is selected index for navigate to appropriate page
	 */
	function navigateTriggerViewByPageName(pageName) {
		// If the previous and selected page are same then exit
		if (pageName !== selectedPage.pageName) {
			const pageList = projectConfigModule.getNavigationPages();
			const pageObject = projectConfigModule.getNavigationPages().find(page => page.pageName === pageName);
			const oldPage = JSON.parse(JSON.stringify(selectedPage));
			// Loop and set url and receiveStateUrl based on proper preload and cachePage values
			if (oldPage.preloadPage === true && oldPage.cachePage === false) {
				const htmlImportSnippet = document.getElementById(oldPage.pageName + "-import-page");
				htmlImportSnippet.removeAttribute("url");
				htmlImportSnippet.setAttribute("receiveStateShow", oldPage.pageName + "-import-page-show");
				htmlImportSnippet.setAttribute("noShowType", "remove");
			} else if (oldPage.preloadPage === false && oldPage.cachePage === true) {
				const htmlImportSnippet = document.getElementById(oldPage.pageName + "-import-page");
				htmlImportSnippet.removeAttribute("receiveStateShow");
				if (htmlImportSnippet.hasAttribute("url") === false || !htmlImportSnippet.getAttribute("url") || htmlImportSnippet.getAttribute("url") === "") {
					htmlImportSnippet.setAttribute("url", oldPage.fullPath + oldPage.fileName);
				}
				htmlImportSnippet.setAttribute("noShowType", "display");
			}
			CrComLib.publishEvent("b", "active_state_class_" + oldPage.pageName, false);
			selectedPage = JSON.parse(JSON.stringify(pageObject));
			CrComLib.publishEvent("b", "active_state_class_" + selectedPage.pageName, true);
			if (triggerview !== null) {
				const activeIndex = projectConfigModule.getNavigationPages().findIndex(data => data.pageName === pageName);
				const prevIndex = projectConfigModule.getNavigationPages().findIndex(data => data.pageName === oldPage.pageName);
				// On first load, hide all pages except for the default page.
				/* if (prevIndex < 0) {
					hideInactivePages(activeIndex);
				} else {
					const page = triggerview.childrenOfCurrentNode[activeIndex].childrenOfCurrentNode[0].childrenOfCurrentNode[0];
					page.classList.remove('ch5-hide-vis');
				} */
				// Add animation to the page when exiting the viewport.
				const subscriptionHtmlSnippetPrevIndex = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:' + pageList[prevIndex]?.pageName + '-import-page', (value) => {
					if (value['loaded']) {
						if (triggerview.allowPageAnimation() &&
							projectConfigModule.getNavigationPages()[prevIndex]?.cachePage &&
							(projectConfigModule.getNavigationPages()[prevIndex]?.animation?.transitionIn || projectConfigModule.getNavigationPages()[prevIndex]?.animation?.transitionOut) &&
							triggerview.childrenOfCurrentNode[prevIndex]?.childrenOfCurrentNode[0] &&
							triggerview.childrenOfCurrentNode[prevIndex]?.childrenOfCurrentNode[0].childrenOfCurrentNode[0]) {  //&& prevIndex !== -1) {
							addAnimationClass(prevIndex, 'OUT');
						}
						setTimeout(() => {
							CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:' + pageList[prevIndex]?.pageName + '-import-page', subscriptionHtmlSnippetPrevIndex);
						});
					}
				});

				try {
					// menuMoveInViewPort();

					if (projectConfigModule.getMenuOrientation() === "horizontal" || projectConfigModule.getMenuOrientation() === "vertical") {
						let intersectionOptions = {
							rootMargin: '0px',
							threshold: 1.0
						};
						const intersectionObserver = new IntersectionObserver((entries, observer) => {
							entries.forEach(entry => {
								if (entry.isIntersecting === false) {
									CrComLib.publishEvent("n", "scrollToMenu", activeIndex);
								}
							});
							intersectionObserver.unobserve(document.getElementById('menu-list-id-' + activeIndex));
						}, intersectionOptions);
						intersectionObserver.observe(document.getElementById('menu-list-id-' + activeIndex));
						// intersectionObserver.unobserve(document.getElementById('menu-list-id-' + activeIndex));
					}
					triggerview.setActiveView(activeIndex);
				} catch (e) {
					console.error(e);
				}
				// Add animation to the page when entering the viewport.
				const subscriptionHtmlSnippet = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:' + pageList[activeIndex]?.pageName + '-import-page', (value) => {
					if (value['loaded']) {
						if (triggerview.allowPageAnimation() &&
							projectConfigModule.getNavigationPages()[activeIndex]?.cachePage &&
							(projectConfigModule.getNavigationPages()[activeIndex]?.animation?.transitionIn || projectConfigModule.getNavigationPages()[activeIndex]?.animation?.transitionOut) &&
							triggerview.childrenOfCurrentNode[activeIndex]?.childrenOfCurrentNode[0] &&
							triggerview.childrenOfCurrentNode[activeIndex]?.childrenOfCurrentNode[0].childrenOfCurrentNode[0]) {
							addAnimationClass(activeIndex, 'IN');
						}
						setTimeout(() => {
							CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:' + pageList[activeIndex]?.pageName + '-import-page', subscriptionHtmlSnippet);
						});
					}
				});
			}
			navigationModule.goToPage(pageName);
		}
	}
	// for scrollbar issue CH5C-28535
	function resizeWindow(event) {
		window.dispatchEvent(new Event('resize'));
		removeEventListener(event.target);
	}

	function removeEventListener(ele) {
		ele.removeEventListener('animationend', resizeWindow);
	}


	function hideInactivePages(activeIndex) {
		const subscriptions = [];
		const pageList = projectConfigModule.getNavigationPages();
		for (let i = 0; i < pageList.length; i++) {
			if (activeIndex !== i && pageList[i].preloadPage === true) { // The hide class is only needed for pages with preloading true.
				const subscriptionHtmlSnippet = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:' + pageList[i].pageName + '-import-page', (value) => {
					// console.log(pageList[i].pageName + ' --> ' + value['loaded']);
					if (value['loaded']) {
						const page = triggerview.childrenOfCurrentNode[i].childrenOfCurrentNode[0].childrenOfCurrentNode[0];
						//page.classList.add('ch5-hide-vis');
						setTimeout(() => {
							CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:' + pageList[i].pageName + '-import-page', subscriptions[i]);
						});
					}
				});
				subscriptions.push(subscriptionHtmlSnippet);
			} else if (pageList[activeIndex]?.animation?.transitionIn && pageList[activeIndex].cachePage) { // for scrollbar issue CH5C-28535
				const subscriptionHtmlSnippet1 = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:' + pageList[i].pageName + '-import-page', (value) => {
					if (value['loaded']) {
						const page = triggerview.childrenOfCurrentNode[activeIndex]?.childrenOfCurrentNode[0]?.childrenOfCurrentNode[0];
						page?.addEventListener('animationend', resizeWindow);
						setTimeout(() => {
							CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:' + pageList[i].pageName + '-import-page', subscriptionHtmlSnippet1);
						});
					}
				});
			}
		}
	}

	function addAnimationClass(pageIndex, type) {

		const pageData = projectConfigModule.getNavigationPages()[pageIndex];
		const ch5triggerViewChild = triggerview.childrenOfCurrentNode[pageIndex];
		const page = triggerview.childrenOfCurrentNode[pageIndex].childrenOfCurrentNode[0].childrenOfCurrentNode[0];

		if (pageData?.animation?.transitionIn in CrComLib.transitionIneffects || pageData?.animation?.transitionOut in CrComLib.transitionOuteffects) {
			page.style.setProperty('--animate-duration', pageData?.animation?.transitionDuration ? pageData?.animation?.transitionDuration : '1s');
			page.style.setProperty('--animate-delay', pageData?.animation?.transitionDelay ? pageData?.animation?.transitionDelay : '0s');
		}
		if (type === 'OUT') {
			CrComLib.removeTransition(page, pageData?.animation?.transitionIn, 'IN');
			page.classList.remove("ch5-hide-vis", "page-height-vh");
			if (pageData?.animation?.transitionOut && (pageData?.animation?.transitionOut in CrComLib.transitionOuteffects)) {
				CrComLib.setTransition(page, pageData.animation.transitionOut, 'OUT');
				ch5triggerViewChild.classList.add('ch5-show-vis-position');
				page.classList.add('page-height-vh');
			}
		} else {
			CrComLib.removeTransition(page, pageData?.animation?.transitionOut, 'OUT');
			page.classList.remove("ch5-hide-vis", "page-height-vh");
			ch5triggerViewChild.classList.remove('ch5-show-vis-position');
			if (pageData?.animation?.transitionIn && (pageData?.animation?.transitionIn in CrComLib.transitionIneffects)) {
				CrComLib.setTransition(page, pageData.animation.transitionIn, 'IN');
			}
		}
	}

	function menuMoveInViewPort() {
		// 	// TODO: Subscribe and unsubscribe to avoid unwanted scrolls
		// 	// if (response.menuOrientation === 'horizontal') { // || response.menuOrientation === 'vertical') {
		// CrComLib.subscribeInViewPortChange(document.getElementById('menu-list-id-' + activeIndex), (element, isInViewPort) => {
		// 	if (!isInViewPort) {
		// 		console.log("Publishing now", activeIndex);
		// 		CrComLib.publishEvent("n", "scrollToMenu", activeIndex);
		// 	}
		// 	// setTimeout(() => {
		// 	CrComLib.unSubscribeInViewPortChange(document.getElementById('menu-list-id-' + activeIndex));
		// 	// });
		// });
	}

	function setMenuActive() {
		// if (triggerview !== null) {
		// 	if (response.menuOrientation === 'horizontal') { // || response.menuOrientation === 'vertical') {
		// 		CrComLib.publishEvent("n", "scrollToMenu", activeIndex);
		// 	}
		// }
	}

	function navigateTriggerViewByIndex(index) {
		const listOfPages = projectConfigModule.getNavigationPages();
		if (listOfPages.length > 0 && index >= 0 && index <= listOfPages.length) {
			navigateTriggerViewByPageName(listOfPages[index].pageName);
		}
	}

	/**
	 * This is public method to show/hide bottom navigation in smaller screen
	 */
	function openThumbNav() {
		const horizontalMenuSwiperThumb = document.getElementById("horizontal-menu-swiper-thumb");
		horizontalMenuSwiperThumb.className += " open";
		event.stopPropagation();
	}

	/**
	 * This is public method to toggle left navigation sidebar
	 */
	function toggleSidebar() {
		let sidebarToggle = document.getElementById("sidebarToggle");
		if (sidebarToggle) {
			sidebarToggle.classList.toggle("active");
		}
		let navbarThumb = document.querySelector(".swiper-thumb");
		if (navbarThumb) {
			navbarThumb.classList.toggle("open");
		}
	}

	/**
	 * This method will invoke on body click
	 */
	document.body.addEventListener("click", function (event) {
		triggerview = document.querySelector(".triggerview");
		horizontalMenuSwiperThumb = document.getElementById("horizontal-menu-swiper-thumb");

		if (event.target.id === "sidebarToggle") {
			event.stopPropagation();
		} else {
			let navbarThumb = document.querySelector(".swiper-thumb");
			if (navbarThumb) {
				navbarThumb.classList.remove("open");
			}
			if (horizontalMenuSwiperThumb) {
				horizontalMenuSwiperThumb.classList.remove("open");
			}
			let sidebarToggle = document.getElementById("sidebarToggle");
			if (sidebarToggle) {
				sidebarToggle.classList.remove("active");
			}
		}
	});

	/**
	 * Load the emulator, theme, default language and listeners
	 */
	let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:template-page-import-page', (value) => {
		if (value['loaded']) {
			triggerview = document.querySelector(".triggerview");
			horizontalMenuSwiperThumb = document.getElementById("horizontal-menu-swiper-thumb");

			projectConfigModule.appMainfestData().then((appManifestResponse) => {
				projectConfigModule.projectConfigData().then((projectConfigResponse) => {
					translateModule.initializeDefaultLanguage().then(() => {
						/* Note: You can uncomment below line to enable remote logger.
						 * Refer below documentation link to know more about remote logger.
						 * https://sdkcon78221.crestron.com/sdk/Crestron_HTML5UI/Content/Topics/UI-Remote-Logger.htm
						 */
						// templateRemoteLoggerSettingsModule.setRemoteLoggerConfig(serverIPAddress, serverPortNumber);
						serviceModule.initialize(projectConfigResponse);
						console.initialize();

						// Changes for index.html - Start
						// console.log("appManifestResponse", appManifestResponse["ch5"]["crComLib"], appManifestResponse["ch5"]["ch5Theme"], appManifestResponse["ch5"]["ch5WebXPanel"]);
						// console.log("appManifestResponse", appManifestResponse["ch5"]["crComLib"], appManifestResponse["ch5"]["ch5Theme"], "rags", [{a:1,b: {a:1, b:2}}]);
						const cacheBustVersion = "?v=" + appManifestResponse["ch5"]["ch5Theme"]["version"];
						document.getElementById("favicon").setAttribute("href", projectConfigResponse.faviconPath);
						document.getElementById("shellTemplateSelectedThemeCss").setAttribute("href", "./assets/css/ch5-theme.css" + cacheBustVersion);
						document.getElementById("externalCss").setAttribute("href", "./assets/css/external.css" + cacheBustVersion);

						const widgetsAndStandalonePages = document.getElementById("widgets-and-standalone-pages");
						const widgets = projectConfigResponse.content.widgets;
						for (let i = 0; i < widgets.length; i++) {
							const htmlImportSnippet = document.createElement("ch5-import-htmlsnippet");
							htmlImportSnippet.setAttribute("id", widgets[i].widgetName + "-import-widget");
							htmlImportSnippet.setAttribute("url", widgets[i].fullPath + widgets[i].fileName);
							htmlImportSnippet.setAttribute("show", "false");
							widgetsAndStandalonePages.appendChild(htmlImportSnippet);
						}

						const standAlonePages = projectConfigModule.getAllStandAloneViewPages();
						for (let i = 0; i < standAlonePages.length; i++) {
							const htmlImportSnippet = document.createElement("ch5-import-htmlsnippet");
							htmlImportSnippet.setAttribute("id", standAlonePages[i].pageName + "-import-page");
							htmlImportSnippet.setAttribute("url", standAlonePages[i].fullPath + standAlonePages[i].fileName);
							htmlImportSnippet.setAttribute("show", "false");
							widgetsAndStandalonePages.appendChild(htmlImportSnippet);
						}
						// Changes for index.html - End

						// Header
						if (projectConfigResponse.header.display === true) {
							let dataHeader = "";
							if (projectConfigResponse.header.$component && projectConfigResponse.header.$component !== "") {
								dataHeader = document.getElementById("header-section-page-template2").innerHTML;
							} else {
								dataHeader = document.getElementById("header-section-page-template1").innerHTML;
							}

							const app = document.getElementById('header-section-page');
							const mergedJsonContentHeader = utilsModule.mergeJSON(projectConfigResponse, {
								customHeaderUrl: projectConfigModule.getCustomHeaderUrl()
							});
							app.innerHTML = utilsModule.replacePlaceHolders(dataHeader, mergedJsonContentHeader);

							let sidebarToggle = document.getElementById("sidebarToggle");
							if (projectConfigResponse.menuOrientation === "vertical") {
								if (sidebarToggle) {
									sidebarToggle.classList.remove("display-none");
								}
							} else {
								if (sidebarToggle) {
									if (!sidebarToggle.classList.contains("display-none")) {
										sidebarToggle.classList.add("display-none");
									}
								}
							}

							if (projectConfigResponse.header.$component === "") {
								const headerSectionPageSet1 = document.getElementById('header-section-page-set1');
								headerSectionPageSet1.innerHTML = utilsModule.replacePlaceHolders(document.getElementById("header-section-page-template1-set1").innerHTML, mergedJsonContentHeader);
							}
						} else {
							document.getElementById("header-index-page").remove();
						}

						// Content
						const appContent = document.getElementById('content-index-page');
						let data = "";
						if (projectConfigResponse.menuOrientation === "horizontal") {
							data = document.getElementById("template-content-page-section-horizontal").innerHTML;
						} else if (projectConfigResponse.menuOrientation === "vertical") {
							data = document.getElementById("template-content-page-section-vertical").innerHTML;
						} else {
							data = document.getElementById("template-content-page-section-none").innerHTML;
						}

						const mergedJsonContent = utilsModule.mergeJSON(projectConfigResponse, {});
						appContent.innerHTML += utilsModule.replacePlaceHolders(data, mergedJsonContent);

						const pagesList = projectConfigModule.getNavigationPages();
						pagesList.forEach(e => { if (e.preloadPage) { totalPreloadPage++; } })
						if (projectConfigResponse.menuOrientation === "horizontal") {
							document.getElementById("horizontal-menu-swiper-thumb")?.setAttribute("size", pagesList.length);
						} else if (projectConfigResponse.menuOrientation === "vertical") {
							document.getElementById("vertical-menu-swiper-thumb")?.setAttribute("size", pagesList.length);
						}

						let triggerviewInContent = "";
						if (projectConfigResponse.menuOrientation === "horizontal") {
							triggerviewInContent = document.getElementById("triggerviewInContentHorizontal");
						} else if (projectConfigResponse.menuOrientation === "vertical") {
							triggerviewInContent = document.getElementById("triggerviewInContentVertical");
						} else {
							triggerviewInContent = document.getElementById("triggerviewInContentNone");
						}
						if (triggerviewInContent) {
							const tgViewProperties = projectConfigResponse.content.triggerViewProperties;
							if (tgViewProperties) {
								Object.entries(tgViewProperties).forEach(([key, value]) => {
									triggerviewInContent.setAttribute(key, value);
								});
							}

							for (let i = 0; i < pagesList.length; i++) {
								const childNodeTriggerView = document.createElement("ch5-triggerview-child");
								const tgViewChildProperties = projectConfigResponse.content.pages[i].triggerViewChildProperties;
								if (tgViewChildProperties) {
									Object.entries(tgViewChildProperties).forEach(([key, value]) => {
										childNodeTriggerView.setAttribute(key, value);
									});
								}

								/*
								// LOADING INDICATOR - Uncomment the below lines along with code in navigation.js file to enable loading indicator
								const htmlImportSnippetForLoader = document.createElement("ch5-import-htmlsnippet");
								htmlImportSnippetForLoader.setAttribute("id", pagesList[i].pageName + "-import-page-app-loader");
								htmlImportSnippetForLoader.setAttribute("receiveStateShow", pagesList[i].pageName + "-import-page-show-app-loader");
								htmlImportSnippetForLoader.setAttribute("url", "./app/template/components/widgets/template-app-loader/template-app-loader.html");							
								*/

								const htmlImportSnippet = document.createElement("ch5-import-htmlsnippet");
								htmlImportSnippet.setAttribute("id", pagesList[i].pageName + "-import-page");

								/*
								preloadPage: FALSE + cachedPage: FALSE (Default setting)
									* page is not loaded on startup - load time is only during first time page is called
									* page is not cached - each time user comes to the page, the page is loaded, and unloaded when user leaves the page.
								preloadPage: FALSE + cachedPage: TRUE
									* page is not loaded on startup - load time is only during the time page is called. Since page is cached, load time is only for first time.
									* page is cached - load time is whenever the user opens the page. Each time user comes to the page, the page is available already and there is no page load time. Even after user leaves the page, the page is not removed from DOM and is always available. DOM weight for project is high because of this feature.
								preloadPage: TRUE + cachedPage: FALSE
									* page is loaded on startup - load time is during first time page is called
									* page is not cached - each time user comes to the page, the page is loaded, and unloaded when user leaves the page. However, since the page is loaded for first time, the page will not be removed from DOM unless user visits the page atleast once. Once the user visits the page, and leaves the page, the page is removed from DOM. After user leaves the page, the load time is during each page call again.
								preloadPage: TRUE + cachedPage: TRUE
									* page is loaded on startup - load time is during first time page is called
									* page is cached - load time is during the project load. Each time user comes to the page, the page is available already and there is no page load time. Even after user leaves the page, the page is not removed from DOM and is always available. DOM weight for project is high because of this feature.
								*/
								if (CrComLib.isCrestronTouchscreen()) {
									pageLoadTimeout = 15000;
								}

								if (pagesList[i].preloadPage === true) {
									// We need the below becos there is a flicker when page loads and hides if url is set - specifically with signal sent
									setTimeout(() => {
										htmlImportSnippet.setAttribute("url", pagesList[i].fullPath + pagesList[i].fileName);
										preloadPageLoaded++;
									}, pageLoadTimeout);
									htmlImportSnippet.setAttribute("noShowType", "display");
								} else {
									htmlImportSnippet.setAttribute("receiveStateShow", pagesList[i].pageName + "-import-page-show");
									if (pagesList[i].cachePage === true) {
										htmlImportSnippet.setAttribute("noShowType", "display");
									} else {
										htmlImportSnippet.setAttribute("noShowType", "remove");
									}
								}

								// LOADING INDICATOR - Uncomment the below line along with code in navigation.js file to enable loading indicator
								// childNodeTriggerView.appendChild(htmlImportSnippetForLoader);
								childNodeTriggerView.appendChild(htmlImportSnippet);
								triggerviewInContent.appendChild(childNodeTriggerView);
							}
							triggerviewInContent.setAttribute("activeview", projectConfigModule.defaultActiveViewIndex());
							triggerview = triggerviewInContent;
						}

						// Footer
						if (projectConfigResponse.footer.display === true) {
							const appFooter = document.getElementById('footer-section-page');
							let dataFooter = "";
							if (projectConfigResponse.footer.$component && projectConfigResponse.footer.$component !== "") {
								dataFooter = document.getElementById("footer-section-page-template2").innerHTML;
							} else {
								dataFooter = document.getElementById("footer-section-page-template1").innerHTML;
							}

							const mergedJsonContentFooter = utilsModule.mergeJSON(projectConfigResponse, {
								copyrightYear: (new Date()).getFullYear(),
								customFooterUrl: projectConfigModule.getCustomFooterUrl()
							});
							appFooter.innerHTML = utilsModule.replacePlaceHolders(dataFooter, mergedJsonContentFooter);
						} else {
							document.getElementById("footer-index-page").remove();
						}

						if (triggerview) {
							triggerview.addEventListener("select", (event) => {
								const listOfPages = projectConfigModule.getNavigationPages();
								if (listOfPages.length > 0 && event.detail !== undefined && listOfPages[event.detail].pageName !== selectedPage.pageName) {
									navigateTriggerViewByIndex(event.detail);
								}
							});
						}

						CrComLib.subscribeState('s', 'Csig.Product_Name_Text_Join_fb', (deviceSpecificData) => {
							hardButtonsModule.initialize(deviceSpecificData).then(() => {
								let responseArrayForNavPages = projectConfigModule.getNavigationPages();
								if (projectConfigResponse.menuOrientation === "horizontal") {
									let loadListCh5 = CrComLib.subscribeState('o', 'ch5-list', (value) => {
										if (value['loaded'] && (value['id'] === "horizontal-menu-swiper-thumb")) {
											loadCh5ListForMenu(projectConfigResponse, responseArrayForNavPages);
											navigateToFirstPage(projectConfigResponse, responseArrayForNavPages);
											setTimeout(() => {
												CrComLib.unsubscribeState('o', 'ch5-list', loadListCh5);
												loadListCh5 = null;
											});
										}
									});
								} else if (projectConfigResponse.menuOrientation === "vertical") {
									let loadListCh5 = CrComLib.subscribeState('o', 'ch5-list', (value) => {
										if (value['loaded'] && (value['id'] === "vertical-menu-swiper-thumb")) {
											loadCh5ListForMenu(projectConfigResponse, responseArrayForNavPages);
											navigateToFirstPage(projectConfigResponse, responseArrayForNavPages);
											setTimeout(() => {
												CrComLib.unsubscribeState('o', 'ch5-list', loadListCh5);
												loadListCh5 = null;
											});
										}
									});
								} else {
									navigateToFirstPage(projectConfigResponse, responseArrayForNavPages);
								}
								if (!deviceSpecificData) {
									configureWebXPanel(projectConfigResponse);
								}
							});
						});
						templateSetThemeModule.setThemes(projectConfigResponse.themes);
						templateSetThemeModule.changeTheme(projectConfigResponse.selectedTheme);
					});
				});
			});

			setTimeout(() => {
				CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:template-page-import-page', loadedSubId);
				loadedSubId = null;
			});
		}
	});


	function configureWebXPanel(projectConfigResponse) {
		const entries = webXPanelModule.paramsToObject();
		let isForceDeviceXPanel = projectConfigResponse.forceDeviceXPanel;
		if (entries["forcedevicexpanel"] === "true") {
			isForceDeviceXPanel = true;
		} else if (entries["forcedevicexpanel"] === "false") {
			isForceDeviceXPanel = false;
		}
		if (isForceDeviceXPanel === true) {
			webXPanelModule.getWebXPanel(true); // Always Connect as WebX and not Native
			connectToWebXPanel(projectConfigResponse);
		} else {
			// Check if Crestron Device
			if (WebXPanel.runsInContainerApp() === true) {
				webXPanelModule.getWebXPanel(false); // Connect as Native
				connectToWebXPanel(projectConfigResponse);
			} else {
				if (projectConfigResponse.useWebXPanel === true) {
					webXPanelModule.getWebXPanel(true);
					connectToWebXPanel(projectConfigResponse);
				}
			}
		}
	}

	function connectToWebXPanel(projectConfigResponse) {
		if (!isWebXPanelInitialized) {
			let loadListCh5 = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:template-version-info-import-page', (value) => {
				if (value['loaded']) {
					webXPanelModule.connect(projectConfigResponse);
					isWebXPanelInitialized = true;
					setTimeout(() => {
						CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:template-version-info-import-page', loadListCh5);
						loadListCh5 = null;
					});
				}
			});
		}
	}

	function loadCh5ListForMenu(projectConfigResponse, responseArrayForNavPages) {
		for (let i = 0; i < responseArrayForNavPages.length; i++) {
			const menu = document.getElementById("menu-list-id-" + i);
			if (menu) {
				if (responseArrayForNavPages[i].navigation.iconUrl && responseArrayForNavPages[i].navigation.iconUrl !== "") {
					menu.setAttribute("iconUrl", responseArrayForNavPages[i].navigation.iconUrl);
				} else if (responseArrayForNavPages[i].navigation.iconClass && responseArrayForNavPages[i].navigation.iconClass !== "") {
					menu.setAttribute("iconClass", responseArrayForNavPages[i].navigation.iconClass);
				}
				if (responseArrayForNavPages[i].navigation.isI18nLabel === true) {
					menu.setAttribute("label", translateModule.translateInstant(responseArrayForNavPages[i].navigation.label));
				} else {
					menu.setAttribute("label", responseArrayForNavPages[i].navigation.label);
				}
				menu.setAttribute("iconClass", responseArrayForNavPages[i].navigation.iconClass);
				if (projectConfigResponse.menuOrientation === 'horizontal') {
					menu.setAttribute("iconPosition", responseArrayForNavPages[i].navigation.iconPosition);
				}
				menu.setAttribute("receiveStateSelected", "active_state_class_" + responseArrayForNavPages[i].pageName);
				menu.setAttribute("onRelease", "templatePageModule.navigateTriggerViewByPageName('" + responseArrayForNavPages[i].pageName + "')");
			}
		}
	}

	function navigateToFirstPage(projectConfigResponse, responseArrayForNavPages) {
		let newIndex = -99;
		if (projectConfigResponse.content.$defaultView && projectConfigResponse.content.$defaultView !== "") {
			for (let i = 0; i < responseArrayForNavPages.length; i++) {
				if (responseArrayForNavPages[i].pageName.toString().trim().toUpperCase() === projectConfigResponse.content.$defaultView.toString().trim().toUpperCase()) {
					newIndex = i;
					break;
				} else {
					newIndex = -1;
				}
			}
		} else {
			newIndex = 0;
		}

		if (newIndex === -99 || newIndex === -1) {
			newIndex = 0;
		}
		navigateTriggerViewByIndex(newIndex);
	}

	/**
	 * Loader method is for spinner
	 */
	function hideLoading(pageObject) {
		if (totalPreloadPage === preloadPageLoaded) {
			if (!firstLoad && totalPreloadPage !== 0) {
				firstLoad = true;
				const listOfPages = projectConfigModule.getNavigationPages();
				listOfPages.forEach((page) => page.preloadPage && navigationModule.updateDiagnosticsOnPageChange(page.pageName));
			}
			cleanup();
			if (document.getElementById("loader").style.display === "none") {
				setTimeout(() => {
					document.getElementById("loader").style.display = "none";
					CrComLib.publishEvent('o', 'appLoad', { 'loaded': true });
				}, 2000);
			} else {
				const newPageTest = pageObject.pageName + "-import-page";
				setTimeout(() => {
					document.getElementById(newPageTest).classList.add("ch5-hide-dis");
					setTimeout(() => {
						document.getElementById(newPageTest).classList.remove("ch5-hide-dis");
						setTimeout(() => {
							document.getElementById("loader").style.display = "none";
							CrComLib.publishEvent('o', 'appLoad', { 'loaded': true });
							if (webXPanelModule.isAuthTokenValid()) {
								document.getElementById('authtoken-alert').setAttribute('show', 'true');
							}
						}, 2000);
					}, 1000);
				}, 1000);
			}
		} else {
			setTimeout(() => {
				hideLoading(pageObject);
			}, 500);
		}
	}

	function cleanup() {
		document.getElementById("header-section-page-template1")?.remove();
		document.getElementById("header-section-page-template2")?.remove();
		document.getElementById("template-content-page-section-horizontal")?.remove();
		document.getElementById("template-content-page-section-vertical")?.remove();
		document.getElementById("template-content-page-section-none")?.remove();
		document.getElementById("footer-section-page-template1")?.remove();
		document.getElementById("footer-section-page-template2")?.remove();
		document.getElementById("header-section-page-template1-set1")?.remove();

		projectConfigModule.projectConfigData().then(data => {
			if (data.header.displayInfo === false) {
				document.getElementById('logsbtn')?.remove();
			}
			if (data.header.displayInfo === false) {
				document.getElementById('infobtn')?.remove();
			}
			if (data.header.displayTheme === false) {
				document.getElementById('themebtn')?.remove();
			}
			if (data.menuOrientation === "vertical" || data.menuOrientation === "none") {
				document.getElementById('template-content-index-footer')?.remove();
			}
		});
	}

	window.addEventListener("orientationchange", function () {
		try {
			templatePageModule.setMenuActive();
		} catch (e) {
			// console.log(e);
		}
	}, false);

	/**
	 * Exported public method and properties
	 */
	return {
		navigateTriggerViewByPageName,
		openThumbNav,
		toggleSidebar,
		hideLoading,
		navigateTriggerViewByIndex
	};

})();
/*jslint es6 */
/*global CrComLib, projectConfigModule, translateModule, serviceModule, utilsModule, templateAppLoaderModule */

const templateAppLoaderModule = (() => {
	'use strict';

	function isCachePageLoaded(routeId) {
		if (document.getElementById(routeId)) {
			return document.getElementById(routeId).hasAttribute("url") &&
				document.getElementById(routeId).getAttribute("url") !== null &&
				document.getElementById(routeId).getAttribute("url") !== undefined &&
				document.getElementById(routeId).getAttribute("url") !== "";
		} else {
			return false;
		}
	}

	function showLoading(pageObject) {
		const routeId = pageObject.pageName + "-import-page";
		const isCached = isCachePageLoaded(routeId);
		if (isCached === false) {
			CrComLib.publishEvent('b', routeId + '-show-app-loader', true);
		}
	}

	/**
	 * All public method and properties are exported here
	 */
	return {
		showLoading,
		isCachePageLoaded
	};

})();// Copyright (C) 2022 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

/*global CrComLib, translateModule, serviceModule, utilsModule, templateAppLoaderModule, templatePageModule, projectConfigModule, projectConfigModule */

const templateAuthtokenAlertModule = (() => {
	'use strict';

	// Handle the escape key 
	document.addEventListener("keydown", function (event) {
		let alertFlag = document.getElementById('authtoken-alert').getAttribute('show');
		if (event.key === 'Escape' && alertFlag) {
			event.stopPropagation();
		}
	});

	/**
	 * private method for page class initialization
	 */
	let loadedImportSnippet = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:template-authtoken-alert-import-page', (value) => {
		if (value['loaded']) {
			setTimeout(() => {
				CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:template-authtoken-alert-import-page', loadedImportSnippet);
				loadedImportSnippet = null;
			});
		}
	});

	/**
	 * All public method and properties are exported here
	 */
	return {

	};
})();const templateLogsModule = (() => {
	"use strict";

	//#region "Variables"

	const LOG_SCROLL_INCREMENT_COUNTER = 200;
	let DEVICE_ID = "";
	let APP_VERSION = "";
	let CRCOMLIB_VERSION = "";
	let currentScrollIndex = 0;
	let filteredLogs = [];
	let fullLogs = [];
	let pushMessageLastIndex = -1;
	let socketConnectionOpen = false;
	let socket = null;
	let logPageOpened = false;
	let logsLoaded = false;
	let subScriptionId = null;
	let selectedLogLevels = [];
	const subsciptionList = [];
	//#endregion

	//#region "Load Page"

	/**
	 * private method for page class initialization
	 */
	let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:template-logs-import-page', (value) => {
		if (value['loaded']) {
			onInit();

			document.getElementById('loggerViewModalDialog').addEventListener('beforeShow', function (e) {
				DEVICE_ID = console.getDeviceDetails().deviceId;

				if (selectedLogLevels.length === 0) {
					selectedLogLevels = JSON.parse(JSON.stringify(Object.values(console.LOG_LEVELS)));
					for (let i = 0; i < selectedLogLevels.length; i++) {
						selectedLogLevels[i].selected = true;
					}
				}

				let loadedSubpageRefId = CrComLib.subscribeState('o', 'ch5-subpage-reference-list', (valueSRL) => {
					if (valueSRL['loaded'] && valueSRL['id'] === 'srlLogTypes') {
						const logLevels = Object.values(console.LOG_LEVELS);
						// for (let i = 0; i < logLevels.length; i++) {
						// 	CrComLib.publishEvent('s', 'LogLevels.LogLevel[' + i + '].Icon', 'logicon ' + logLevels[i].icon);
						// 	CrComLib.publishEvent('s', 'LogLevels.LogLevel[' + i + '].Label', logLevels[i].type);
						// 	CrComLib.publishEvent('s', 'LogLevels.LogLevel[' + i + '].CustomStyle', "--ch5-button--default-font-color: " + logLevels[i].color.browser + "; --ch5-button--default-selected-font-color: " + logLevels[i].color.browser + "; --ch5-button--default-pressed-font-color: " + logLevels[i].color.browser + "; --ch5-button--default-selected-border-color: " + logLevels[i].color.browser);
						// }

						// const srlLogTypes = document.getElementById("srlLogTypes");
						// const ch5ButtonsInSrlLogTypes = srlLogTypes.getElementsByTagName("ch5-button");
						// for (let i = 0; i < ch5ButtonsInSrlLogTypes.length; i++) {
						for (let i = 0; i < logLevels.length; i++) {
							// ch5ButtonsInSrlLogTypes[i].setAttribute("data-custom-type-id", logLevels[i].type);
							//ch5ButtonsInSrlLogTypes[i].setAttribute("id", "ch5ButtonsInSrlLogTypes_" + logLevels[i].type);
							CrComLib.publishEvent('s', 'LogLevels.LogLevel[' + i + '].Icon', 'logicon ' + logLevels[i].icon);
							CrComLib.publishEvent('s', 'LogLevels.LogLevel[' + i + '].Label', logLevels[i].type);
							CrComLib.publishEvent('s', 'LogLevels.LogLevel[' + i + '].CustomStyle', "--ch5-button--default-font-color: " + logLevels[i].color.browser + "; --ch5-button--default-selected-font-color: " + logLevels[i].color.browser + "; --ch5-button--default-pressed-font-color: " + logLevels[i].color.browser + "; --ch5-button--default-selected-border-color: " + logLevels[i].color.browser);
						};

						logPageOpened = true;
						getLoggerElement().addEventListener('scroll', populate);
						loadContent();
						setTimeout(() => {
							logsLoaded = true;
							getLoggerElement().classList.remove("ch5-hide-vis");
						}, 500);
						setTimeout(() => {
							CrComLib.unsubscribeState('o', 'ch5-subpage-reference-list', loadedSubpageRefId);
							loadedSubpageRefId = '';
						});
					}
				});


				for (let i = 0; i < selectedLogLevels.length; i++) {
					// subsciptionList[0] = 
					CrComLib.subscribeState('b', 'LogLevels.LogLevel[' + i + '].Selected', (v) => {
						selectedLogLevels[i].selected = v;
						templateLogsModule.filterLogsWithDebounce();
					});

				}

				document.querySelector('.ch5-modal-dialog-header').innerHTML = 'View Logs <label class="lbl-title-logs">(Panel Id: ' + DEVICE_ID + ')<label>';

				subScriptionId = CrComLib.subscribeState('b', 'console-log-new', (v) => {
					loadContent();
					scrollToBottomOfLogs(true);
				});
			});

			document.getElementById('loggerViewModalDialog').addEventListener('beforeHide', function (e) {
				getLoggerElement().innerHTML = '';
				logPageOpened = false;
				logsLoaded = false;
				CrComLib.unsubscribeState('b', 'console-log-new', subScriptionId);
				// for (let i = 0; i < subsciptionList.length; i++) {
				// 	CrComLib.unsubscribeState('b', 'LogLevels.LogLevel[' + i + '].Selected', subScriptionId);
				// }
			});

			setTimeout(() => {
				CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:template-logs-import-page', loadedSubId);
				loadedSubId = '';
			});
		}
	});

	//#end region

	function loadContent() {
		fullLogs = console.getLogs();
		filteredLogs = console.getLogs();
		filterLogs();
	}

	function clearLogs() {
		console.clearLogs();
		currentScrollIndex = 0;
		loadContent();
	}

	function getPostingObject() {
		return {
			deviceId: DEVICE_ID,
			version: APP_VERSION,
			CrComLibVersion: CRCOMLIB_VERSION,
			logs: fullLogs.filter(tempObj => parseInt(tempObj.index) > parseInt(pushMessageLastIndex))
		};
	}

	/**
	 * 
	 */
	function synchronize() {
		if (socketConnectionOpen === true) {
			try {
				socket.emit('LOG_MESSAGE_FROM_PANEL', getPostingObject());
				if (fullLogs.length > 0) {
					pushMessageLastIndex = fullLogs[fullLogs.length - 1].index;
				}
			} catch (e) {
				document.getElementById('ipAddressToPost').removeAttribute("disabled");
				document.getElementById('logBtnPostMessages').removeAttribute("disabled");
			}
		}
	}

	function isAtBottom() {
		const element = getLoggerElement(); // Or any specific scrollable element
		return element.scrollTop + element.clientHeight >= element.scrollHeight;
	}

	/**
	 * 
	 */
	function postLogs() {
		const ipAddress = document.getElementById("ipAddressToPost").value;
		if (utilsModule.isValidURL(ipAddress)) {
			document.getElementById('ipAddressToPost').setAttribute("disabled", true);
			document.getElementById('logBtnPostMessages').setAttribute("disabled", true);

			const options = {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(getPostingObject())
			};

			fetch(ipAddress, options).then((res) => {
				pushMessageLastIndex = fullLogs[fullLogs.length - 1].index;
				console.log(res);
				if (socketConnectionOpen === false) {
					socketConnectionOpen = true;
					socket = new io(ipAddress);
					socket.on('GET_SCREENSHOT_FROM_PANEL', (msg) => {
						console.log("GET_SCREENSHOT_FROM_PANEL", msg);
						console.log("GET_SCREENSHOT_FROM_PANEL - DEVICE_ID", DEVICE_ID);
						if (String(msg) === DEVICE_ID) {
							html2canvas(document.body).then((canvas) => {
								// document.body.appendChild(canvas);
								// console.log(canvas.toDataURL());
								const screenShot = {
									screenshotId: utilsModule.generateOTP(),
									panelId: DEVICE_ID,
									date: new Date(),
									now: (new Date()).getTime(),
									data: canvas.toDataURL('image/jpeg').replace('image/jpeg', 'image/octet-stream')
								}
								console.log("SCREENSHOT_CONTENT", screenShot);
								socket.emit('SCREENSHOT_CONTENT', screenShot);
							});
						}
					});
					//   }); 
				}
			}).catch((error) => {
				console.error(error);
				document.getElementById('ipAddressToPost').removeAttribute("disabled");
				document.getElementById('logBtnPostMessages').removeAttribute("disabled");
			});
		}
	}

	function formatLogs() {
		const paginatedLogs = filteredLogs.slice(
			Math.max(filteredLogs.length - ((currentScrollIndex + 1) * LOG_SCROLL_INCREMENT_COUNTER), 0),
			filteredLogs.length - ((currentScrollIndex) * LOG_SCROLL_INCREMENT_COUNTER));

		let values = paginatedLogs.map((item) => {
			return getNewLog(item);
		});
		return values.join("");
	}

	function getNewLog(item) {
		const output = `
			<div class="each-list-item log_{logtype}" style='border-left: solid 5px {color}'>
				<div class="d-flex justify-content-start">
					<div class="logiconholder">
						<i style="color:{color}" class="logicon {icon}"></i>
					</div>
					<div class="text-left w-100 logmessagetext">
						{message}
					</div>
				</div>
			</div>
			`;
		const itemIndex = item["index"];

		let returnVal = utilsModule.replaceAll(output, "{logtype}", item['logLevel'].type);
		returnVal = utilsModule.replaceAll(returnVal, "{icon}", item['logLevel'].icon);
		returnVal = utilsModule.replaceAll(returnVal, "{color}", item.logLevel.color.browser.toLowerCase());
		returnVal = utilsModule.replaceAll(returnVal, "{message}", (itemIndex + 1) + ") "
			+ item["date"] + ": " + evaluateValue(item["value"], itemIndex));
		return returnVal;
	}

	/**
	 * 
	 * @param {*} value 
	 */
	function evaluateValue(value, itemIndex) {
		try {
			let output = "";
			if (Array.isArray(value)) {
				for (let i = 0; i < value.length; i++) {
					if (Array.isArray(value[i])) {
						output += '<div class="log-item-object" data-input-index=' + itemIndex +
							' onclick="templateLogsModule.processAndRenderObject(this, ' + itemIndex + ', ' + i + ')">View Array</div>';
					} else if (utilsModule.isObject(value[i])) {
						output += '<div class="log-item-object" data-input-index=' + itemIndex +
							' onclick="templateLogsModule.processAndRenderObject(this, ' + itemIndex + ', ' + i + ')">View Object</div>';
					} else {
						output += value[i] + " ";
					}
				}
			} else if (utilsModule.isObject(value)) {
				output += '<div class="log-item-object" data-input-index=' + itemIndex +
					' onclick="templateLogsModule.processAndRenderObject(this, ' + itemIndex + ', -1)">View Object</div>';
			} else {
				output += value + " ";
			}
			return output;
		} catch (e) {
			return "$$: " + typeof value + " ," + ((value instanceof Function) + ", " + (value.constructor === Object));
		}
	}

	function processAndRenderObject(object, itemIndex, localIndex) {
		const value = console.getFullLogs()[itemIndex].value;
		if (value !== "" && value.length > 0) {
			if (localIndex !== -1) {
				createArrayObjectContainer(object, value[localIndex]);
			} else {
				createArrayObjectContainer(object, value);
			}
		}
	}

	const filterLogsWithDebounceMethod = utilsModule.debounce(() => {
		filterLogs();
	}, 500);

	function filterLogsWithDebounce() {
		filterLogsWithDebounceMethod();
	}
	/**
	 * 
	 */
	function filterLogs() {
		// setTimeout(() => {
		if (logPageOpened === true) {
			const input = (document.getElementById("logFilter") ? document.getElementById("logFilter").value : "").trim().toLowerCase();
			// const selectedLogLevels = [];
			const logLevels = Object.values(console.LOG_LEVELS);

			// const srlLogTypes = document.getElementById("srlLogTypes");
			// if (srlLogTypes) {
			// 	const ch5ButtonsInSrlLogTypes = srlLogTypes.getElementsByTagName("ch5-button");
			// 	if (ch5ButtonsInSrlLogTypes && ch5ButtonsInSrlLogTypes.length > 0) {
			// 		for (let i = 0; i < ch5ButtonsInSrlLogTypes.length; i++) {
			// 			if (ch5ButtonsInSrlLogTypes[i].getAttribute("selected") === "true") {
			// 				selectedLogLevels.push(ch5ButtonsInSrlLogTypes[i].getAttribute("data-custom-type-id"));
			// 			}
			// 		}
			// 	} else {
			// 		for (let i = 0; i < logLevels.length; i++) {
			// 			selectedLogLevels.push(logLevels[i].type);
			// 		}
			// 	}
			// } else {
			// 	for (let i = 0; i < logLevels.length; i++) {
			// 		selectedLogLevels.push(logLevels[i].type);
			// 	}
			// }
			// const srlLogTypes = document.querySelectorAll("#srlLogTypes > [data-custom-type-id]")
			// if (srlLogTypes.length > 0) {
			// 	Array.from(srlLogTypes).forEach(function (el) {
			// 		//  console.log(el.getAttribute("theChildsAttribute"))

			// 		for (let i = 0; i < logLevels.length; i++) {
			// 			const selectedTypeOption = srlLogTypes.getElementById("srlLogTypes");
			// 			if (selectedTypeOption) {
			// 				if (selectedTypeOption.getAttribute("selected") === "true") {
			// 					selectedLogLevels.push(logLevels[i].type);
			// 				}
			// 			} else {
			// 				// Used for hidden tab cases
			// 				selectedLogLevels.push(logLevels[i].type);
			// 			}
			// 		}
			// 	});
			// } else {
			// 	for (let i = 0; i < logLevels.length; i++) {
			// 		selectedLogLevels.push(logLevels[i].type);
			// 	}
			// }

			const selectedLevelsMap =  selectedLogLevels.filter((item) => item.selected).map((item) => item.type);
			filteredLogs = fullLogs.filter((tempObj) => {
				return ((tempObj.mergedValue.toLowerCase().indexOf(input) !== -1) && selectedLevelsMap.includes(tempObj.logLevel.type));
			});
			currentScrollIndex = 0;

			const objDiv = getLoggerElement();
			objDiv.innerHTML = formatLogs();

			const logTypeCountObj = console.getLogTypeCountDetails();
			for (let i = 0; i < logLevels.length; i++) {
				CrComLib.publishEvent('s', 'LogLevels.LogLevel[' + i + '].Label', logLevels[i].type + " (<b>" +
					logTypeCountObj[logLevels[i].type] + "</b>)");
			}

			// document.getElementById("logDisplayNoOfLogs").innerHTML = fullLogs.length;
			scrollToBottomOfLogs(false);
		}
		synchronize();
		// }, 100);
	}

	function scrollToBottomOfLogs(showToast) {
		if (isAtBottom() || logsLoaded === false) {
			scrollToBottomOnly();
		} else {
			if (showToast) {
				showToastMessage();
			}
		}
	}

	function scrollToBottomOnly() {
		setTimeout(() => {
			const objDiv = getLoggerElement();
			objDiv.scrollTop = objDiv.scrollHeight;
		}, 500);
	}
	function scrollToBottomAndClose() {
		scrollToBottomOnly();
		hideToastAsap();
	}
	/**
	 * 
	 */
	function populate() {
		const scrollTop = getLoggerElement().scrollTop;
		if (scrollTop < 100 && logPageOpened) {
			currentScrollIndex += 1;
			// if (filteredLogs.length - ((currentScrollIndex + 1) * LOG_SCROLL_INCREMENT_COUNTER) >= 0) {
			if (currentScrollIndex > console.getCurrentLogCounter() && console.getCurrentLogCounter() >= 0) {
				getLoggerElement().insertAdjacentHTML("afterbegin", formatLogs());
			}
		}
	}

	function showDetails() {
		document.getElementById('overlayClassLogDisplayOpen').classList.add('is-open');
		document.getElementById('overlayClassLogDisplayClose').classList.add('is-open');
	}

	function showToastMessage() {
		const templateToastMsgNewLog = document.getElementById("templateToastMsgNewLog");
		if (!templateToastMsgNewLog.classList.contains("show-toast")) {
			templateToastMsgNewLog.classList.add("show-toast");
		}
		hideToastMessage();
	}

	const hideToastMessage = utilsModule.debounce(() => {
		hideToastAsap();
	}, 3000);

	function hideToastAsap() {
		const templateToastMsgNewLog = document.getElementById("templateToastMsgNewLog");
		templateToastMsgNewLog.classList.remove("show-toast");
	}
	function hideDetails() {
		document.getElementById('overlayClassLogDisplayOpen').classList.remove('is-open');
		document.getElementById('overlayClassLogDisplayClose').classList.remove('is-open');
	}

	function getLoggerElement() {
		return document.getElementById('divLogContent');
	}

	function createArrayObjectContainer(obj, input) {
		const jsonData = input;
		obj.parentElement.insertAdjacentHTML("beforeend", "<pre class='logcontent'>" + JSON.stringify(jsonData, null, 2) + "</pre>");
		obj.remove();
	}

	/**
	 * Initialize Method
	 */
	function onInit() {
		serviceModule.addEmulatorScenario("./app/template/components/widgets/template-logs/template-logs-emulator.json");
	}

	/**
	 * Function to manage show/hide of content below fields when keyboard is up
	 */
	function onLoggerTextboxOnFocus() {
		// document.getElementById('log-display-page').classList.add('typing');
	}

	/**
	 * Function to manage show/hide of content below fields when keyboard is up
	 */
	function onLoggerTextboxOnBlur() {
		// document.getElementById('log-display-page').classList.remove('typing');
	}

	function captureScreenshot() {
		html2canvas(document.body).then(function (canvas) {
			// document.body.appendChild(canvas);
			console.log(canvas.toDataURL());
		});
	}

	/**
	 * All public method and properties are exported here
	 */
	return {
		scrollToBottomAndClose,
		clearLogs,
		captureScreenshot,
		postLogs,
		filterLogsWithDebounce,
		showDetails,
		loadContent,
		hideDetails,
		onLoggerTextboxOnFocus,
		onLoggerTextboxOnBlur,
		processAndRenderObject
	};

	// END::CHANGEAREA

})();
// Copyright (C) 2022 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.
/*jslint es6 */
/*global CrComLib, translateModule, serviceModule, utilsModule, templatePageModule */

const templateRemoteLoggerSettingsModule = (() => {
  "use strict";

  let logger;
  let isConfigured = false;
  let appender = {};
  let clickCount = 0;
  let startTimer = 0;
  let ds = null;
  let dsElem = null;
  let rlbtn = null;
  let errorMessage = null;
  let ipAddressElem = null;
  let portNumberElem = null;

  function onInit() {
    ds = document.getElementById("template-dstatus");
    dsElem = document.getElementsByClassName('dockerstatus');
    rlbtn = document.getElementById('template-rlbtn');
    errorMessage = document.querySelector(".ui.error.message");
    ipAddressElem = document.getElementById("loggerIpAddress");
    portNumberElem = document.getElementById("loggerPortNumber");
  }

  /**
   * Reset Status
   */
  function resetStatus() {
    ds.innerHTML = translateModule.translateInstant("app.ch5logger.docker.dockerdisconnected");
    dsElem[0].firstChild.classList.remove("red");
    dsElem[0].firstChild.classList.remove("amber");
    dsElem[0].firstChild.classList.remove("green");
  }

  /**
   * Reset the connection style
   */
  function resetConnection() {
    const errorMessage = document.querySelector(".ui.error.message");
    errorMessage.style.display = "none";
    resetStatus();
    if (logger !== undefined) {
      logger.disconnect();
    }
    disconnect();
  }

  /**
   * Perform actions related to remote logger disconection
   * and set the values for connect
   */
  function disconnect() {
    rlbtn.disabled = false;
    rlbtn.className = "connect";
    ipAddressElem.disabled = false;
    portNumberElem.disabled = false;
    if (logger !== undefined) {
      logger.disconnect();
    }
    rlbtn.innerHTML = translateModule.translateInstant("app.ch5logger.form.connect");
  }

  /**
   * Perform actions related to remote logger disconection
   * and set the values for disconnect
   */
  function connect() {
    rlbtn.disabled = false;
    ipAddressElem.disabled = true;
    portNumberElem.disabled = true;
    rlbtn.className = "disconnect";
    rlbtn.innerHTML = translateModule.translateInstant("app.ch5logger.form.disconnect");
  }

  /**
   * Set the remote logger configuration for docker
   */
  function setRemoteLoggerConfig(hName, pNumber) {
    try {
      // Store hostname and port number
      ipAddressElem.disabled = true;
      portNumberElem.disabled = true;
      rlbtn.disabled = true;

      if (isConfigured) {
        appender.resetIP(hName, pNumber);
        logger = CrComLib.getLogger(appender, true);
      } else {
        appender = CrComLib.getRemoteAppender(hName, pNumber);
        logger = CrComLib.getLogger(appender, true);
        isConfigured = true;

        logger.subscribeDockerStatus.subscribe((message) => {
          if (message !== "") {
            resetStatus();
            if (message === "DOCKER_CONNECTING") {
              rlbtn.innerHTML = translateModule.translateInstant("app.ch5logger.form.connecting");
              dsElem[0].firstChild.classList.add("amber");
            } else if (message === "DOCKER_CONNECTED") {
              connect();
              dsElem[0].firstChild.classList.add("green");
            } else if (message === "DOCKER_ERROR") {
              disconnect();
              dsElem[0].firstChild.classList.add("red");
            }
            message = message.toLowerCase();
            message = message.replace(/_/, "");
            ds.innerHTML = translateModule.translateInstant("app.ch5logger.docker." + message);
          }
        });
      }
    } catch (error) {
      ipAddressElem.disabled = false;
      portNumberElem.disabled = false;
      rlbtn.disabled = false;
      utilsModule.log(error);
    }
  }

  /**
   * Counts the clicks happened in the time difference
   */
  function clickCounter() {
    if (startTimer) {
      if (timeDifference() > 3) {
        resetTimer();
      }
    }
    clickCount += 1;
    if (clickCount == 1) {
      startTimer = Date.now();
    }
  }

  /**
   * Reset the time
   */
  function resetTimer() {
    clickCount = 0;
    startTimer = 0;
  }

  /**
   * Calculate the Time difference
   */
  function timeDifference() {
    const endTimer = Date.now();
    const timerDiff = Math.floor((endTimer - startTimer) / 1000);
    return timerDiff;
  }

  /**
   * Displays the logger popup
   */
  function showLoggerPopUp() {
    const model = document.getElementById("loggerModalWrapper");
    const errorMessage = document.querySelector(".ui.error.message");
    errorMessage.style.display = "none";
    clickCounter();
    if (clickCount === 5) {
      if (timeDifference() <= 3) {
        CrComLib.publishEvent("b", "template-remote-logger.clicked", true);
        model.style.display = "block";
        resetTimer();
      } else {
        CrComLib.publishEvent("b", "template-remote-logger.clicked", false);
        model.style.display = "none";
        resetTimer();
      }
    }
  }

  /**
   * Retrieve the inputs from the form and passes to the setRemoteLoggerConfig()
   */
  function updateLoggerInfo() {
    const hostName = ipAddressElem.value;
    const portNumber = portNumberElem.value;
    if (rlbtn.classList.contains("connect")) {
      setRemoteLoggerConfig(hostName, portNumber);
    } else {
      resetConnection();
    }
  }

  /**
   * Validate the IP Address / Hostname and Port number provided in the form
   */
  function validate() {
    let ipExp = /^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$/;
    let hostExp = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;
    errorMessage.style.display = "none";
    let ip = false;
    let port = false;
    errorMessage.innerHTML = "";
    if (ipAddressElem.value === "" || ipAddressElem.value === undefined || ipAddressElem.value === null) {
      errorMessage.innerHTML = "Please enter IP Address/Hostname";
      errorMessage.style.display = "block";
      return false;
    }
    if (portNumberElem.value === "" || portNumberElem.value === undefined || portNumberElem.value === null) {
      errorMessage.innerHTML = "Please enter Port Number";
      errorMessage.style.display = "block";
      return false;
    }
    if (
      ipAddressElem.value !== undefined &&
      ipAddressElem.value !== null &&
      ipAddressElem.value !== "0.0.0.0" &&
      ipAddressElem.value !== "255.255.255.255" &&
      ipAddressElem.value.length <= 127 &&
      (ipExp.test(ipAddressElem.value) || hostExp.test(ipAddressElem.value))
    ) {
      ip = true;
      errorMessage.style.display = "none";
    } else {
      errorMessage.innerHTML = "Please enter valid IP Address/Hostname";
      errorMessage.style.display = "block";
      return false;
    }
    if (
      portNumberElem.value !== null &&
      !isNaN(portNumberElem.value) &&
      portNumberElem.value >= 1025 &&
      portNumberElem.value < 65536
    ) {
      port = true;
      errorMessage.style.display = "none";
    } else {
      errorMessage.innerHTML = "Please enter valid Port Number between 1025 to 65536";
      errorMessage.style.display = "block";
      return false;
    }
    if (ip && port) {
      errorMessage.style.display = "none";
      updateLoggerInfo();
    }
  }

  /**
 * private method for page class initialization
 */
  let loadedImportSnippet = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:template-remote-logger-settings-import-page', (value) => {
    if (value['loaded']) {
      setTimeout(() => {
        onInit();
      }, 5000);
      setTimeout(() => {
        CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:template-remote-logger-settings-import-page', loadedImportSnippet);
        loadedImportSnippet = null;
      });
    }
  });

  /**
   * All public method and properties are exported here
   */
  return {
    showLoggerPopUp,
    validate,
    resetConnection,
    updateLoggerInfo,
    setRemoteLoggerConfig,
  };
})();// Copyright (C) 2022 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.
/*jslint es6 */
/*global CrComLib, translateModule, serviceModule, utilsModule, templatePageModule */

const templateSetThemeModule = (() => {
  "use strict";

  let projectThemesList = [];

  function onInit() {
    projectConfigModule.projectConfigData().then(projectConfigResponse => {
      //translateModule.initializeDefaultLanguage().then(() => {

        const receiveStateTheme = projectConfigResponse.customSignals.receiveStateTheme || 'template-theme';
        const sendEventTheme = projectConfigResponse.customSignals.sendEventTheme || 'template-theme';

        const projectThemes = projectConfigResponse.themes;
        setThemes(projectConfigResponse.themes);
        const themeList = document.getElementById('template-theme-list');
        let wrapper = `<ch5-button-list orientation="vertical" buttonType="warning" numberOfItems="${projectThemes.length}" columns="1" 
        buttonShape="rounded-rectangle" indexId="idx" loadItems="all"
        receiveStateSelectedButton="selectedTheme">`
        projectThemes.forEach(theme => {
          wrapper +=
            `<ch5-button-list-individual-button 
            onRelease="CrComLib.publishEvent('s','${receiveStateTheme}','${theme.name}')" 
            labelInnerHtml="${theme.name}" >
          </ch5-button-list-individual-button>`
        })
        wrapper += '</ch5-button-list>';
        themeList.innerHTML = wrapper;

        CrComLib.subscribeState('b', 'themebtn.clicked', (value) => {
          if (value.repeatdigital === true && document.getElementById('template-theme').getAttribute('show') === 'false') {
            document.getElementById('template-theme').setAttribute('show', 'true');
          }
        });

        CrComLib.subscribeState('s', receiveStateTheme, (value) => {
          // Conditions to check theme value
          const validValue = !!projectThemes.find(theme => theme.name === value);
          const noValue = value === "";

          // change theme if valid
          if (validValue || noValue) {
            setTimeout(() => {
              document.getElementById('template-theme').setAttribute('show', 'false');
            }, 50);

            const theme = validValue === true ? value : projectConfigResponse.selectedTheme;
            changeTheme(theme);
            if (receiveStateTheme !== sendEventTheme && sendEventTheme?.trim()) {
              CrComLib.publishEvent('s', sendEventTheme, theme);
            }
          }
        });
      //});

    });
  }

  function setThemes(listInput) {
    projectThemesList = listInput;
  }

  /**
   * This is public method to change the theme
   * @param {string} theme pass theme type like 'light-theme', 'dark-theme'
   */
  function changeTheme(theme) {
    const body = document.body;
    for (let i = 0; i < projectThemesList.length; i++) {
      body.classList.remove(projectThemesList[i].name);
    }
    let selectedThemeName = theme.trim();
    if (!body.classList.contains(selectedThemeName)) {
      body.classList.add(selectedThemeName);
    }

    let selectedTheme = projectThemesList.find((tempObj) => tempObj.name.trim().toLowerCase() === selectedThemeName.toLowerCase());
    if (document.getElementById("brandLogo")) {
      if (selectedTheme.brandLogo !== "undefined") {
        for (const prop in selectedTheme.brandLogo) {
          if (selectedTheme.brandLogo[prop] !== "") {
            document.getElementById("brandLogo").setAttribute(prop, selectedTheme.brandLogo[prop]);
          }
        }
      }
    }

    const templateContentBackground = document.getElementById("template-content-background");
    if (templateContentBackground) {
      // CH5C-28506: added the below subscription to fix background color issue
      CrComLib.subscribeState('o', 'appLoad', (value) => {
        if (value['loaded']) {
          const element = window.getComputedStyle(document.body);
          const styleValue = element.getPropertyValue("--theme-colors--theme-background-color");
          if (styleValue && styleValue.trim() !== "") {
            templateContentBackground.setAttribute("backgroundColor", styleValue);
          }
        }
      }); 
    }
    const themeIndex = projectThemesList.findIndex(ele => ele.name === theme);
    CrComLib.publishEvent('n', 'selectedTheme', themeIndex);
  }

  /**
   * private method for page class initialization
   */
  let loadedImportSnippet = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:template-set-theme-import-page', (value) => {
    if (value['loaded']) {
      onInit();
      setTimeout(() => {
        CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:template-set-theme-import-page', loadedImportSnippet);
        loadedImportSnippet = null;
      });
    }
  });

  /**
   * All public method and properties are exported here
   */
  return {
    setThemes,
    changeTheme
  };
})();// Copyright (C) 2022 to the present, Crestron Electronics, Inc.
// All rights reserved.
// No part of this software may be reproduced in any form, machine
// or natural, without the express written consent of Crestron Electronics.
// Use of this source code is subject to the terms of the Crestron Software License Agreement
// under which you licensed this source code.

/*global CrComLib, translateModule, serviceModule, utilsModule, templateAppLoaderModule, templatePageModule, projectConfigModule, projectConfigModule */

const templateVersionInfoModule = (() => {
	'use strict';

	let projectConfig;
	const tableCount = {};
	const componentCount = {};
	let logInterval;

	/**
	 * Initialize Method
	 */
	function onInit() {
		projectConfigModule.projectConfigData().then(projectConfigResponse => {
			translateModule.initializeDefaultLanguage().then(() => {
				projectConfig = projectConfigResponse;
				logDiagnostics(projectConfigResponse.header.diagnostics.logs.logDiagnostics);
				updateSubscriptions();
				setTabs();
				const infoModal = document.getElementById('template-info');
				infoModal.setAttribute('title', translateModule.translateInstant('header.info.title'));
			});
		});
		CrComLib.subscribeState('b', 'infoBtn.clicked', (value) => {
			if (value.repeatdigital === true && document.getElementById('template-info').getAttribute('show') === 'false') {
				document.getElementById('template-info').setAttribute('show', 'true');
				updatePageCount();
			}
		});
	}

	function setTabs() {
		const entries = webXPanelModule.paramsToObject();

		let isForceDeviceXPanel = projectConfig.forceDeviceXPanel;
		if (entries["forcedevicexpanel"] === "true") {
			isForceDeviceXPanel = true;
		} else if (entries["forcedevicexpanel"] === "false") {
			isForceDeviceXPanel = false;
		}

		if (projectConfig.useWebXPanel === false && isForceDeviceXPanel === false) {
			document.getElementById('webxpanel-tab').style.display = 'none';
		}
		updateVersionTabHTML();
		updatePageCount();
		setTabsListeners();
		setLogButtonListener();
	}

	function updateVersionTabHTML() {
		serviceModule.loadJSON('./assets/data/version.json', (packages) => {
			if (!packages) {
				return utilsModule.log("FILE NOT FOUND");
			}
			const versionTableBody = document.getElementById('versionTableBody');
			versionTableBody.innerHTML = "";
			Array.from(JSON.parse(packages)).forEach((e) => versionTableBody.appendChild(createTableRow(e)))
		})
	}

	function createTableRow(data) {
		const tableRow = document.createElement('tr');
		for (const value of Object.values(data)) {
			const tableData = document.createElement('td');
			if (value === 'Y') {
				tableData.style.color = "green";
				tableData.innerHTML = '<i class="fas fa-check"></i>&nbsp;&nbsp;Yes';
			}
			else if (value === 'N') {
				tableData.innerHTML = '<i class="fas fa-times"></i>&nbsp;&nbsp;No';
				tableData.style.color = "orange";
			}
			else {
				tableData.textContent = value;
			}
			tableRow.appendChild(tableData);
		}
		return tableRow;
	}

	function updatePageCount() {
		const diagnosticsTableElement = document.getElementById('diagnosticsTableElement');
		diagnosticsTableElement.innerHTML = "";
		const diagnosticPageHeaderElement = document.getElementById('diagnosticPageHeaderElement');
		const listOfPages = projectConfigModule.getNavigationPages();

		document.getElementById('pageCount').textContent = translateModuleHelper('pagecount', listOfPages.length);
		diagnosticPageHeaderElement.children[2].textContent = `Preload (${listOfPages.filter(page => page.preloadPage).length})`;
		diagnosticPageHeaderElement.children[3].textContent = `	Cached (${listOfPages.filter(page => page.cachePage).length})`;
		for (const page of listOfPages) {
			let count = tableCount[page.pageName]?.total ?? '';
			let nodes = tableCount[page.pageName]?.domNodes ?? '';

			const pageImporterElement = document.getElementById(page.pageName + '-import-page');
			if (pageImporterElement) {
				tableCount[page.pageName] = CrComLib.countNumberOfCh5Components(pageImporterElement);
				tableCount[page.pageName].domNodes = pageImporterElement.getElementsByTagName('*').length;

				if (tableCount[page.pageName].domNodes === 1) {
					tableCount[page.pageName].total = "";
					tableCount[page.pageName].domNodes = "";
				}
				count = tableCount[page.pageName].total;
				nodes = tableCount[page.pageName].domNodes;
			}

			const processedPageName = page.navigation.isI18nLabel ? translateModule.translateInstant(page.navigation.label) : page.navigation.label;
			const newTableEntry = createTableRow({ name: processedPageName, count, preload: page.preloadPage ? 'Y' : 'N', cached: page.cachePage ? 'Y' : 'N', nodes });
			newTableEntry.setAttribute('id', 'diagnostics-table-' + page.pageName);
			diagnosticsTableElement.appendChild(newTableEntry);
		}

		document.getElementById('totalDom').innerHTML = templateVersionInfoModule.translateModuleHelper('totalnodes', componentCount.totalDomCount);
		document.getElementById('totalComponents').innerHTML = templateVersionInfoModule.translateModuleHelper('totalcomponents', componentCount.totalComponentsCount);;
		document.getElementById('currentComponents').innerHTML = templateVersionInfoModule.translateModuleHelper('currentcomp', componentCount.currentCh5Components);
	}

	function setTabsListeners() {
		const tabs = ['version-tab', 'webxpanel-tab', 'diagnostics-tab'];
		tabs.forEach((tab) => {
			document.getElementById(tab).addEventListener('click', function () {
				if (this.classList.contains('selected')) return;
				tabs.forEach((tabContent) => tab !== tabContent ? document.getElementById(tabContent + '-content').style.display = "none" : document.getElementById(tabContent + '-content').style.display = "block");
				tabs.forEach((selectedTab) => tab !== selectedTab ? document.getElementById(selectedTab).classList.remove('selected') : "");
				this.classList.add('selected');
			})
		})
	}

	/**
	 * Log information in specific interval as mentioned in project-config.json
	 * @param {string} duration duration to log issues
	 * @returns 
	 */
	function logDiagnostics(duration) {
		let delay = 0;
		if (duration === "none") {
			return;
		} else if (duration === "hourly") {
			delay = 60 * 60 * 1000; // 1 hour in msec
		} else if (duration === "daily") {
			delay = 60 * 60 * 1000 * 24; // 24 hour in msec
		} else if (duration === "weekly") {
			delay = 60 * 60 * 1000 * 24 * 7; // Weekly in msec
		}

		if (!logInterval) {
			logInterval = setInterval(templateVersionInfoModule.logSubscriptionsCount, delay);
		}
	}

	function setLogButtonListener() {
		subscribeLogButton.addEventListener('click', logSubscriptionsCount);
		CrComLib.subscribeState('b', '' + projectConfig.header.diagnostics.logs.receiveStateLogDiagnostics, (value) => logSubscriptionsCount(null, value));
	}

	function logSubscriptionsCount(event, signalValue) {
		const signals = updateSubscriptions();
		const ch5components = {
			ch5ComponentsPageWise: { ...tableCount },
			...componentCount,
			totalCh5ComponentsCurrentlyLoaded: CrComLib.countNumberOfCh5Components(document.getElementsByTagName('body')[0]).total
		}

		const signalNames = document.getElementById('totalSignals').textContent.split(':')[1].trim();
		const subscriptions = document.getElementById('totalSubscribers').textContent.split(':')[1].trim();
		if ((signalValue !== undefined && signalValue === true) || signalValue === undefined) {
			console.log({ signals, ch5components, signalNames, subscriptions });
		}
	}

	function translateModuleHelper(fieldName, fieldValue) {
		return translateModule.translateInstant(`header.info.diagnostics.${fieldName}`) + " " + fieldValue;
	}

	function updateSubscriptions() {
		let tsubscriptions = 0;
		let subscribers = 0;
		let data = [];
		const signals = CrComLib.getSubscriptionsCount();
		for (const [sType, value] of Object.entries(signals)) {
			for (const [signal, details] of Object.entries(value)) {
				tsubscriptions++;
				const signalType = sType != undefined ? sType : "";
				const signalName = signal != undefined ? signal : "";
				const subscriptions = Object.values(details._subscriptions).length - 1;
				data.push({ signalType, signalName, subscriptions });
				subscribers += subscriptions;
			}
		}
		const totalSignals = document.getElementById('totalSignals');
		const totalSubscribers = document.getElementById('totalSubscribers');

		totalSignals.textContent = translateModuleHelper('subscribers', subscribers);
		totalSubscribers.textContent = translateModuleHelper('subscription', tsubscriptions);

		return data;
	}

	/**
	 * private method for page class initialization
	 */
	let loadedImportSnippet = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:template-version-info-import-page', (value) => {
		if (value['loaded']) {
			setTimeout(() => {
				onInit();
			});
			setTimeout(() => {
				CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:template-version-info-import-page', loadedImportSnippet);
				loadedImportSnippet = null;
			});
		}
	});

	/**
	 * All public method and properties are exported here
	 */
	return {
		translateModuleHelper,
		updateSubscriptions,
		tableCount,
		componentCount,
		logSubscriptionsCount
	};
})();/* page1.js */
const page1Module = (() => {
    'use strict';

    function onInit() {
        console.log('✅ Page 1 Initialized with 4 Widgets');

        setupButtonEventListeners();
        setupSliders();
        setupFeedbackSubscriptions();
        requestCurrentStatus();
        setupTopNavigation();
        initializeWidgets();
    }

    // ====================== WIDGET MANAGEMENT ======================
    function initializeWidgets() {
        const firstTab = document.querySelector('.tab-btn.active');
        if (firstTab) {
            const widgetName = firstTab.getAttribute('data-widget') || 'lights';
            switchWidget(widgetName, firstTab);
        }
    }

    window.switchWidget = function(widgetName, clickedBtn) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        // Switch visible widget
        document.querySelectorAll('.widget').forEach(w => w.classList.remove('active'));
        const activeWidget = document.getElementById('widget-' + widgetName);
        if (activeWidget) activeWidget.classList.add('active');

        // Optional: Send to Crestron
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('s', 'active_widget_name', widgetName);
        }
    };

    window.switchTVSubWidget = function(subwidgetName, clickedBtn) {
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        
        document.querySelectorAll('.tv-subwidget').forEach(w => w.classList.remove('active'));
        document.getElementById(subwidgetName).classList.add('active');
    };

    // ====================== SHARED FUNCTIONS ======================
    function toggleTile(name, cls) {
        const tog = document.getElementById('tog-' + name);
        const tile = document.getElementById('tile-' + name);
        const lbl = document.getElementById('lbl-' + name);
        if (!tog || !tile || !lbl) return;

        const isOn = tog.checked;
        tile.classList.toggle(cls, isOn);
        lbl.textContent = isOn ? 'ON' : 'OFF';

        if (name === 'lights') setStatus(isOn ? 'on' : 'off');
    }

    function setStatus(s) {
        const pill = document.getElementById('statusPill');
        const text = document.getElementById('lightingStatus');
        if (!pill || !text) return;

        pill.className = 'spill';
        if (s === 'on')  { pill.classList.add('sp-on');  text.textContent = 'Lights: ON'; }
        if (s === 'off') { pill.classList.add('sp-off'); text.textContent = 'Lights: OFF'; }
        if (s === 'dim') { pill.classList.add('sp-dim'); text.textContent = 'Lights: DIMMED'; }
    }

    function updateDial(pct) {
        const fill = document.getElementById('arc-fill');
        const label = document.getElementById('arc-label');
        if (!fill) return;

        const cx = 100, cy = 105, r = 76;
        const deg = -180 + pct * 1.8;
        const rad = deg * Math.PI / 180;
        const ex = cx + r * Math.cos(rad);
        const ey = cy + r * Math.sin(rad);

        if (pct <= 0) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 24.001 105');
        } else if (pct >= 100) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 176 105');
        } else {
            fill.setAttribute('d', `M 24 105 A 76 76 0 ${pct > 50 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== SLIDERS & BUTTONS ======================
    function setupSliders() {
        // Dimmer Slider (Lights Widget)
        const dimSlider = document.getElementById('dimLevelSlider');
        if (dimSlider) {
            dimSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '31', v);
            });
        }

        // Shades Slider
        const shadeSlider = document.getElementById('shadeSlider');
        if (shadeSlider) {
            shadeSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('shadeValue').textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '36', v);
            });
        }

        // ==================== NEW: AC Setpoint Slider ====================
        const acSlider = document.getElementById('acSetpointSlider');
        if (acSlider) {
            acSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                const display = document.getElementById('acSetValue');
                if (display) display.textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '41', v);
            });
        }
    }

    function setupButtonEventListeners() {
        // Lights Quick Buttons
        document.getElementById('lightsOnBtn')?.addEventListener('click', () => {
            setStatus('on');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = true; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '10', true);
                setTimeout(() => CrComLib.publishEvent('b', '10', false), 100);
            }
        });

        document.getElementById('lightsOffBtn')?.addEventListener('click', () => {
            setStatus('off');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = false; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '11', true);
                setTimeout(() => CrComLib.publishEvent('b', '11', false), 100);
            }
        });

        document.getElementById('lightsDimBtn')?.addEventListener('click', () => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) {
                slider.value = 50;
                const v = 50;
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('n', '31', v);
                    CrComLib.publishEvent('b', '12', true);
                    setTimeout(() => CrComLib.publishEvent('b', '12', false), 100);
                }
            }
        });

        

        // Shades Buttons
        document.getElementById('shadeUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '50', true);
                setTimeout(() => CrComLib.publishEvent('b', '50', false), 100);
            }
        });
        document.getElementById('shadeStopBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '52', true);
                setTimeout(() => CrComLib.publishEvent('b', '52', false), 100);
            }
        });
        document.getElementById('shadeDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '51', true);
                setTimeout(() => CrComLib.publishEvent('b', '51', false), 100);
            }
        });

        // ==================== NEW: AC CONTROLS ====================
        // AC Power Toggle (pulses on every change - matches Crestron toggle behavior)
        const acToggle = document.getElementById('tog-ac');
        if (acToggle) {
            acToggle.addEventListener('change', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', '70', true);
                    setTimeout(() => CrComLib.publishEvent('b', '70', false), 100);
                }
            });
        }

        // AC Modes
        document.getElementById('acCoolBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '71', true);
                setTimeout(() => CrComLib.publishEvent('b', '71', false), 100);
            }
        });
        document.getElementById('acHeatBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '72', true);
                setTimeout(() => CrComLib.publishEvent('b', '72', false), 100);
            }
        });
        document.getElementById('acAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '73', true);
                setTimeout(() => CrComLib.publishEvent('b', '73', false), 100);
            }
        });
        document.getElementById('acDryBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '74', true);
                setTimeout(() => CrComLib.publishEvent('b', '74', false), 100);
            }
        });
        document.getElementById('acFanBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '75', true);
                setTimeout(() => CrComLib.publishEvent('b', '75', false), 100);
            }
        });

        // AC Fan Speeds
        document.getElementById('acFanLowBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '76', true);
                setTimeout(() => CrComLib.publishEvent('b', '76', false), 100);
            }
        });
        document.getElementById('acFanMedBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '77', true);
                setTimeout(() => CrComLib.publishEvent('b', '77', false), 100);
            }
        });
        document.getElementById('acFanHighBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '78', true);
                setTimeout(() => CrComLib.publishEvent('b', '78', false), 100);
            }
        });
        document.getElementById('acFanAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '79', true);
                setTimeout(() => CrComLib.publishEvent('b', '79', false), 100);
            }
        });

        // AC Swing
        document.getElementById('acSwingBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '81', true);
                setTimeout(() => CrComLib.publishEvent('b', '81', false), 100);
            }
        });

        // ====================== TV BUTTONS & REMOTE ======================

        // Quick Action Buttons (Top of TV Widget)
        document.getElementById('tvPowerBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvNetflixBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '61', true);
                setTimeout(() => CrComLib.publishEvent('b', '61', false), 100);
            }
        });

        document.getElementById('tvHdmiBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '62', true);
                setTimeout(() => CrComLib.publishEvent('b', '62', false), 100);
            }
        });

        // ==================== TV REMOTE CONTROLS (Inside TV Controls Sub-Widget) ====================

        // Power & Source Buttons (inside remote)
        document.getElementById('tvPowerBtn2')?.addEventListener('click', () => {   // tvPowerBtn2 is the one in remote
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvSourceBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '68', true);   // You can change join number
                setTimeout(() => CrComLib.publishEvent('b', '68', false), 100);
            }
        });

        // ==================== D-PAD ====================
        document.getElementById('tvDpadUp')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '63', true);
                setTimeout(() => CrComLib.publishEvent('b', '63', false), 100);
            }
        });

        document.getElementById('tvDpadDown')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '64', true);
                setTimeout(() => CrComLib.publishEvent('b', '64', false), 100);
            }
        });

        document.getElementById('tvDpadLeft')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '65', true);
                setTimeout(() => CrComLib.publishEvent('b', '65', false), 100);
            }
        });

        document.getElementById('tvDpadRight')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '66', true);
                setTimeout(() => CrComLib.publishEvent('b', '66', false), 100);
            }
        });

        document.getElementById('tvDpadOk')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '67', true);
                setTimeout(() => CrComLib.publishEvent('b', '67', false), 100);
            }
        });

        // ==================== NUMERIC KEYPAD (0-9 + Enter) ====================
        for (let i = 0; i <= 9; i++) {
            const keyBtn = document.getElementById('tvKey' + i);
            if (keyBtn) {
                keyBtn.addEventListener('click', () => {
                    if (typeof CrComLib !== 'undefined') {
                        // Joins 90 to 99 for digits
                        CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), true);
                        setTimeout(() => CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), false), 100);
                    }
                });
            }
        }

        document.getElementById('tvKeyEnter')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '100', true);   // Enter button join
                setTimeout(() => CrComLib.publishEvent('b', '100', false), 100);
            }
        });

        // ==================== VOLUME & CHANNEL CONTROLS ====================
        document.getElementById('tvVolUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '101', true);
                setTimeout(() => CrComLib.publishEvent('b', '101', false), 100);
            }
        });

        document.getElementById('tvVolDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '102', true);
                setTimeout(() => CrComLib.publishEvent('b', '102', false), 100);
            }
        });

        document.getElementById('tvMuteBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '103', true);
                setTimeout(() => CrComLib.publishEvent('b', '103', false), 100);
            }
        });

        document.getElementById('tvChUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '104', true);
                setTimeout(() => CrComLib.publishEvent('b', '104', false), 100);
            }
        });

        document.getElementById('tvChDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '105', true);
                setTimeout(() => CrComLib.publishEvent('b', '105', false), 100);
            }
        });

        // ==================== FAVORITES GRID (Dynamic) ====================
        // Example: Assign joins starting from 110 onwards
        const favButtons = document.querySelectorAll('.fav-btn');
        favButtons.forEach((btn, index) => {
            const joinNumber = 110 + index;   // 110, 111, 112 ...
        
            btn.addEventListener('click', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', String(joinNumber), true);
                    setTimeout(() => CrComLib.publishEvent('b', String(joinNumber), false), 100);
                }
                console.log(`Favorite ${index + 1} pressed → Digital Join ${joinNumber}`);
            });
        });
        

    function setupFeedbackSubscriptions() {
        // Existing dimmer feedback
        CrComLib.subscribeState('n', '30', (val) => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) slider.value = val;
            document.getElementById('dimValue').textContent = val;
            document.getElementById('dimPercentage').textContent = val + '%';
            updateDial(val);
        });

        // ==================== NEW: AC Feedback ====================
        CrComLib.subscribeState('n', '40', (val) => {
            const currentEl = document.getElementById('acCurrentTemp');
            if (currentEl) currentEl.textContent = Math.round(val) + '°C';
        });
    }

    function requestCurrentStatus() {
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('b', '99', true);
            setTimeout(() => CrComLib.publishEvent('b', '99', false), 100);
        }
    }

    function setupTopNavigation() {
        CrComLib.publishEvent("b", "active_state_class_page1", true);
    }

    // Clock
    function tick() {
        const el = document.getElementById('clockDisplay');
        if (!el) return;
        const n = new Date();
        el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
    }
    setInterval(tick, 15000);
    tick();

    // Page Load Handler
    let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:page1-import-page', (value) => {
        if (value && value['loaded']) {
            onInit();
            setTimeout(() => CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:page1-import-page', loadedSubId), 100);
        }
    });

    return {};
}})();


/* page10.js */
const page10Module = (() => {
    'use strict';

    function onInit() {
        console.log('✅ Page 1 Initialized with 4 Widgets');

        setupButtonEventListeners();
        setupSliders();
        setupFeedbackSubscriptions();
        requestCurrentStatus();
        setupTopNavigation();
        initializeWidgets();
    }

    // ====================== WIDGET MANAGEMENT ======================
    function initializeWidgets() {
        const firstTab = document.querySelector('.tab-btn.active');
        if (firstTab) {
            const widgetName = firstTab.getAttribute('data-widget') || 'lights';
            switchWidget(widgetName, firstTab);
        }
    }

    window.switchWidget = function(widgetName, clickedBtn) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        // Switch visible widget
        document.querySelectorAll('.widget').forEach(w => w.classList.remove('active'));
        const activeWidget = document.getElementById('widget-' + widgetName);
        if (activeWidget) activeWidget.classList.add('active');

        // Optional: Send to Crestron
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('s', 'active_widget_name', widgetName);
        }
    };

    window.switchTVSubWidget = function(subwidgetName, clickedBtn) {
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        
        document.querySelectorAll('.tv-subwidget').forEach(w => w.classList.remove('active'));
        document.getElementById(subwidgetName).classList.add('active');
    };

    // ====================== SHARED FUNCTIONS ======================
    function toggleTile(name, cls) {
        const tog = document.getElementById('tog-' + name);
        const tile = document.getElementById('tile-' + name);
        const lbl = document.getElementById('lbl-' + name);
        if (!tog || !tile || !lbl) return;

        const isOn = tog.checked;
        tile.classList.toggle(cls, isOn);
        lbl.textContent = isOn ? 'ON' : 'OFF';

        if (name === 'lights') setStatus(isOn ? 'on' : 'off');
    }

    function setStatus(s) {
        const pill = document.getElementById('statusPill');
        const text = document.getElementById('lightingStatus');
        if (!pill || !text) return;

        pill.className = 'spill';
        if (s === 'on')  { pill.classList.add('sp-on');  text.textContent = 'Lights: ON'; }
        if (s === 'off') { pill.classList.add('sp-off'); text.textContent = 'Lights: OFF'; }
        if (s === 'dim') { pill.classList.add('sp-dim'); text.textContent = 'Lights: DIMMED'; }
    }

    function updateDial(pct) {
        const fill = document.getElementById('arc-fill');
        const label = document.getElementById('arc-label');
        if (!fill) return;

        const cx = 100, cy = 105, r = 76;
        const deg = -180 + pct * 1.8;
        const rad = deg * Math.PI / 180;
        const ex = cx + r * Math.cos(rad);
        const ey = cy + r * Math.sin(rad);

        if (pct <= 0) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 24.001 105');
        } else if (pct >= 100) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 176 105');
        } else {
            fill.setAttribute('d', `M 24 105 A 76 76 0 ${pct > 50 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== SLIDERS & BUTTONS ======================
    function setupSliders() {
        // Dimmer Slider (Lights Widget)
        const dimSlider = document.getElementById('dimLevelSlider');
        if (dimSlider) {
            dimSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '31', v);
            });
        }

        // Shades Slider
        const shadeSlider = document.getElementById('shadeSlider');
        if (shadeSlider) {
            shadeSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('shadeValue').textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '36', v);
            });
        }

        // ==================== NEW: AC Setpoint Slider ====================
        const acSlider = document.getElementById('acSetpointSlider');
        if (acSlider) {
            acSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                const display = document.getElementById('acSetValue');
                if (display) display.textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '41', v);
            });
        }
    }

    function setupButtonEventListeners() {
        // Lights Quick Buttons
        document.getElementById('lightsOnBtn')?.addEventListener('click', () => {
            setStatus('on');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = true; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '10', true);
                setTimeout(() => CrComLib.publishEvent('b', '10', false), 100);
            }
        });

        document.getElementById('lightsOffBtn')?.addEventListener('click', () => {
            setStatus('off');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = false; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '11', true);
                setTimeout(() => CrComLib.publishEvent('b', '11', false), 100);
            }
        });

        document.getElementById('lightsDimBtn')?.addEventListener('click', () => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) {
                slider.value = 50;
                const v = 50;
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('n', '31', v);
                    CrComLib.publishEvent('b', '12', true);
                    setTimeout(() => CrComLib.publishEvent('b', '12', false), 100);
                }
            }
        });

        

        // Shades Buttons
        document.getElementById('shadeUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '50', true);
                setTimeout(() => CrComLib.publishEvent('b', '50', false), 100);
            }
        });
        document.getElementById('shadeStopBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '52', true);
                setTimeout(() => CrComLib.publishEvent('b', '52', false), 100);
            }
        });
        document.getElementById('shadeDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '51', true);
                setTimeout(() => CrComLib.publishEvent('b', '51', false), 100);
            }
        });

        // ==================== NEW: AC CONTROLS ====================
        // AC Power Toggle (pulses on every change - matches Crestron toggle behavior)
        const acToggle = document.getElementById('tog-ac');
        if (acToggle) {
            acToggle.addEventListener('change', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', '70', true);
                    setTimeout(() => CrComLib.publishEvent('b', '70', false), 100);
                }
            });
        }

        // AC Modes
        document.getElementById('acCoolBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '71', true);
                setTimeout(() => CrComLib.publishEvent('b', '71', false), 100);
            }
        });
        document.getElementById('acHeatBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '72', true);
                setTimeout(() => CrComLib.publishEvent('b', '72', false), 100);
            }
        });
        document.getElementById('acAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '73', true);
                setTimeout(() => CrComLib.publishEvent('b', '73', false), 100);
            }
        });
        document.getElementById('acDryBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '74', true);
                setTimeout(() => CrComLib.publishEvent('b', '74', false), 100);
            }
        });
        document.getElementById('acFanBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '75', true);
                setTimeout(() => CrComLib.publishEvent('b', '75', false), 100);
            }
        });

        // AC Fan Speeds
        document.getElementById('acFanLowBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '76', true);
                setTimeout(() => CrComLib.publishEvent('b', '76', false), 100);
            }
        });
        document.getElementById('acFanMedBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '77', true);
                setTimeout(() => CrComLib.publishEvent('b', '77', false), 100);
            }
        });
        document.getElementById('acFanHighBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '78', true);
                setTimeout(() => CrComLib.publishEvent('b', '78', false), 100);
            }
        });
        document.getElementById('acFanAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '79', true);
                setTimeout(() => CrComLib.publishEvent('b', '79', false), 100);
            }
        });

        // AC Swing
        document.getElementById('acSwingBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '81', true);
                setTimeout(() => CrComLib.publishEvent('b', '81', false), 100);
            }
        });

        // ====================== TV BUTTONS & REMOTE ======================

        // Quick Action Buttons (Top of TV Widget)
        document.getElementById('tvPowerBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvNetflixBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '61', true);
                setTimeout(() => CrComLib.publishEvent('b', '61', false), 100);
            }
        });

        document.getElementById('tvHdmiBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '62', true);
                setTimeout(() => CrComLib.publishEvent('b', '62', false), 100);
            }
        });

        // ==================== TV REMOTE CONTROLS (Inside TV Controls Sub-Widget) ====================

        // Power & Source Buttons (inside remote)
        document.getElementById('tvPowerBtn2')?.addEventListener('click', () => {   // tvPowerBtn2 is the one in remote
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvSourceBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '68', true);   // You can change join number
                setTimeout(() => CrComLib.publishEvent('b', '68', false), 100);
            }
        });

        // ==================== D-PAD ====================
        document.getElementById('tvDpadUp')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '63', true);
                setTimeout(() => CrComLib.publishEvent('b', '63', false), 100);
            }
        });

        document.getElementById('tvDpadDown')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '64', true);
                setTimeout(() => CrComLib.publishEvent('b', '64', false), 100);
            }
        });

        document.getElementById('tvDpadLeft')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '65', true);
                setTimeout(() => CrComLib.publishEvent('b', '65', false), 100);
            }
        });

        document.getElementById('tvDpadRight')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '66', true);
                setTimeout(() => CrComLib.publishEvent('b', '66', false), 100);
            }
        });

        document.getElementById('tvDpadOk')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '67', true);
                setTimeout(() => CrComLib.publishEvent('b', '67', false), 100);
            }
        });

        // ==================== NUMERIC KEYPAD (0-9 + Enter) ====================
        for (let i = 0; i <= 9; i++) {
            const keyBtn = document.getElementById('tvKey' + i);
            if (keyBtn) {
                keyBtn.addEventListener('click', () => {
                    if (typeof CrComLib !== 'undefined') {
                        // Joins 90 to 99 for digits
                        CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), true);
                        setTimeout(() => CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), false), 100);
                    }
                });
            }
        }

        document.getElementById('tvKeyEnter')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '100', true);   // Enter button join
                setTimeout(() => CrComLib.publishEvent('b', '100', false), 100);
            }
        });

        // ==================== VOLUME & CHANNEL CONTROLS ====================
        document.getElementById('tvVolUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '101', true);
                setTimeout(() => CrComLib.publishEvent('b', '101', false), 100);
            }
        });

        document.getElementById('tvVolDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '102', true);
                setTimeout(() => CrComLib.publishEvent('b', '102', false), 100);
            }
        });

        document.getElementById('tvMuteBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '103', true);
                setTimeout(() => CrComLib.publishEvent('b', '103', false), 100);
            }
        });

        document.getElementById('tvChUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '104', true);
                setTimeout(() => CrComLib.publishEvent('b', '104', false), 100);
            }
        });

        document.getElementById('tvChDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '105', true);
                setTimeout(() => CrComLib.publishEvent('b', '105', false), 100);
            }
        });

        // ==================== FAVORITES GRID (Dynamic) ====================
        // Example: Assign joins starting from 110 onwards
        const favButtons = document.querySelectorAll('.fav-btn');
        favButtons.forEach((btn, index) => {
            const joinNumber = 110 + index;   // 110, 111, 112 ...
        
            btn.addEventListener('click', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', String(joinNumber), true);
                    setTimeout(() => CrComLib.publishEvent('b', String(joinNumber), false), 100);
                }
                console.log(`Favorite ${index + 1} pressed → Digital Join ${joinNumber}`);
            });
        });
        

    function setupFeedbackSubscriptions() {
        // Existing dimmer feedback
        CrComLib.subscribeState('n', '30', (val) => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) slider.value = val;
            document.getElementById('dimValue').textContent = val;
            document.getElementById('dimPercentage').textContent = val + '%';
            updateDial(val);
        });

        // ==================== NEW: AC Feedback ====================
        CrComLib.subscribeState('n', '40', (val) => {
            const currentEl = document.getElementById('acCurrentTemp');
            if (currentEl) currentEl.textContent = Math.round(val) + '°C';
        });
    }

    function requestCurrentStatus() {
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('b', '99', true);
            setTimeout(() => CrComLib.publishEvent('b', '99', false), 100);
        }
    }

    function setupTopNavigation() {
        CrComLib.publishEvent("b", "active_state_class_page10", true);
    }

    // Clock
    function tick() {
        const el = document.getElementById('clockDisplay');
        if (!el) return;
        const n = new Date();
        el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
    }
    setInterval(tick, 15000);
    tick();

    // Page Load Handler
    let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:page10-import-page', (value) => {
        if (value && value['loaded']) {
            onInit();
            setTimeout(() => CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:page10-import-page', loadedSubId), 100);
        }
    });

    return {};
}})();


/* page2.js */
const page2Module = (() => {
    'use strict';

    function onInit() {
        console.log('✅ Page 1 Initialized with 4 Widgets');

        setupButtonEventListeners();
        setupSliders();
        setupFeedbackSubscriptions();
        requestCurrentStatus();
        setupTopNavigation();
        initializeWidgets();
    }

    // ====================== WIDGET MANAGEMENT ======================
    function initializeWidgets() {
        const firstTab = document.querySelector('.tab-btn.active');
        if (firstTab) {
            const widgetName = firstTab.getAttribute('data-widget') || 'lights';
            switchWidget(widgetName, firstTab);
        }
    }

    window.switchWidget = function(widgetName, clickedBtn) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        // Switch visible widget
        document.querySelectorAll('.widget').forEach(w => w.classList.remove('active'));
        const activeWidget = document.getElementById('widget-' + widgetName);
        if (activeWidget) activeWidget.classList.add('active');

        // Optional: Send to Crestron
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('s', 'active_widget_name', widgetName);
        }
    };

    window.switchTVSubWidget = function(subwidgetName, clickedBtn) {
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        
        document.querySelectorAll('.tv-subwidget').forEach(w => w.classList.remove('active'));
        document.getElementById(subwidgetName).classList.add('active');
    };

    // ====================== SHARED FUNCTIONS ======================
    function toggleTile(name, cls) {
        const tog = document.getElementById('tog-' + name);
        const tile = document.getElementById('tile-' + name);
        const lbl = document.getElementById('lbl-' + name);
        if (!tog || !tile || !lbl) return;

        const isOn = tog.checked;
        tile.classList.toggle(cls, isOn);
        lbl.textContent = isOn ? 'ON' : 'OFF';

        if (name === 'lights') setStatus(isOn ? 'on' : 'off');
    }

    function setStatus(s) {
        const pill = document.getElementById('statusPill');
        const text = document.getElementById('lightingStatus');
        if (!pill || !text) return;

        pill.className = 'spill';
        if (s === 'on')  { pill.classList.add('sp-on');  text.textContent = 'Lights: ON'; }
        if (s === 'off') { pill.classList.add('sp-off'); text.textContent = 'Lights: OFF'; }
        if (s === 'dim') { pill.classList.add('sp-dim'); text.textContent = 'Lights: DIMMED'; }
    }

    function updateDial(pct) {
        const fill = document.getElementById('arc-fill');
        const label = document.getElementById('arc-label');
        if (!fill) return;

        const cx = 100, cy = 105, r = 76;
        const deg = -180 + pct * 1.8;
        const rad = deg * Math.PI / 180;
        const ex = cx + r * Math.cos(rad);
        const ey = cy + r * Math.sin(rad);

        if (pct <= 0) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 24.001 105');
        } else if (pct >= 100) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 176 105');
        } else {
            fill.setAttribute('d', `M 24 105 A 76 76 0 ${pct > 50 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== SLIDERS & BUTTONS ======================
    function setupSliders() {
        // Dimmer Slider (Lights Widget)
        const dimSlider = document.getElementById('dimLevelSlider');
        if (dimSlider) {
            dimSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '31', v);
            });
        }

        // Shades Slider
        const shadeSlider = document.getElementById('shadeSlider');
        if (shadeSlider) {
            shadeSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('shadeValue').textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '36', v);
            });
        }

        // ==================== NEW: AC Setpoint Slider ====================
        const acSlider = document.getElementById('acSetpointSlider');
        if (acSlider) {
            acSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                const display = document.getElementById('acSetValue');
                if (display) display.textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '41', v);
            });
        }
    }

    function setupButtonEventListeners() {
        // Lights Quick Buttons
        document.getElementById('lightsOnBtn')?.addEventListener('click', () => {
            setStatus('on');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = true; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '10', true);
                setTimeout(() => CrComLib.publishEvent('b', '10', false), 100);
            }
        });

        document.getElementById('lightsOffBtn')?.addEventListener('click', () => {
            setStatus('off');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = false; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '11', true);
                setTimeout(() => CrComLib.publishEvent('b', '11', false), 100);
            }
        });

        document.getElementById('lightsDimBtn')?.addEventListener('click', () => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) {
                slider.value = 50;
                const v = 50;
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('n', '31', v);
                    CrComLib.publishEvent('b', '12', true);
                    setTimeout(() => CrComLib.publishEvent('b', '12', false), 100);
                }
            }
        });

        

        // Shades Buttons
        document.getElementById('shadeUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '50', true);
                setTimeout(() => CrComLib.publishEvent('b', '50', false), 100);
            }
        });
        document.getElementById('shadeStopBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '52', true);
                setTimeout(() => CrComLib.publishEvent('b', '52', false), 100);
            }
        });
        document.getElementById('shadeDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '51', true);
                setTimeout(() => CrComLib.publishEvent('b', '51', false), 100);
            }
        });

        // ==================== NEW: AC CONTROLS ====================
        // AC Power Toggle (pulses on every change - matches Crestron toggle behavior)
        const acToggle = document.getElementById('tog-ac');
        if (acToggle) {
            acToggle.addEventListener('change', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', '70', true);
                    setTimeout(() => CrComLib.publishEvent('b', '70', false), 100);
                }
            });
        }

        // AC Modes
        document.getElementById('acCoolBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '71', true);
                setTimeout(() => CrComLib.publishEvent('b', '71', false), 100);
            }
        });
        document.getElementById('acHeatBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '72', true);
                setTimeout(() => CrComLib.publishEvent('b', '72', false), 100);
            }
        });
        document.getElementById('acAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '73', true);
                setTimeout(() => CrComLib.publishEvent('b', '73', false), 100);
            }
        });
        document.getElementById('acDryBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '74', true);
                setTimeout(() => CrComLib.publishEvent('b', '74', false), 100);
            }
        });
        document.getElementById('acFanBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '75', true);
                setTimeout(() => CrComLib.publishEvent('b', '75', false), 100);
            }
        });

        // AC Fan Speeds
        document.getElementById('acFanLowBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '76', true);
                setTimeout(() => CrComLib.publishEvent('b', '76', false), 100);
            }
        });
        document.getElementById('acFanMedBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '77', true);
                setTimeout(() => CrComLib.publishEvent('b', '77', false), 100);
            }
        });
        document.getElementById('acFanHighBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '78', true);
                setTimeout(() => CrComLib.publishEvent('b', '78', false), 100);
            }
        });
        document.getElementById('acFanAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '79', true);
                setTimeout(() => CrComLib.publishEvent('b', '79', false), 100);
            }
        });

        // AC Swing
        document.getElementById('acSwingBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '81', true);
                setTimeout(() => CrComLib.publishEvent('b', '81', false), 100);
            }
        });

        // ====================== TV BUTTONS & REMOTE ======================

        // Quick Action Buttons (Top of TV Widget)
        document.getElementById('tvPowerBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvNetflixBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '61', true);
                setTimeout(() => CrComLib.publishEvent('b', '61', false), 100);
            }
        });

        document.getElementById('tvHdmiBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '62', true);
                setTimeout(() => CrComLib.publishEvent('b', '62', false), 100);
            }
        });

        // ==================== TV REMOTE CONTROLS (Inside TV Controls Sub-Widget) ====================

        // Power & Source Buttons (inside remote)
        document.getElementById('tvPowerBtn2')?.addEventListener('click', () => {   // tvPowerBtn2 is the one in remote
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvSourceBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '68', true);   // You can change join number
                setTimeout(() => CrComLib.publishEvent('b', '68', false), 100);
            }
        });

        // ==================== D-PAD ====================
        document.getElementById('tvDpadUp')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '63', true);
                setTimeout(() => CrComLib.publishEvent('b', '63', false), 100);
            }
        });

        document.getElementById('tvDpadDown')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '64', true);
                setTimeout(() => CrComLib.publishEvent('b', '64', false), 100);
            }
        });

        document.getElementById('tvDpadLeft')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '65', true);
                setTimeout(() => CrComLib.publishEvent('b', '65', false), 100);
            }
        });

        document.getElementById('tvDpadRight')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '66', true);
                setTimeout(() => CrComLib.publishEvent('b', '66', false), 100);
            }
        });

        document.getElementById('tvDpadOk')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '67', true);
                setTimeout(() => CrComLib.publishEvent('b', '67', false), 100);
            }
        });

        // ==================== NUMERIC KEYPAD (0-9 + Enter) ====================
        for (let i = 0; i <= 9; i++) {
            const keyBtn = document.getElementById('tvKey' + i);
            if (keyBtn) {
                keyBtn.addEventListener('click', () => {
                    if (typeof CrComLib !== 'undefined') {
                        // Joins 90 to 99 for digits
                        CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), true);
                        setTimeout(() => CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), false), 100);
                    }
                });
            }
        }

        document.getElementById('tvKeyEnter')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '100', true);   // Enter button join
                setTimeout(() => CrComLib.publishEvent('b', '100', false), 100);
            }
        });

        // ==================== VOLUME & CHANNEL CONTROLS ====================
        document.getElementById('tvVolUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '101', true);
                setTimeout(() => CrComLib.publishEvent('b', '101', false), 100);
            }
        });

        document.getElementById('tvVolDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '102', true);
                setTimeout(() => CrComLib.publishEvent('b', '102', false), 100);
            }
        });

        document.getElementById('tvMuteBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '103', true);
                setTimeout(() => CrComLib.publishEvent('b', '103', false), 100);
            }
        });

        document.getElementById('tvChUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '104', true);
                setTimeout(() => CrComLib.publishEvent('b', '104', false), 100);
            }
        });

        document.getElementById('tvChDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '105', true);
                setTimeout(() => CrComLib.publishEvent('b', '105', false), 100);
            }
        });

        // ==================== FAVORITES GRID (Dynamic) ====================
        // Example: Assign joins starting from 110 onwards
        const favButtons = document.querySelectorAll('.fav-btn');
        favButtons.forEach((btn, index) => {
            const joinNumber = 110 + index;   // 110, 111, 112 ...
        
            btn.addEventListener('click', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', String(joinNumber), true);
                    setTimeout(() => CrComLib.publishEvent('b', String(joinNumber), false), 100);
                }
                console.log(`Favorite ${index + 1} pressed → Digital Join ${joinNumber}`);
            });
        });
        

    function setupFeedbackSubscriptions() {
        // Existing dimmer feedback
        CrComLib.subscribeState('n', '30', (val) => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) slider.value = val;
            document.getElementById('dimValue').textContent = val;
            document.getElementById('dimPercentage').textContent = val + '%';
            updateDial(val);
        });

        // ==================== NEW: AC Feedback ====================
        CrComLib.subscribeState('n', '40', (val) => {
            const currentEl = document.getElementById('acCurrentTemp');
            if (currentEl) currentEl.textContent = Math.round(val) + '°C';
        });
    }

    function requestCurrentStatus() {
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('b', '99', true);
            setTimeout(() => CrComLib.publishEvent('b', '99', false), 100);
        }
    }

    function setupTopNavigation() {
        CrComLib.publishEvent("b", "active_state_class_page2", true);
    }

    // Clock
    function tick() {
        const el = document.getElementById('clockDisplay');
        if (!el) return;
        const n = new Date();
        el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
    }
    setInterval(tick, 15000);
    tick();

    // Page Load Handler
    let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:page2-import-page', (value) => {
        if (value && value['loaded']) {
            onInit();
            setTimeout(() => CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:page2-import-page', loadedSubId), 100);
        }
    });

    return {};
}})();


/* page3.js */
const page3Module = (() => {
    'use strict';

    function onInit() {
        console.log('✅ Page 1 Initialized with 4 Widgets');

        setupButtonEventListeners();
        setupSliders();
        setupFeedbackSubscriptions();
        requestCurrentStatus();
        setupTopNavigation();
        initializeWidgets();
    }

    // ====================== WIDGET MANAGEMENT ======================
    function initializeWidgets() {
        const firstTab = document.querySelector('.tab-btn.active');
        if (firstTab) {
            const widgetName = firstTab.getAttribute('data-widget') || 'lights';
            switchWidget(widgetName, firstTab);
        }
    }

    window.switchWidget = function(widgetName, clickedBtn) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        // Switch visible widget
        document.querySelectorAll('.widget').forEach(w => w.classList.remove('active'));
        const activeWidget = document.getElementById('widget-' + widgetName);
        if (activeWidget) activeWidget.classList.add('active');

        // Optional: Send to Crestron
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('s', 'active_widget_name', widgetName);
        }
    };

    window.switchTVSubWidget = function(subwidgetName, clickedBtn) {
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        
        document.querySelectorAll('.tv-subwidget').forEach(w => w.classList.remove('active'));
        document.getElementById(subwidgetName).classList.add('active');
    };

    // ====================== SHARED FUNCTIONS ======================
    function toggleTile(name, cls) {
        const tog = document.getElementById('tog-' + name);
        const tile = document.getElementById('tile-' + name);
        const lbl = document.getElementById('lbl-' + name);
        if (!tog || !tile || !lbl) return;

        const isOn = tog.checked;
        tile.classList.toggle(cls, isOn);
        lbl.textContent = isOn ? 'ON' : 'OFF';

        if (name === 'lights') setStatus(isOn ? 'on' : 'off');
    }

    function setStatus(s) {
        const pill = document.getElementById('statusPill');
        const text = document.getElementById('lightingStatus');
        if (!pill || !text) return;

        pill.className = 'spill';
        if (s === 'on')  { pill.classList.add('sp-on');  text.textContent = 'Lights: ON'; }
        if (s === 'off') { pill.classList.add('sp-off'); text.textContent = 'Lights: OFF'; }
        if (s === 'dim') { pill.classList.add('sp-dim'); text.textContent = 'Lights: DIMMED'; }
    }

    function updateDial(pct) {
        const fill = document.getElementById('arc-fill');
        const label = document.getElementById('arc-label');
        if (!fill) return;

        const cx = 100, cy = 105, r = 76;
        const deg = -180 + pct * 1.8;
        const rad = deg * Math.PI / 180;
        const ex = cx + r * Math.cos(rad);
        const ey = cy + r * Math.sin(rad);

        if (pct <= 0) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 24.001 105');
        } else if (pct >= 100) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 176 105');
        } else {
            fill.setAttribute('d', `M 24 105 A 76 76 0 ${pct > 50 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== SLIDERS & BUTTONS ======================
    function setupSliders() {
        // Dimmer Slider (Lights Widget)
        const dimSlider = document.getElementById('dimLevelSlider');
        if (dimSlider) {
            dimSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '31', v);
            });
        }

        // Shades Slider
        const shadeSlider = document.getElementById('shadeSlider');
        if (shadeSlider) {
            shadeSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('shadeValue').textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '36', v);
            });
        }

        // ==================== NEW: AC Setpoint Slider ====================
        const acSlider = document.getElementById('acSetpointSlider');
        if (acSlider) {
            acSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                const display = document.getElementById('acSetValue');
                if (display) display.textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '41', v);
            });
        }
    }

    function setupButtonEventListeners() {
        // Lights Quick Buttons
        document.getElementById('lightsOnBtn')?.addEventListener('click', () => {
            setStatus('on');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = true; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '10', true);
                setTimeout(() => CrComLib.publishEvent('b', '10', false), 100);
            }
        });

        document.getElementById('lightsOffBtn')?.addEventListener('click', () => {
            setStatus('off');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = false; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '11', true);
                setTimeout(() => CrComLib.publishEvent('b', '11', false), 100);
            }
        });

        document.getElementById('lightsDimBtn')?.addEventListener('click', () => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) {
                slider.value = 50;
                const v = 50;
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('n', '31', v);
                    CrComLib.publishEvent('b', '12', true);
                    setTimeout(() => CrComLib.publishEvent('b', '12', false), 100);
                }
            }
        });

        

        // Shades Buttons
        document.getElementById('shadeUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '50', true);
                setTimeout(() => CrComLib.publishEvent('b', '50', false), 100);
            }
        });
        document.getElementById('shadeStopBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '52', true);
                setTimeout(() => CrComLib.publishEvent('b', '52', false), 100);
            }
        });
        document.getElementById('shadeDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '51', true);
                setTimeout(() => CrComLib.publishEvent('b', '51', false), 100);
            }
        });

        // ==================== NEW: AC CONTROLS ====================
        // AC Power Toggle (pulses on every change - matches Crestron toggle behavior)
        const acToggle = document.getElementById('tog-ac');
        if (acToggle) {
            acToggle.addEventListener('change', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', '70', true);
                    setTimeout(() => CrComLib.publishEvent('b', '70', false), 100);
                }
            });
        }

        // AC Modes
        document.getElementById('acCoolBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '71', true);
                setTimeout(() => CrComLib.publishEvent('b', '71', false), 100);
            }
        });
        document.getElementById('acHeatBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '72', true);
                setTimeout(() => CrComLib.publishEvent('b', '72', false), 100);
            }
        });
        document.getElementById('acAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '73', true);
                setTimeout(() => CrComLib.publishEvent('b', '73', false), 100);
            }
        });
        document.getElementById('acDryBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '74', true);
                setTimeout(() => CrComLib.publishEvent('b', '74', false), 100);
            }
        });
        document.getElementById('acFanBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '75', true);
                setTimeout(() => CrComLib.publishEvent('b', '75', false), 100);
            }
        });

        // AC Fan Speeds
        document.getElementById('acFanLowBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '76', true);
                setTimeout(() => CrComLib.publishEvent('b', '76', false), 100);
            }
        });
        document.getElementById('acFanMedBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '77', true);
                setTimeout(() => CrComLib.publishEvent('b', '77', false), 100);
            }
        });
        document.getElementById('acFanHighBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '78', true);
                setTimeout(() => CrComLib.publishEvent('b', '78', false), 100);
            }
        });
        document.getElementById('acFanAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '79', true);
                setTimeout(() => CrComLib.publishEvent('b', '79', false), 100);
            }
        });

        // AC Swing
        document.getElementById('acSwingBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '81', true);
                setTimeout(() => CrComLib.publishEvent('b', '81', false), 100);
            }
        });

        // ====================== TV BUTTONS & REMOTE ======================

        // Quick Action Buttons (Top of TV Widget)
        document.getElementById('tvPowerBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvNetflixBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '61', true);
                setTimeout(() => CrComLib.publishEvent('b', '61', false), 100);
            }
        });

        document.getElementById('tvHdmiBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '62', true);
                setTimeout(() => CrComLib.publishEvent('b', '62', false), 100);
            }
        });

        // ==================== TV REMOTE CONTROLS (Inside TV Controls Sub-Widget) ====================

        // Power & Source Buttons (inside remote)
        document.getElementById('tvPowerBtn2')?.addEventListener('click', () => {   // tvPowerBtn2 is the one in remote
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvSourceBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '68', true);   // You can change join number
                setTimeout(() => CrComLib.publishEvent('b', '68', false), 100);
            }
        });

        // ==================== D-PAD ====================
        document.getElementById('tvDpadUp')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '63', true);
                setTimeout(() => CrComLib.publishEvent('b', '63', false), 100);
            }
        });

        document.getElementById('tvDpadDown')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '64', true);
                setTimeout(() => CrComLib.publishEvent('b', '64', false), 100);
            }
        });

        document.getElementById('tvDpadLeft')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '65', true);
                setTimeout(() => CrComLib.publishEvent('b', '65', false), 100);
            }
        });

        document.getElementById('tvDpadRight')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '66', true);
                setTimeout(() => CrComLib.publishEvent('b', '66', false), 100);
            }
        });

        document.getElementById('tvDpadOk')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '67', true);
                setTimeout(() => CrComLib.publishEvent('b', '67', false), 100);
            }
        });

        // ==================== NUMERIC KEYPAD (0-9 + Enter) ====================
        for (let i = 0; i <= 9; i++) {
            const keyBtn = document.getElementById('tvKey' + i);
            if (keyBtn) {
                keyBtn.addEventListener('click', () => {
                    if (typeof CrComLib !== 'undefined') {
                        // Joins 90 to 99 for digits
                        CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), true);
                        setTimeout(() => CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), false), 100);
                    }
                });
            }
        }

        document.getElementById('tvKeyEnter')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '100', true);   // Enter button join
                setTimeout(() => CrComLib.publishEvent('b', '100', false), 100);
            }
        });

        // ==================== VOLUME & CHANNEL CONTROLS ====================
        document.getElementById('tvVolUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '101', true);
                setTimeout(() => CrComLib.publishEvent('b', '101', false), 100);
            }
        });

        document.getElementById('tvVolDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '102', true);
                setTimeout(() => CrComLib.publishEvent('b', '102', false), 100);
            }
        });

        document.getElementById('tvMuteBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '103', true);
                setTimeout(() => CrComLib.publishEvent('b', '103', false), 100);
            }
        });

        document.getElementById('tvChUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '104', true);
                setTimeout(() => CrComLib.publishEvent('b', '104', false), 100);
            }
        });

        document.getElementById('tvChDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '105', true);
                setTimeout(() => CrComLib.publishEvent('b', '105', false), 100);
            }
        });

        // ==================== FAVORITES GRID (Dynamic) ====================
        // Example: Assign joins starting from 110 onwards
        const favButtons = document.querySelectorAll('.fav-btn');
        favButtons.forEach((btn, index) => {
            const joinNumber = 110 + index;   // 110, 111, 112 ...
        
            btn.addEventListener('click', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', String(joinNumber), true);
                    setTimeout(() => CrComLib.publishEvent('b', String(joinNumber), false), 100);
                }
                console.log(`Favorite ${index + 1} pressed → Digital Join ${joinNumber}`);
            });
        });
        

    function setupFeedbackSubscriptions() {
        // Existing dimmer feedback
        CrComLib.subscribeState('n', '30', (val) => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) slider.value = val;
            document.getElementById('dimValue').textContent = val;
            document.getElementById('dimPercentage').textContent = val + '%';
            updateDial(val);
        });

        // ==================== NEW: AC Feedback ====================
        CrComLib.subscribeState('n', '40', (val) => {
            const currentEl = document.getElementById('acCurrentTemp');
            if (currentEl) currentEl.textContent = Math.round(val) + '°C';
        });
    }

    function requestCurrentStatus() {
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('b', '99', true);
            setTimeout(() => CrComLib.publishEvent('b', '99', false), 100);
        }
    }

    function setupTopNavigation() {
        CrComLib.publishEvent("b", "active_state_class_page3", true);
    }

    // Clock
    function tick() {
        const el = document.getElementById('clockDisplay');
        if (!el) return;
        const n = new Date();
        el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
    }
    setInterval(tick, 15000);
    tick();

    // Page Load Handler
    let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:page3-import-page', (value) => {
        if (value && value['loaded']) {
            onInit();
            setTimeout(() => CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:page3-import-page', loadedSubId), 100);
        }
    });

    return {};
}})();


/* page4.js */
const page4Module = (() => {
    'use strict';

    function onInit() {
        console.log('✅ Page 1 Initialized with 4 Widgets');

        setupButtonEventListeners();
        setupSliders();
        setupFeedbackSubscriptions();
        requestCurrentStatus();
        setupTopNavigation();
        initializeWidgets();
    }

    // ====================== WIDGET MANAGEMENT ======================
    function initializeWidgets() {
        const firstTab = document.querySelector('.tab-btn.active');
        if (firstTab) {
            const widgetName = firstTab.getAttribute('data-widget') || 'lights';
            switchWidget(widgetName, firstTab);
        }
    }

    window.switchWidget = function(widgetName, clickedBtn) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        // Switch visible widget
        document.querySelectorAll('.widget').forEach(w => w.classList.remove('active'));
        const activeWidget = document.getElementById('widget-' + widgetName);
        if (activeWidget) activeWidget.classList.add('active');

        // Optional: Send to Crestron
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('s', 'active_widget_name', widgetName);
        }
    };

    window.switchTVSubWidget = function(subwidgetName, clickedBtn) {
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        
        document.querySelectorAll('.tv-subwidget').forEach(w => w.classList.remove('active'));
        document.getElementById(subwidgetName).classList.add('active');
    };

    // ====================== SHARED FUNCTIONS ======================
    function toggleTile(name, cls) {
        const tog = document.getElementById('tog-' + name);
        const tile = document.getElementById('tile-' + name);
        const lbl = document.getElementById('lbl-' + name);
        if (!tog || !tile || !lbl) return;

        const isOn = tog.checked;
        tile.classList.toggle(cls, isOn);
        lbl.textContent = isOn ? 'ON' : 'OFF';

        if (name === 'lights') setStatus(isOn ? 'on' : 'off');
    }

    function setStatus(s) {
        const pill = document.getElementById('statusPill');
        const text = document.getElementById('lightingStatus');
        if (!pill || !text) return;

        pill.className = 'spill';
        if (s === 'on')  { pill.classList.add('sp-on');  text.textContent = 'Lights: ON'; }
        if (s === 'off') { pill.classList.add('sp-off'); text.textContent = 'Lights: OFF'; }
        if (s === 'dim') { pill.classList.add('sp-dim'); text.textContent = 'Lights: DIMMED'; }
    }

    function updateDial(pct) {
        const fill = document.getElementById('arc-fill');
        const label = document.getElementById('arc-label');
        if (!fill) return;

        const cx = 100, cy = 105, r = 76;
        const deg = -180 + pct * 1.8;
        const rad = deg * Math.PI / 180;
        const ex = cx + r * Math.cos(rad);
        const ey = cy + r * Math.sin(rad);

        if (pct <= 0) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 24.001 105');
        } else if (pct >= 100) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 176 105');
        } else {
            fill.setAttribute('d', `M 24 105 A 76 76 0 ${pct > 50 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== SLIDERS & BUTTONS ======================
    function setupSliders() {
        // Dimmer Slider (Lights Widget)
        const dimSlider = document.getElementById('dimLevelSlider');
        if (dimSlider) {
            dimSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '31', v);
            });
        }

        // Shades Slider
        const shadeSlider = document.getElementById('shadeSlider');
        if (shadeSlider) {
            shadeSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('shadeValue').textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '36', v);
            });
        }

        // ==================== NEW: AC Setpoint Slider ====================
        const acSlider = document.getElementById('acSetpointSlider');
        if (acSlider) {
            acSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                const display = document.getElementById('acSetValue');
                if (display) display.textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '41', v);
            });
        }
    }

    function setupButtonEventListeners() {
        // Lights Quick Buttons
        document.getElementById('lightsOnBtn')?.addEventListener('click', () => {
            setStatus('on');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = true; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '10', true);
                setTimeout(() => CrComLib.publishEvent('b', '10', false), 100);
            }
        });

        document.getElementById('lightsOffBtn')?.addEventListener('click', () => {
            setStatus('off');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = false; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '11', true);
                setTimeout(() => CrComLib.publishEvent('b', '11', false), 100);
            }
        });

        document.getElementById('lightsDimBtn')?.addEventListener('click', () => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) {
                slider.value = 50;
                const v = 50;
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('n', '31', v);
                    CrComLib.publishEvent('b', '12', true);
                    setTimeout(() => CrComLib.publishEvent('b', '12', false), 100);
                }
            }
        });

        

        // Shades Buttons
        document.getElementById('shadeUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '50', true);
                setTimeout(() => CrComLib.publishEvent('b', '50', false), 100);
            }
        });
        document.getElementById('shadeStopBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '52', true);
                setTimeout(() => CrComLib.publishEvent('b', '52', false), 100);
            }
        });
        document.getElementById('shadeDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '51', true);
                setTimeout(() => CrComLib.publishEvent('b', '51', false), 100);
            }
        });

        // ==================== NEW: AC CONTROLS ====================
        // AC Power Toggle (pulses on every change - matches Crestron toggle behavior)
        const acToggle = document.getElementById('tog-ac');
        if (acToggle) {
            acToggle.addEventListener('change', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', '70', true);
                    setTimeout(() => CrComLib.publishEvent('b', '70', false), 100);
                }
            });
        }

        // AC Modes
        document.getElementById('acCoolBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '71', true);
                setTimeout(() => CrComLib.publishEvent('b', '71', false), 100);
            }
        });
        document.getElementById('acHeatBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '72', true);
                setTimeout(() => CrComLib.publishEvent('b', '72', false), 100);
            }
        });
        document.getElementById('acAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '73', true);
                setTimeout(() => CrComLib.publishEvent('b', '73', false), 100);
            }
        });
        document.getElementById('acDryBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '74', true);
                setTimeout(() => CrComLib.publishEvent('b', '74', false), 100);
            }
        });
        document.getElementById('acFanBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '75', true);
                setTimeout(() => CrComLib.publishEvent('b', '75', false), 100);
            }
        });

        // AC Fan Speeds
        document.getElementById('acFanLowBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '76', true);
                setTimeout(() => CrComLib.publishEvent('b', '76', false), 100);
            }
        });
        document.getElementById('acFanMedBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '77', true);
                setTimeout(() => CrComLib.publishEvent('b', '77', false), 100);
            }
        });
        document.getElementById('acFanHighBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '78', true);
                setTimeout(() => CrComLib.publishEvent('b', '78', false), 100);
            }
        });
        document.getElementById('acFanAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '79', true);
                setTimeout(() => CrComLib.publishEvent('b', '79', false), 100);
            }
        });

        // AC Swing
        document.getElementById('acSwingBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '81', true);
                setTimeout(() => CrComLib.publishEvent('b', '81', false), 100);
            }
        });

        // ====================== TV BUTTONS & REMOTE ======================

        // Quick Action Buttons (Top of TV Widget)
        document.getElementById('tvPowerBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvNetflixBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '61', true);
                setTimeout(() => CrComLib.publishEvent('b', '61', false), 100);
            }
        });

        document.getElementById('tvHdmiBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '62', true);
                setTimeout(() => CrComLib.publishEvent('b', '62', false), 100);
            }
        });

        // ==================== TV REMOTE CONTROLS (Inside TV Controls Sub-Widget) ====================

        // Power & Source Buttons (inside remote)
        document.getElementById('tvPowerBtn2')?.addEventListener('click', () => {   // tvPowerBtn2 is the one in remote
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvSourceBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '68', true);   // You can change join number
                setTimeout(() => CrComLib.publishEvent('b', '68', false), 100);
            }
        });

        // ==================== D-PAD ====================
        document.getElementById('tvDpadUp')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '63', true);
                setTimeout(() => CrComLib.publishEvent('b', '63', false), 100);
            }
        });

        document.getElementById('tvDpadDown')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '64', true);
                setTimeout(() => CrComLib.publishEvent('b', '64', false), 100);
            }
        });

        document.getElementById('tvDpadLeft')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '65', true);
                setTimeout(() => CrComLib.publishEvent('b', '65', false), 100);
            }
        });

        document.getElementById('tvDpadRight')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '66', true);
                setTimeout(() => CrComLib.publishEvent('b', '66', false), 100);
            }
        });

        document.getElementById('tvDpadOk')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '67', true);
                setTimeout(() => CrComLib.publishEvent('b', '67', false), 100);
            }
        });

        // ==================== NUMERIC KEYPAD (0-9 + Enter) ====================
        for (let i = 0; i <= 9; i++) {
            const keyBtn = document.getElementById('tvKey' + i);
            if (keyBtn) {
                keyBtn.addEventListener('click', () => {
                    if (typeof CrComLib !== 'undefined') {
                        // Joins 90 to 99 for digits
                        CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), true);
                        setTimeout(() => CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), false), 100);
                    }
                });
            }
        }

        document.getElementById('tvKeyEnter')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '100', true);   // Enter button join
                setTimeout(() => CrComLib.publishEvent('b', '100', false), 100);
            }
        });

        // ==================== VOLUME & CHANNEL CONTROLS ====================
        document.getElementById('tvVolUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '101', true);
                setTimeout(() => CrComLib.publishEvent('b', '101', false), 100);
            }
        });

        document.getElementById('tvVolDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '102', true);
                setTimeout(() => CrComLib.publishEvent('b', '102', false), 100);
            }
        });

        document.getElementById('tvMuteBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '103', true);
                setTimeout(() => CrComLib.publishEvent('b', '103', false), 100);
            }
        });

        document.getElementById('tvChUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '104', true);
                setTimeout(() => CrComLib.publishEvent('b', '104', false), 100);
            }
        });

        document.getElementById('tvChDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '105', true);
                setTimeout(() => CrComLib.publishEvent('b', '105', false), 100);
            }
        });

        // ==================== FAVORITES GRID (Dynamic) ====================
        // Example: Assign joins starting from 110 onwards
        const favButtons = document.querySelectorAll('.fav-btn');
        favButtons.forEach((btn, index) => {
            const joinNumber = 110 + index;   // 110, 111, 112 ...
        
            btn.addEventListener('click', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', String(joinNumber), true);
                    setTimeout(() => CrComLib.publishEvent('b', String(joinNumber), false), 100);
                }
                console.log(`Favorite ${index + 1} pressed → Digital Join ${joinNumber}`);
            });
        });
        

    function setupFeedbackSubscriptions() {
        // Existing dimmer feedback
        CrComLib.subscribeState('n', '30', (val) => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) slider.value = val;
            document.getElementById('dimValue').textContent = val;
            document.getElementById('dimPercentage').textContent = val + '%';
            updateDial(val);
        });

        // ==================== NEW: AC Feedback ====================
        CrComLib.subscribeState('n', '40', (val) => {
            const currentEl = document.getElementById('acCurrentTemp');
            if (currentEl) currentEl.textContent = Math.round(val) + '°C';
        });
    }

    function requestCurrentStatus() {
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('b', '99', true);
            setTimeout(() => CrComLib.publishEvent('b', '99', false), 100);
        }
    }

    function setupTopNavigation() {
        CrComLib.publishEvent("b", "active_state_class_page4", true);
    }

    // Clock
    function tick() {
        const el = document.getElementById('clockDisplay');
        if (!el) return;
        const n = new Date();
        el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
    }
    setInterval(tick, 15000);
    tick();

    // Page Load Handler
    let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:page4-import-page', (value) => {
        if (value && value['loaded']) {
            onInit();
            setTimeout(() => CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:page4-import-page', loadedSubId), 100);
        }
    });

    return {};
}})();


/* page5.js */
const page5Module = (() => {
    'use strict';

    function onInit() {
        console.log('✅ Page 1 Initialized with 4 Widgets');

        setupButtonEventListeners();
        setupSliders();
        setupFeedbackSubscriptions();
        requestCurrentStatus();
        setupTopNavigation();
        initializeWidgets();
    }

    // ====================== WIDGET MANAGEMENT ======================
    function initializeWidgets() {
        const firstTab = document.querySelector('.tab-btn.active');
        if (firstTab) {
            const widgetName = firstTab.getAttribute('data-widget') || 'lights';
            switchWidget(widgetName, firstTab);
        }
    }

    window.switchWidget = function(widgetName, clickedBtn) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        // Switch visible widget
        document.querySelectorAll('.widget').forEach(w => w.classList.remove('active'));
        const activeWidget = document.getElementById('widget-' + widgetName);
        if (activeWidget) activeWidget.classList.add('active');

        // Optional: Send to Crestron
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('s', 'active_widget_name', widgetName);
        }
    };

    window.switchTVSubWidget = function(subwidgetName, clickedBtn) {
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        
        document.querySelectorAll('.tv-subwidget').forEach(w => w.classList.remove('active'));
        document.getElementById(subwidgetName).classList.add('active');
    };

    // ====================== SHARED FUNCTIONS ======================
    function toggleTile(name, cls) {
        const tog = document.getElementById('tog-' + name);
        const tile = document.getElementById('tile-' + name);
        const lbl = document.getElementById('lbl-' + name);
        if (!tog || !tile || !lbl) return;

        const isOn = tog.checked;
        tile.classList.toggle(cls, isOn);
        lbl.textContent = isOn ? 'ON' : 'OFF';

        if (name === 'lights') setStatus(isOn ? 'on' : 'off');
    }

    function setStatus(s) {
        const pill = document.getElementById('statusPill');
        const text = document.getElementById('lightingStatus');
        if (!pill || !text) return;

        pill.className = 'spill';
        if (s === 'on')  { pill.classList.add('sp-on');  text.textContent = 'Lights: ON'; }
        if (s === 'off') { pill.classList.add('sp-off'); text.textContent = 'Lights: OFF'; }
        if (s === 'dim') { pill.classList.add('sp-dim'); text.textContent = 'Lights: DIMMED'; }
    }

    function updateDial(pct) {
        const fill = document.getElementById('arc-fill');
        const label = document.getElementById('arc-label');
        if (!fill) return;

        const cx = 100, cy = 105, r = 76;
        const deg = -180 + pct * 1.8;
        const rad = deg * Math.PI / 180;
        const ex = cx + r * Math.cos(rad);
        const ey = cy + r * Math.sin(rad);

        if (pct <= 0) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 24.001 105');
        } else if (pct >= 100) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 176 105');
        } else {
            fill.setAttribute('d', `M 24 105 A 76 76 0 ${pct > 50 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== SLIDERS & BUTTONS ======================
    function setupSliders() {
        // Dimmer Slider (Lights Widget)
        const dimSlider = document.getElementById('dimLevelSlider');
        if (dimSlider) {
            dimSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '31', v);
            });
        }

        // Shades Slider
        const shadeSlider = document.getElementById('shadeSlider');
        if (shadeSlider) {
            shadeSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('shadeValue').textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '36', v);
            });
        }

        // ==================== NEW: AC Setpoint Slider ====================
        const acSlider = document.getElementById('acSetpointSlider');
        if (acSlider) {
            acSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                const display = document.getElementById('acSetValue');
                if (display) display.textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '41', v);
            });
        }
    }

    function setupButtonEventListeners() {
        // Lights Quick Buttons
        document.getElementById('lightsOnBtn')?.addEventListener('click', () => {
            setStatus('on');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = true; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '10', true);
                setTimeout(() => CrComLib.publishEvent('b', '10', false), 100);
            }
        });

        document.getElementById('lightsOffBtn')?.addEventListener('click', () => {
            setStatus('off');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = false; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '11', true);
                setTimeout(() => CrComLib.publishEvent('b', '11', false), 100);
            }
        });

        document.getElementById('lightsDimBtn')?.addEventListener('click', () => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) {
                slider.value = 50;
                const v = 50;
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('n', '31', v);
                    CrComLib.publishEvent('b', '12', true);
                    setTimeout(() => CrComLib.publishEvent('b', '12', false), 100);
                }
            }
        });

        

        // Shades Buttons
        document.getElementById('shadeUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '50', true);
                setTimeout(() => CrComLib.publishEvent('b', '50', false), 100);
            }
        });
        document.getElementById('shadeStopBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '52', true);
                setTimeout(() => CrComLib.publishEvent('b', '52', false), 100);
            }
        });
        document.getElementById('shadeDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '51', true);
                setTimeout(() => CrComLib.publishEvent('b', '51', false), 100);
            }
        });

        // ==================== NEW: AC CONTROLS ====================
        // AC Power Toggle (pulses on every change - matches Crestron toggle behavior)
        const acToggle = document.getElementById('tog-ac');
        if (acToggle) {
            acToggle.addEventListener('change', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', '70', true);
                    setTimeout(() => CrComLib.publishEvent('b', '70', false), 100);
                }
            });
        }

        // AC Modes
        document.getElementById('acCoolBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '71', true);
                setTimeout(() => CrComLib.publishEvent('b', '71', false), 100);
            }
        });
        document.getElementById('acHeatBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '72', true);
                setTimeout(() => CrComLib.publishEvent('b', '72', false), 100);
            }
        });
        document.getElementById('acAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '73', true);
                setTimeout(() => CrComLib.publishEvent('b', '73', false), 100);
            }
        });
        document.getElementById('acDryBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '74', true);
                setTimeout(() => CrComLib.publishEvent('b', '74', false), 100);
            }
        });
        document.getElementById('acFanBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '75', true);
                setTimeout(() => CrComLib.publishEvent('b', '75', false), 100);
            }
        });

        // AC Fan Speeds
        document.getElementById('acFanLowBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '76', true);
                setTimeout(() => CrComLib.publishEvent('b', '76', false), 100);
            }
        });
        document.getElementById('acFanMedBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '77', true);
                setTimeout(() => CrComLib.publishEvent('b', '77', false), 100);
            }
        });
        document.getElementById('acFanHighBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '78', true);
                setTimeout(() => CrComLib.publishEvent('b', '78', false), 100);
            }
        });
        document.getElementById('acFanAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '79', true);
                setTimeout(() => CrComLib.publishEvent('b', '79', false), 100);
            }
        });

        // AC Swing
        document.getElementById('acSwingBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '81', true);
                setTimeout(() => CrComLib.publishEvent('b', '81', false), 100);
            }
        });

        // ====================== TV BUTTONS & REMOTE ======================

        // Quick Action Buttons (Top of TV Widget)
        document.getElementById('tvPowerBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvNetflixBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '61', true);
                setTimeout(() => CrComLib.publishEvent('b', '61', false), 100);
            }
        });

        document.getElementById('tvHdmiBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '62', true);
                setTimeout(() => CrComLib.publishEvent('b', '62', false), 100);
            }
        });

        // ==================== TV REMOTE CONTROLS (Inside TV Controls Sub-Widget) ====================

        // Power & Source Buttons (inside remote)
        document.getElementById('tvPowerBtn2')?.addEventListener('click', () => {   // tvPowerBtn2 is the one in remote
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvSourceBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '68', true);   // You can change join number
                setTimeout(() => CrComLib.publishEvent('b', '68', false), 100);
            }
        });

        // ==================== D-PAD ====================
        document.getElementById('tvDpadUp')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '63', true);
                setTimeout(() => CrComLib.publishEvent('b', '63', false), 100);
            }
        });

        document.getElementById('tvDpadDown')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '64', true);
                setTimeout(() => CrComLib.publishEvent('b', '64', false), 100);
            }
        });

        document.getElementById('tvDpadLeft')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '65', true);
                setTimeout(() => CrComLib.publishEvent('b', '65', false), 100);
            }
        });

        document.getElementById('tvDpadRight')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '66', true);
                setTimeout(() => CrComLib.publishEvent('b', '66', false), 100);
            }
        });

        document.getElementById('tvDpadOk')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '67', true);
                setTimeout(() => CrComLib.publishEvent('b', '67', false), 100);
            }
        });

        // ==================== NUMERIC KEYPAD (0-9 + Enter) ====================
        for (let i = 0; i <= 9; i++) {
            const keyBtn = document.getElementById('tvKey' + i);
            if (keyBtn) {
                keyBtn.addEventListener('click', () => {
                    if (typeof CrComLib !== 'undefined') {
                        // Joins 90 to 99 for digits
                        CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), true);
                        setTimeout(() => CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), false), 100);
                    }
                });
            }
        }

        document.getElementById('tvKeyEnter')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '100', true);   // Enter button join
                setTimeout(() => CrComLib.publishEvent('b', '100', false), 100);
            }
        });

        // ==================== VOLUME & CHANNEL CONTROLS ====================
        document.getElementById('tvVolUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '101', true);
                setTimeout(() => CrComLib.publishEvent('b', '101', false), 100);
            }
        });

        document.getElementById('tvVolDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '102', true);
                setTimeout(() => CrComLib.publishEvent('b', '102', false), 100);
            }
        });

        document.getElementById('tvMuteBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '103', true);
                setTimeout(() => CrComLib.publishEvent('b', '103', false), 100);
            }
        });

        document.getElementById('tvChUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '104', true);
                setTimeout(() => CrComLib.publishEvent('b', '104', false), 100);
            }
        });

        document.getElementById('tvChDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '105', true);
                setTimeout(() => CrComLib.publishEvent('b', '105', false), 100);
            }
        });

        // ==================== FAVORITES GRID (Dynamic) ====================
        // Example: Assign joins starting from 110 onwards
        const favButtons = document.querySelectorAll('.fav-btn');
        favButtons.forEach((btn, index) => {
            const joinNumber = 110 + index;   // 110, 111, 112 ...
        
            btn.addEventListener('click', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', String(joinNumber), true);
                    setTimeout(() => CrComLib.publishEvent('b', String(joinNumber), false), 100);
                }
                console.log(`Favorite ${index + 1} pressed → Digital Join ${joinNumber}`);
            });
        });
        

    function setupFeedbackSubscriptions() {
        // Existing dimmer feedback
        CrComLib.subscribeState('n', '30', (val) => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) slider.value = val;
            document.getElementById('dimValue').textContent = val;
            document.getElementById('dimPercentage').textContent = val + '%';
            updateDial(val);
        });

        // ==================== NEW: AC Feedback ====================
        CrComLib.subscribeState('n', '40', (val) => {
            const currentEl = document.getElementById('acCurrentTemp');
            if (currentEl) currentEl.textContent = Math.round(val) + '°C';
        });
    }

    function requestCurrentStatus() {
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('b', '99', true);
            setTimeout(() => CrComLib.publishEvent('b', '99', false), 100);
        }
    }

    function setupTopNavigation() {
        CrComLib.publishEvent("b", "active_state_class_page5", true);
    }

    // Clock
    function tick() {
        const el = document.getElementById('clockDisplay');
        if (!el) return;
        const n = new Date();
        el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
    }
    setInterval(tick, 15000);
    tick();

    // Page Load Handler
    let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:page5-import-page', (value) => {
        if (value && value['loaded']) {
            onInit();
            setTimeout(() => CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:page5-import-page', loadedSubId), 100);
        }
    });

    return {};
}})();


/* page6.js */
const page6Module = (() => {
    'use strict';

    function onInit() {
        console.log('✅ Page 1 Initialized with 4 Widgets');

        setupButtonEventListeners();
        setupSliders();
        setupFeedbackSubscriptions();
        requestCurrentStatus();
        setupTopNavigation();
        initializeWidgets();
    }

    // ====================== WIDGET MANAGEMENT ======================
    function initializeWidgets() {
        const firstTab = document.querySelector('.tab-btn.active');
        if (firstTab) {
            const widgetName = firstTab.getAttribute('data-widget') || 'lights';
            switchWidget(widgetName, firstTab);
        }
    }

    window.switchWidget = function(widgetName, clickedBtn) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        // Switch visible widget
        document.querySelectorAll('.widget').forEach(w => w.classList.remove('active'));
        const activeWidget = document.getElementById('widget-' + widgetName);
        if (activeWidget) activeWidget.classList.add('active');

        // Optional: Send to Crestron
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('s', 'active_widget_name', widgetName);
        }
    };

    window.switchTVSubWidget = function(subwidgetName, clickedBtn) {
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        
        document.querySelectorAll('.tv-subwidget').forEach(w => w.classList.remove('active'));
        document.getElementById(subwidgetName).classList.add('active');
    };

    // ====================== SHARED FUNCTIONS ======================
    function toggleTile(name, cls) {
        const tog = document.getElementById('tog-' + name);
        const tile = document.getElementById('tile-' + name);
        const lbl = document.getElementById('lbl-' + name);
        if (!tog || !tile || !lbl) return;

        const isOn = tog.checked;
        tile.classList.toggle(cls, isOn);
        lbl.textContent = isOn ? 'ON' : 'OFF';

        if (name === 'lights') setStatus(isOn ? 'on' : 'off');
    }

    function setStatus(s) {
        const pill = document.getElementById('statusPill');
        const text = document.getElementById('lightingStatus');
        if (!pill || !text) return;

        pill.className = 'spill';
        if (s === 'on')  { pill.classList.add('sp-on');  text.textContent = 'Lights: ON'; }
        if (s === 'off') { pill.classList.add('sp-off'); text.textContent = 'Lights: OFF'; }
        if (s === 'dim') { pill.classList.add('sp-dim'); text.textContent = 'Lights: DIMMED'; }
    }

    function updateDial(pct) {
        const fill = document.getElementById('arc-fill');
        const label = document.getElementById('arc-label');
        if (!fill) return;

        const cx = 100, cy = 105, r = 76;
        const deg = -180 + pct * 1.8;
        const rad = deg * Math.PI / 180;
        const ex = cx + r * Math.cos(rad);
        const ey = cy + r * Math.sin(rad);

        if (pct <= 0) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 24.001 105');
        } else if (pct >= 100) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 176 105');
        } else {
            fill.setAttribute('d', `M 24 105 A 76 76 0 ${pct > 50 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== SLIDERS & BUTTONS ======================
    function setupSliders() {
        // Dimmer Slider (Lights Widget)
        const dimSlider = document.getElementById('dimLevelSlider');
        if (dimSlider) {
            dimSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '31', v);
            });
        }

        // Shades Slider
        const shadeSlider = document.getElementById('shadeSlider');
        if (shadeSlider) {
            shadeSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('shadeValue').textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '36', v);
            });
        }

        // ==================== NEW: AC Setpoint Slider ====================
        const acSlider = document.getElementById('acSetpointSlider');
        if (acSlider) {
            acSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                const display = document.getElementById('acSetValue');
                if (display) display.textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '41', v);
            });
        }
    }

    function setupButtonEventListeners() {
        // Lights Quick Buttons
        document.getElementById('lightsOnBtn')?.addEventListener('click', () => {
            setStatus('on');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = true; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '10', true);
                setTimeout(() => CrComLib.publishEvent('b', '10', false), 100);
            }
        });

        document.getElementById('lightsOffBtn')?.addEventListener('click', () => {
            setStatus('off');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = false; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '11', true);
                setTimeout(() => CrComLib.publishEvent('b', '11', false), 100);
            }
        });

        document.getElementById('lightsDimBtn')?.addEventListener('click', () => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) {
                slider.value = 50;
                const v = 50;
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('n', '31', v);
                    CrComLib.publishEvent('b', '12', true);
                    setTimeout(() => CrComLib.publishEvent('b', '12', false), 100);
                }
            }
        });

        

        // Shades Buttons
        document.getElementById('shadeUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '50', true);
                setTimeout(() => CrComLib.publishEvent('b', '50', false), 100);
            }
        });
        document.getElementById('shadeStopBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '52', true);
                setTimeout(() => CrComLib.publishEvent('b', '52', false), 100);
            }
        });
        document.getElementById('shadeDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '51', true);
                setTimeout(() => CrComLib.publishEvent('b', '51', false), 100);
            }
        });

        // ==================== NEW: AC CONTROLS ====================
        // AC Power Toggle (pulses on every change - matches Crestron toggle behavior)
        const acToggle = document.getElementById('tog-ac');
        if (acToggle) {
            acToggle.addEventListener('change', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', '70', true);
                    setTimeout(() => CrComLib.publishEvent('b', '70', false), 100);
                }
            });
        }

        // AC Modes
        document.getElementById('acCoolBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '71', true);
                setTimeout(() => CrComLib.publishEvent('b', '71', false), 100);
            }
        });
        document.getElementById('acHeatBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '72', true);
                setTimeout(() => CrComLib.publishEvent('b', '72', false), 100);
            }
        });
        document.getElementById('acAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '73', true);
                setTimeout(() => CrComLib.publishEvent('b', '73', false), 100);
            }
        });
        document.getElementById('acDryBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '74', true);
                setTimeout(() => CrComLib.publishEvent('b', '74', false), 100);
            }
        });
        document.getElementById('acFanBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '75', true);
                setTimeout(() => CrComLib.publishEvent('b', '75', false), 100);
            }
        });

        // AC Fan Speeds
        document.getElementById('acFanLowBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '76', true);
                setTimeout(() => CrComLib.publishEvent('b', '76', false), 100);
            }
        });
        document.getElementById('acFanMedBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '77', true);
                setTimeout(() => CrComLib.publishEvent('b', '77', false), 100);
            }
        });
        document.getElementById('acFanHighBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '78', true);
                setTimeout(() => CrComLib.publishEvent('b', '78', false), 100);
            }
        });
        document.getElementById('acFanAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '79', true);
                setTimeout(() => CrComLib.publishEvent('b', '79', false), 100);
            }
        });

        // AC Swing
        document.getElementById('acSwingBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '81', true);
                setTimeout(() => CrComLib.publishEvent('b', '81', false), 100);
            }
        });

        // ====================== TV BUTTONS & REMOTE ======================

        // Quick Action Buttons (Top of TV Widget)
        document.getElementById('tvPowerBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvNetflixBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '61', true);
                setTimeout(() => CrComLib.publishEvent('b', '61', false), 100);
            }
        });

        document.getElementById('tvHdmiBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '62', true);
                setTimeout(() => CrComLib.publishEvent('b', '62', false), 100);
            }
        });

        // ==================== TV REMOTE CONTROLS (Inside TV Controls Sub-Widget) ====================

        // Power & Source Buttons (inside remote)
        document.getElementById('tvPowerBtn2')?.addEventListener('click', () => {   // tvPowerBtn2 is the one in remote
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvSourceBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '68', true);   // You can change join number
                setTimeout(() => CrComLib.publishEvent('b', '68', false), 100);
            }
        });

        // ==================== D-PAD ====================
        document.getElementById('tvDpadUp')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '63', true);
                setTimeout(() => CrComLib.publishEvent('b', '63', false), 100);
            }
        });

        document.getElementById('tvDpadDown')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '64', true);
                setTimeout(() => CrComLib.publishEvent('b', '64', false), 100);
            }
        });

        document.getElementById('tvDpadLeft')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '65', true);
                setTimeout(() => CrComLib.publishEvent('b', '65', false), 100);
            }
        });

        document.getElementById('tvDpadRight')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '66', true);
                setTimeout(() => CrComLib.publishEvent('b', '66', false), 100);
            }
        });

        document.getElementById('tvDpadOk')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '67', true);
                setTimeout(() => CrComLib.publishEvent('b', '67', false), 100);
            }
        });

        // ==================== NUMERIC KEYPAD (0-9 + Enter) ====================
        for (let i = 0; i <= 9; i++) {
            const keyBtn = document.getElementById('tvKey' + i);
            if (keyBtn) {
                keyBtn.addEventListener('click', () => {
                    if (typeof CrComLib !== 'undefined') {
                        // Joins 90 to 99 for digits
                        CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), true);
                        setTimeout(() => CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), false), 100);
                    }
                });
            }
        }

        document.getElementById('tvKeyEnter')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '100', true);   // Enter button join
                setTimeout(() => CrComLib.publishEvent('b', '100', false), 100);
            }
        });

        // ==================== VOLUME & CHANNEL CONTROLS ====================
        document.getElementById('tvVolUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '101', true);
                setTimeout(() => CrComLib.publishEvent('b', '101', false), 100);
            }
        });

        document.getElementById('tvVolDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '102', true);
                setTimeout(() => CrComLib.publishEvent('b', '102', false), 100);
            }
        });

        document.getElementById('tvMuteBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '103', true);
                setTimeout(() => CrComLib.publishEvent('b', '103', false), 100);
            }
        });

        document.getElementById('tvChUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '104', true);
                setTimeout(() => CrComLib.publishEvent('b', '104', false), 100);
            }
        });

        document.getElementById('tvChDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '105', true);
                setTimeout(() => CrComLib.publishEvent('b', '105', false), 100);
            }
        });

        // ==================== FAVORITES GRID (Dynamic) ====================
        // Example: Assign joins starting from 110 onwards
        const favButtons = document.querySelectorAll('.fav-btn');
        favButtons.forEach((btn, index) => {
            const joinNumber = 110 + index;   // 110, 111, 112 ...
        
            btn.addEventListener('click', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', String(joinNumber), true);
                    setTimeout(() => CrComLib.publishEvent('b', String(joinNumber), false), 100);
                }
                console.log(`Favorite ${index + 1} pressed → Digital Join ${joinNumber}`);
            });
        });
        

    function setupFeedbackSubscriptions() {
        // Existing dimmer feedback
        CrComLib.subscribeState('n', '30', (val) => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) slider.value = val;
            document.getElementById('dimValue').textContent = val;
            document.getElementById('dimPercentage').textContent = val + '%';
            updateDial(val);
        });

        // ==================== NEW: AC Feedback ====================
        CrComLib.subscribeState('n', '40', (val) => {
            const currentEl = document.getElementById('acCurrentTemp');
            if (currentEl) currentEl.textContent = Math.round(val) + '°C';
        });
    }

    function requestCurrentStatus() {
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('b', '99', true);
            setTimeout(() => CrComLib.publishEvent('b', '99', false), 100);
        }
    }

    function setupTopNavigation() {
        CrComLib.publishEvent("b", "active_state_class_page6", true);
    }

    // Clock
    function tick() {
        const el = document.getElementById('clockDisplay');
        if (!el) return;
        const n = new Date();
        el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
    }
    setInterval(tick, 15000);
    tick();

    // Page Load Handler
    let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:page6-import-page', (value) => {
        if (value && value['loaded']) {
            onInit();
            setTimeout(() => CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:page6-import-page', loadedSubId), 100);
        }
    });

    return {};
}})();


/* page7.js */
const page7Module = (() => {
    'use strict';

    function onInit() {
        console.log('✅ Page 1 Initialized with 4 Widgets');

        setupButtonEventListeners();
        setupSliders();
        setupFeedbackSubscriptions();
        requestCurrentStatus();
        setupTopNavigation();
        initializeWidgets();
    }

    // ====================== WIDGET MANAGEMENT ======================
    function initializeWidgets() {
        const firstTab = document.querySelector('.tab-btn.active');
        if (firstTab) {
            const widgetName = firstTab.getAttribute('data-widget') || 'lights';
            switchWidget(widgetName, firstTab);
        }
    }

    window.switchWidget = function(widgetName, clickedBtn) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        // Switch visible widget
        document.querySelectorAll('.widget').forEach(w => w.classList.remove('active'));
        const activeWidget = document.getElementById('widget-' + widgetName);
        if (activeWidget) activeWidget.classList.add('active');

        // Optional: Send to Crestron
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('s', 'active_widget_name', widgetName);
        }
    };

    window.switchTVSubWidget = function(subwidgetName, clickedBtn) {
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        
        document.querySelectorAll('.tv-subwidget').forEach(w => w.classList.remove('active'));
        document.getElementById(subwidgetName).classList.add('active');
    };

    // ====================== SHARED FUNCTIONS ======================
    function toggleTile(name, cls) {
        const tog = document.getElementById('tog-' + name);
        const tile = document.getElementById('tile-' + name);
        const lbl = document.getElementById('lbl-' + name);
        if (!tog || !tile || !lbl) return;

        const isOn = tog.checked;
        tile.classList.toggle(cls, isOn);
        lbl.textContent = isOn ? 'ON' : 'OFF';

        if (name === 'lights') setStatus(isOn ? 'on' : 'off');
    }

    function setStatus(s) {
        const pill = document.getElementById('statusPill');
        const text = document.getElementById('lightingStatus');
        if (!pill || !text) return;

        pill.className = 'spill';
        if (s === 'on')  { pill.classList.add('sp-on');  text.textContent = 'Lights: ON'; }
        if (s === 'off') { pill.classList.add('sp-off'); text.textContent = 'Lights: OFF'; }
        if (s === 'dim') { pill.classList.add('sp-dim'); text.textContent = 'Lights: DIMMED'; }
    }

    function updateDial(pct) {
        const fill = document.getElementById('arc-fill');
        const label = document.getElementById('arc-label');
        if (!fill) return;

        const cx = 100, cy = 105, r = 76;
        const deg = -180 + pct * 1.8;
        const rad = deg * Math.PI / 180;
        const ex = cx + r * Math.cos(rad);
        const ey = cy + r * Math.sin(rad);

        if (pct <= 0) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 24.001 105');
        } else if (pct >= 100) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 176 105');
        } else {
            fill.setAttribute('d', `M 24 105 A 76 76 0 ${pct > 50 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== SLIDERS & BUTTONS ======================
    function setupSliders() {
        // Dimmer Slider (Lights Widget)
        const dimSlider = document.getElementById('dimLevelSlider');
        if (dimSlider) {
            dimSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '31', v);
            });
        }

        // Shades Slider
        const shadeSlider = document.getElementById('shadeSlider');
        if (shadeSlider) {
            shadeSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('shadeValue').textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '36', v);
            });
        }

        // ==================== NEW: AC Setpoint Slider ====================
        const acSlider = document.getElementById('acSetpointSlider');
        if (acSlider) {
            acSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                const display = document.getElementById('acSetValue');
                if (display) display.textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '41', v);
            });
        }
    }

    function setupButtonEventListeners() {
        // Lights Quick Buttons
        document.getElementById('lightsOnBtn')?.addEventListener('click', () => {
            setStatus('on');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = true; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '10', true);
                setTimeout(() => CrComLib.publishEvent('b', '10', false), 100);
            }
        });

        document.getElementById('lightsOffBtn')?.addEventListener('click', () => {
            setStatus('off');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = false; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '11', true);
                setTimeout(() => CrComLib.publishEvent('b', '11', false), 100);
            }
        });

        document.getElementById('lightsDimBtn')?.addEventListener('click', () => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) {
                slider.value = 50;
                const v = 50;
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('n', '31', v);
                    CrComLib.publishEvent('b', '12', true);
                    setTimeout(() => CrComLib.publishEvent('b', '12', false), 100);
                }
            }
        });

        

        // Shades Buttons
        document.getElementById('shadeUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '50', true);
                setTimeout(() => CrComLib.publishEvent('b', '50', false), 100);
            }
        });
        document.getElementById('shadeStopBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '52', true);
                setTimeout(() => CrComLib.publishEvent('b', '52', false), 100);
            }
        });
        document.getElementById('shadeDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '51', true);
                setTimeout(() => CrComLib.publishEvent('b', '51', false), 100);
            }
        });

        // ==================== NEW: AC CONTROLS ====================
        // AC Power Toggle (pulses on every change - matches Crestron toggle behavior)
        const acToggle = document.getElementById('tog-ac');
        if (acToggle) {
            acToggle.addEventListener('change', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', '70', true);
                    setTimeout(() => CrComLib.publishEvent('b', '70', false), 100);
                }
            });
        }

        // AC Modes
        document.getElementById('acCoolBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '71', true);
                setTimeout(() => CrComLib.publishEvent('b', '71', false), 100);
            }
        });
        document.getElementById('acHeatBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '72', true);
                setTimeout(() => CrComLib.publishEvent('b', '72', false), 100);
            }
        });
        document.getElementById('acAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '73', true);
                setTimeout(() => CrComLib.publishEvent('b', '73', false), 100);
            }
        });
        document.getElementById('acDryBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '74', true);
                setTimeout(() => CrComLib.publishEvent('b', '74', false), 100);
            }
        });
        document.getElementById('acFanBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '75', true);
                setTimeout(() => CrComLib.publishEvent('b', '75', false), 100);
            }
        });

        // AC Fan Speeds
        document.getElementById('acFanLowBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '76', true);
                setTimeout(() => CrComLib.publishEvent('b', '76', false), 100);
            }
        });
        document.getElementById('acFanMedBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '77', true);
                setTimeout(() => CrComLib.publishEvent('b', '77', false), 100);
            }
        });
        document.getElementById('acFanHighBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '78', true);
                setTimeout(() => CrComLib.publishEvent('b', '78', false), 100);
            }
        });
        document.getElementById('acFanAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '79', true);
                setTimeout(() => CrComLib.publishEvent('b', '79', false), 100);
            }
        });

        // AC Swing
        document.getElementById('acSwingBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '81', true);
                setTimeout(() => CrComLib.publishEvent('b', '81', false), 100);
            }
        });

        // ====================== TV BUTTONS & REMOTE ======================

        // Quick Action Buttons (Top of TV Widget)
        document.getElementById('tvPowerBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvNetflixBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '61', true);
                setTimeout(() => CrComLib.publishEvent('b', '61', false), 100);
            }
        });

        document.getElementById('tvHdmiBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '62', true);
                setTimeout(() => CrComLib.publishEvent('b', '62', false), 100);
            }
        });

        // ==================== TV REMOTE CONTROLS (Inside TV Controls Sub-Widget) ====================

        // Power & Source Buttons (inside remote)
        document.getElementById('tvPowerBtn2')?.addEventListener('click', () => {   // tvPowerBtn2 is the one in remote
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvSourceBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '68', true);   // You can change join number
                setTimeout(() => CrComLib.publishEvent('b', '68', false), 100);
            }
        });

        // ==================== D-PAD ====================
        document.getElementById('tvDpadUp')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '63', true);
                setTimeout(() => CrComLib.publishEvent('b', '63', false), 100);
            }
        });

        document.getElementById('tvDpadDown')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '64', true);
                setTimeout(() => CrComLib.publishEvent('b', '64', false), 100);
            }
        });

        document.getElementById('tvDpadLeft')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '65', true);
                setTimeout(() => CrComLib.publishEvent('b', '65', false), 100);
            }
        });

        document.getElementById('tvDpadRight')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '66', true);
                setTimeout(() => CrComLib.publishEvent('b', '66', false), 100);
            }
        });

        document.getElementById('tvDpadOk')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '67', true);
                setTimeout(() => CrComLib.publishEvent('b', '67', false), 100);
            }
        });

        // ==================== NUMERIC KEYPAD (0-9 + Enter) ====================
        for (let i = 0; i <= 9; i++) {
            const keyBtn = document.getElementById('tvKey' + i);
            if (keyBtn) {
                keyBtn.addEventListener('click', () => {
                    if (typeof CrComLib !== 'undefined') {
                        // Joins 90 to 99 for digits
                        CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), true);
                        setTimeout(() => CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), false), 100);
                    }
                });
            }
        }

        document.getElementById('tvKeyEnter')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '100', true);   // Enter button join
                setTimeout(() => CrComLib.publishEvent('b', '100', false), 100);
            }
        });

        // ==================== VOLUME & CHANNEL CONTROLS ====================
        document.getElementById('tvVolUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '101', true);
                setTimeout(() => CrComLib.publishEvent('b', '101', false), 100);
            }
        });

        document.getElementById('tvVolDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '102', true);
                setTimeout(() => CrComLib.publishEvent('b', '102', false), 100);
            }
        });

        document.getElementById('tvMuteBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '103', true);
                setTimeout(() => CrComLib.publishEvent('b', '103', false), 100);
            }
        });

        document.getElementById('tvChUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '104', true);
                setTimeout(() => CrComLib.publishEvent('b', '104', false), 100);
            }
        });

        document.getElementById('tvChDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '105', true);
                setTimeout(() => CrComLib.publishEvent('b', '105', false), 100);
            }
        });

        // ==================== FAVORITES GRID (Dynamic) ====================
        // Example: Assign joins starting from 110 onwards
        const favButtons = document.querySelectorAll('.fav-btn');
        favButtons.forEach((btn, index) => {
            const joinNumber = 110 + index;   // 110, 111, 112 ...
        
            btn.addEventListener('click', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', String(joinNumber), true);
                    setTimeout(() => CrComLib.publishEvent('b', String(joinNumber), false), 100);
                }
                console.log(`Favorite ${index + 1} pressed → Digital Join ${joinNumber}`);
            });
        });
        

    function setupFeedbackSubscriptions() {
        // Existing dimmer feedback
        CrComLib.subscribeState('n', '30', (val) => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) slider.value = val;
            document.getElementById('dimValue').textContent = val;
            document.getElementById('dimPercentage').textContent = val + '%';
            updateDial(val);
        });

        // ==================== NEW: AC Feedback ====================
        CrComLib.subscribeState('n', '40', (val) => {
            const currentEl = document.getElementById('acCurrentTemp');
            if (currentEl) currentEl.textContent = Math.round(val) + '°C';
        });
    }

    function requestCurrentStatus() {
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('b', '99', true);
            setTimeout(() => CrComLib.publishEvent('b', '99', false), 100);
        }
    }

    function setupTopNavigation() {
        CrComLib.publishEvent("b", "active_state_class_page7", true);
    }

    // Clock
    function tick() {
        const el = document.getElementById('clockDisplay');
        if (!el) return;
        const n = new Date();
        el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
    }
    setInterval(tick, 15000);
    tick();

    // Page Load Handler
    let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:page7-import-page', (value) => {
        if (value && value['loaded']) {
            onInit();
            setTimeout(() => CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:page7-import-page', loadedSubId), 100);
        }
    });

    return {};
}})();


/* page8.js */
const page8Module = (() => {
    'use strict';

    function onInit() {
        console.log('✅ Page 1 Initialized with 4 Widgets');

        setupButtonEventListeners();
        setupSliders();
        setupFeedbackSubscriptions();
        requestCurrentStatus();
        setupTopNavigation();
        initializeWidgets();
    }

    // ====================== WIDGET MANAGEMENT ======================
    function initializeWidgets() {
        const firstTab = document.querySelector('.tab-btn.active');
        if (firstTab) {
            const widgetName = firstTab.getAttribute('data-widget') || 'lights';
            switchWidget(widgetName, firstTab);
        }
    }

    window.switchWidget = function(widgetName, clickedBtn) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        // Switch visible widget
        document.querySelectorAll('.widget').forEach(w => w.classList.remove('active'));
        const activeWidget = document.getElementById('widget-' + widgetName);
        if (activeWidget) activeWidget.classList.add('active');

        // Optional: Send to Crestron
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('s', 'active_widget_name', widgetName);
        }
    };

    window.switchTVSubWidget = function(subwidgetName, clickedBtn) {
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        
        document.querySelectorAll('.tv-subwidget').forEach(w => w.classList.remove('active'));
        document.getElementById(subwidgetName).classList.add('active');
    };

    // ====================== SHARED FUNCTIONS ======================
    function toggleTile(name, cls) {
        const tog = document.getElementById('tog-' + name);
        const tile = document.getElementById('tile-' + name);
        const lbl = document.getElementById('lbl-' + name);
        if (!tog || !tile || !lbl) return;

        const isOn = tog.checked;
        tile.classList.toggle(cls, isOn);
        lbl.textContent = isOn ? 'ON' : 'OFF';

        if (name === 'lights') setStatus(isOn ? 'on' : 'off');
    }

    function setStatus(s) {
        const pill = document.getElementById('statusPill');
        const text = document.getElementById('lightingStatus');
        if (!pill || !text) return;

        pill.className = 'spill';
        if (s === 'on')  { pill.classList.add('sp-on');  text.textContent = 'Lights: ON'; }
        if (s === 'off') { pill.classList.add('sp-off'); text.textContent = 'Lights: OFF'; }
        if (s === 'dim') { pill.classList.add('sp-dim'); text.textContent = 'Lights: DIMMED'; }
    }

    function updateDial(pct) {
        const fill = document.getElementById('arc-fill');
        const label = document.getElementById('arc-label');
        if (!fill) return;

        const cx = 100, cy = 105, r = 76;
        const deg = -180 + pct * 1.8;
        const rad = deg * Math.PI / 180;
        const ex = cx + r * Math.cos(rad);
        const ey = cy + r * Math.sin(rad);

        if (pct <= 0) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 24.001 105');
        } else if (pct >= 100) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 176 105');
        } else {
            fill.setAttribute('d', `M 24 105 A 76 76 0 ${pct > 50 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== SLIDERS & BUTTONS ======================
    function setupSliders() {
        // Dimmer Slider (Lights Widget)
        const dimSlider = document.getElementById('dimLevelSlider');
        if (dimSlider) {
            dimSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '31', v);
            });
        }

        // Shades Slider
        const shadeSlider = document.getElementById('shadeSlider');
        if (shadeSlider) {
            shadeSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('shadeValue').textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '36', v);
            });
        }

        // ==================== NEW: AC Setpoint Slider ====================
        const acSlider = document.getElementById('acSetpointSlider');
        if (acSlider) {
            acSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                const display = document.getElementById('acSetValue');
                if (display) display.textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '41', v);
            });
        }
    }

    function setupButtonEventListeners() {
        // Lights Quick Buttons
        document.getElementById('lightsOnBtn')?.addEventListener('click', () => {
            setStatus('on');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = true; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '10', true);
                setTimeout(() => CrComLib.publishEvent('b', '10', false), 100);
            }
        });

        document.getElementById('lightsOffBtn')?.addEventListener('click', () => {
            setStatus('off');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = false; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '11', true);
                setTimeout(() => CrComLib.publishEvent('b', '11', false), 100);
            }
        });

        document.getElementById('lightsDimBtn')?.addEventListener('click', () => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) {
                slider.value = 50;
                const v = 50;
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('n', '31', v);
                    CrComLib.publishEvent('b', '12', true);
                    setTimeout(() => CrComLib.publishEvent('b', '12', false), 100);
                }
            }
        });

        

        // Shades Buttons
        document.getElementById('shadeUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '50', true);
                setTimeout(() => CrComLib.publishEvent('b', '50', false), 100);
            }
        });
        document.getElementById('shadeStopBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '52', true);
                setTimeout(() => CrComLib.publishEvent('b', '52', false), 100);
            }
        });
        document.getElementById('shadeDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '51', true);
                setTimeout(() => CrComLib.publishEvent('b', '51', false), 100);
            }
        });

        // ==================== NEW: AC CONTROLS ====================
        // AC Power Toggle (pulses on every change - matches Crestron toggle behavior)
        const acToggle = document.getElementById('tog-ac');
        if (acToggle) {
            acToggle.addEventListener('change', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', '70', true);
                    setTimeout(() => CrComLib.publishEvent('b', '70', false), 100);
                }
            });
        }

        // AC Modes
        document.getElementById('acCoolBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '71', true);
                setTimeout(() => CrComLib.publishEvent('b', '71', false), 100);
            }
        });
        document.getElementById('acHeatBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '72', true);
                setTimeout(() => CrComLib.publishEvent('b', '72', false), 100);
            }
        });
        document.getElementById('acAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '73', true);
                setTimeout(() => CrComLib.publishEvent('b', '73', false), 100);
            }
        });
        document.getElementById('acDryBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '74', true);
                setTimeout(() => CrComLib.publishEvent('b', '74', false), 100);
            }
        });
        document.getElementById('acFanBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '75', true);
                setTimeout(() => CrComLib.publishEvent('b', '75', false), 100);
            }
        });

        // AC Fan Speeds
        document.getElementById('acFanLowBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '76', true);
                setTimeout(() => CrComLib.publishEvent('b', '76', false), 100);
            }
        });
        document.getElementById('acFanMedBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '77', true);
                setTimeout(() => CrComLib.publishEvent('b', '77', false), 100);
            }
        });
        document.getElementById('acFanHighBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '78', true);
                setTimeout(() => CrComLib.publishEvent('b', '78', false), 100);
            }
        });
        document.getElementById('acFanAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '79', true);
                setTimeout(() => CrComLib.publishEvent('b', '79', false), 100);
            }
        });

        // AC Swing
        document.getElementById('acSwingBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '81', true);
                setTimeout(() => CrComLib.publishEvent('b', '81', false), 100);
            }
        });

        // ====================== TV BUTTONS & REMOTE ======================

        // Quick Action Buttons (Top of TV Widget)
        document.getElementById('tvPowerBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvNetflixBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '61', true);
                setTimeout(() => CrComLib.publishEvent('b', '61', false), 100);
            }
        });

        document.getElementById('tvHdmiBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '62', true);
                setTimeout(() => CrComLib.publishEvent('b', '62', false), 100);
            }
        });

        // ==================== TV REMOTE CONTROLS (Inside TV Controls Sub-Widget) ====================

        // Power & Source Buttons (inside remote)
        document.getElementById('tvPowerBtn2')?.addEventListener('click', () => {   // tvPowerBtn2 is the one in remote
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvSourceBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '68', true);   // You can change join number
                setTimeout(() => CrComLib.publishEvent('b', '68', false), 100);
            }
        });

        // ==================== D-PAD ====================
        document.getElementById('tvDpadUp')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '63', true);
                setTimeout(() => CrComLib.publishEvent('b', '63', false), 100);
            }
        });

        document.getElementById('tvDpadDown')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '64', true);
                setTimeout(() => CrComLib.publishEvent('b', '64', false), 100);
            }
        });

        document.getElementById('tvDpadLeft')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '65', true);
                setTimeout(() => CrComLib.publishEvent('b', '65', false), 100);
            }
        });

        document.getElementById('tvDpadRight')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '66', true);
                setTimeout(() => CrComLib.publishEvent('b', '66', false), 100);
            }
        });

        document.getElementById('tvDpadOk')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '67', true);
                setTimeout(() => CrComLib.publishEvent('b', '67', false), 100);
            }
        });

        // ==================== NUMERIC KEYPAD (0-9 + Enter) ====================
        for (let i = 0; i <= 9; i++) {
            const keyBtn = document.getElementById('tvKey' + i);
            if (keyBtn) {
                keyBtn.addEventListener('click', () => {
                    if (typeof CrComLib !== 'undefined') {
                        // Joins 90 to 99 for digits
                        CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), true);
                        setTimeout(() => CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), false), 100);
                    }
                });
            }
        }

        document.getElementById('tvKeyEnter')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '100', true);   // Enter button join
                setTimeout(() => CrComLib.publishEvent('b', '100', false), 100);
            }
        });

        // ==================== VOLUME & CHANNEL CONTROLS ====================
        document.getElementById('tvVolUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '101', true);
                setTimeout(() => CrComLib.publishEvent('b', '101', false), 100);
            }
        });

        document.getElementById('tvVolDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '102', true);
                setTimeout(() => CrComLib.publishEvent('b', '102', false), 100);
            }
        });

        document.getElementById('tvMuteBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '103', true);
                setTimeout(() => CrComLib.publishEvent('b', '103', false), 100);
            }
        });

        document.getElementById('tvChUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '104', true);
                setTimeout(() => CrComLib.publishEvent('b', '104', false), 100);
            }
        });

        document.getElementById('tvChDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '105', true);
                setTimeout(() => CrComLib.publishEvent('b', '105', false), 100);
            }
        });

        // ==================== FAVORITES GRID (Dynamic) ====================
        // Example: Assign joins starting from 110 onwards
        const favButtons = document.querySelectorAll('.fav-btn');
        favButtons.forEach((btn, index) => {
            const joinNumber = 110 + index;   // 110, 111, 112 ...
        
            btn.addEventListener('click', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', String(joinNumber), true);
                    setTimeout(() => CrComLib.publishEvent('b', String(joinNumber), false), 100);
                }
                console.log(`Favorite ${index + 1} pressed → Digital Join ${joinNumber}`);
            });
        });
        

    function setupFeedbackSubscriptions() {
        // Existing dimmer feedback
        CrComLib.subscribeState('n', '30', (val) => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) slider.value = val;
            document.getElementById('dimValue').textContent = val;
            document.getElementById('dimPercentage').textContent = val + '%';
            updateDial(val);
        });

        // ==================== NEW: AC Feedback ====================
        CrComLib.subscribeState('n', '40', (val) => {
            const currentEl = document.getElementById('acCurrentTemp');
            if (currentEl) currentEl.textContent = Math.round(val) + '°C';
        });
    }

    function requestCurrentStatus() {
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('b', '99', true);
            setTimeout(() => CrComLib.publishEvent('b', '99', false), 100);
        }
    }

    function setupTopNavigation() {
        CrComLib.publishEvent("b", "active_state_class_page8", true);
    }

    // Clock
    function tick() {
        const el = document.getElementById('clockDisplay');
        if (!el) return;
        const n = new Date();
        el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
    }
    setInterval(tick, 15000);
    tick();

    // Page Load Handler
    let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:page8-import-page', (value) => {
        if (value && value['loaded']) {
            onInit();
            setTimeout(() => CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:page8-import-page', loadedSubId), 100);
        }
    });

    return {};
}})();


/* page9.js */
const page9Module = (() => {
    'use strict';

    function onInit() {
        console.log('✅ Page 1 Initialized with 4 Widgets');

        setupButtonEventListeners();
        setupSliders();
        setupFeedbackSubscriptions();
        requestCurrentStatus();
        setupTopNavigation();
        initializeWidgets();
    }

    // ====================== WIDGET MANAGEMENT ======================
    function initializeWidgets() {
        const firstTab = document.querySelector('.tab-btn.active');
        if (firstTab) {
            const widgetName = firstTab.getAttribute('data-widget') || 'lights';
            switchWidget(widgetName, firstTab);
        }
    }

    window.switchWidget = function(widgetName, clickedBtn) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        // Switch visible widget
        document.querySelectorAll('.widget').forEach(w => w.classList.remove('active'));
        const activeWidget = document.getElementById('widget-' + widgetName);
        if (activeWidget) activeWidget.classList.add('active');

        // Optional: Send to Crestron
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('s', 'active_widget_name', widgetName);
        }
    };

    window.switchTVSubWidget = function(subwidgetName, clickedBtn) {
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        
        document.querySelectorAll('.tv-subwidget').forEach(w => w.classList.remove('active'));
        document.getElementById(subwidgetName).classList.add('active');
    };

    // ====================== SHARED FUNCTIONS ======================
    function toggleTile(name, cls) {
        const tog = document.getElementById('tog-' + name);
        const tile = document.getElementById('tile-' + name);
        const lbl = document.getElementById('lbl-' + name);
        if (!tog || !tile || !lbl) return;

        const isOn = tog.checked;
        tile.classList.toggle(cls, isOn);
        lbl.textContent = isOn ? 'ON' : 'OFF';

        if (name === 'lights') setStatus(isOn ? 'on' : 'off');
    }

    function setStatus(s) {
        const pill = document.getElementById('statusPill');
        const text = document.getElementById('lightingStatus');
        if (!pill || !text) return;

        pill.className = 'spill';
        if (s === 'on')  { pill.classList.add('sp-on');  text.textContent = 'Lights: ON'; }
        if (s === 'off') { pill.classList.add('sp-off'); text.textContent = 'Lights: OFF'; }
        if (s === 'dim') { pill.classList.add('sp-dim'); text.textContent = 'Lights: DIMMED'; }
    }

    function updateDial(pct) {
        const fill = document.getElementById('arc-fill');
        const label = document.getElementById('arc-label');
        if (!fill) return;

        const cx = 100, cy = 105, r = 76;
        const deg = -180 + pct * 1.8;
        const rad = deg * Math.PI / 180;
        const ex = cx + r * Math.cos(rad);
        const ey = cy + r * Math.sin(rad);

        if (pct <= 0) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 24.001 105');
        } else if (pct >= 100) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 176 105');
        } else {
            fill.setAttribute('d', `M 24 105 A 76 76 0 ${pct > 50 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== SLIDERS & BUTTONS ======================
    function setupSliders() {
        // Dimmer Slider (Lights Widget)
        const dimSlider = document.getElementById('dimLevelSlider');
        if (dimSlider) {
            dimSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '31', v);
            });
        }

        // Shades Slider
        const shadeSlider = document.getElementById('shadeSlider');
        if (shadeSlider) {
            shadeSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('shadeValue').textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '36', v);
            });
        }

        // ==================== NEW: AC Setpoint Slider ====================
        const acSlider = document.getElementById('acSetpointSlider');
        if (acSlider) {
            acSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                const display = document.getElementById('acSetValue');
                if (display) display.textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '41', v);
            });
        }
    }

    function setupButtonEventListeners() {
        // Lights Quick Buttons
        document.getElementById('lightsOnBtn')?.addEventListener('click', () => {
            setStatus('on');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = true; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '10', true);
                setTimeout(() => CrComLib.publishEvent('b', '10', false), 100);
            }
        });

        document.getElementById('lightsOffBtn')?.addEventListener('click', () => {
            setStatus('off');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = false; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '11', true);
                setTimeout(() => CrComLib.publishEvent('b', '11', false), 100);
            }
        });

        document.getElementById('lightsDimBtn')?.addEventListener('click', () => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) {
                slider.value = 50;
                const v = 50;
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('n', '31', v);
                    CrComLib.publishEvent('b', '12', true);
                    setTimeout(() => CrComLib.publishEvent('b', '12', false), 100);
                }
            }
        });

        

        // Shades Buttons
        document.getElementById('shadeUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '50', true);
                setTimeout(() => CrComLib.publishEvent('b', '50', false), 100);
            }
        });
        document.getElementById('shadeStopBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '52', true);
                setTimeout(() => CrComLib.publishEvent('b', '52', false), 100);
            }
        });
        document.getElementById('shadeDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '51', true);
                setTimeout(() => CrComLib.publishEvent('b', '51', false), 100);
            }
        });

        // ==================== NEW: AC CONTROLS ====================
        // AC Power Toggle (pulses on every change - matches Crestron toggle behavior)
        const acToggle = document.getElementById('tog-ac');
        if (acToggle) {
            acToggle.addEventListener('change', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', '70', true);
                    setTimeout(() => CrComLib.publishEvent('b', '70', false), 100);
                }
            });
        }

        // AC Modes
        document.getElementById('acCoolBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '71', true);
                setTimeout(() => CrComLib.publishEvent('b', '71', false), 100);
            }
        });
        document.getElementById('acHeatBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '72', true);
                setTimeout(() => CrComLib.publishEvent('b', '72', false), 100);
            }
        });
        document.getElementById('acAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '73', true);
                setTimeout(() => CrComLib.publishEvent('b', '73', false), 100);
            }
        });
        document.getElementById('acDryBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '74', true);
                setTimeout(() => CrComLib.publishEvent('b', '74', false), 100);
            }
        });
        document.getElementById('acFanBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '75', true);
                setTimeout(() => CrComLib.publishEvent('b', '75', false), 100);
            }
        });

        // AC Fan Speeds
        document.getElementById('acFanLowBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '76', true);
                setTimeout(() => CrComLib.publishEvent('b', '76', false), 100);
            }
        });
        document.getElementById('acFanMedBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '77', true);
                setTimeout(() => CrComLib.publishEvent('b', '77', false), 100);
            }
        });
        document.getElementById('acFanHighBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '78', true);
                setTimeout(() => CrComLib.publishEvent('b', '78', false), 100);
            }
        });
        document.getElementById('acFanAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '79', true);
                setTimeout(() => CrComLib.publishEvent('b', '79', false), 100);
            }
        });

        // AC Swing
        document.getElementById('acSwingBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '81', true);
                setTimeout(() => CrComLib.publishEvent('b', '81', false), 100);
            }
        });

        // ====================== TV BUTTONS & REMOTE ======================

        // Quick Action Buttons (Top of TV Widget)
        document.getElementById('tvPowerBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvNetflixBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '61', true);
                setTimeout(() => CrComLib.publishEvent('b', '61', false), 100);
            }
        });

        document.getElementById('tvHdmiBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '62', true);
                setTimeout(() => CrComLib.publishEvent('b', '62', false), 100);
            }
        });

        // ==================== TV REMOTE CONTROLS (Inside TV Controls Sub-Widget) ====================

        // Power & Source Buttons (inside remote)
        document.getElementById('tvPowerBtn2')?.addEventListener('click', () => {   // tvPowerBtn2 is the one in remote
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvSourceBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '68', true);   // You can change join number
                setTimeout(() => CrComLib.publishEvent('b', '68', false), 100);
            }
        });

        // ==================== D-PAD ====================
        document.getElementById('tvDpadUp')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '63', true);
                setTimeout(() => CrComLib.publishEvent('b', '63', false), 100);
            }
        });

        document.getElementById('tvDpadDown')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '64', true);
                setTimeout(() => CrComLib.publishEvent('b', '64', false), 100);
            }
        });

        document.getElementById('tvDpadLeft')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '65', true);
                setTimeout(() => CrComLib.publishEvent('b', '65', false), 100);
            }
        });

        document.getElementById('tvDpadRight')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '66', true);
                setTimeout(() => CrComLib.publishEvent('b', '66', false), 100);
            }
        });

        document.getElementById('tvDpadOk')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '67', true);
                setTimeout(() => CrComLib.publishEvent('b', '67', false), 100);
            }
        });

        // ==================== NUMERIC KEYPAD (0-9 + Enter) ====================
        for (let i = 0; i <= 9; i++) {
            const keyBtn = document.getElementById('tvKey' + i);
            if (keyBtn) {
                keyBtn.addEventListener('click', () => {
                    if (typeof CrComLib !== 'undefined') {
                        // Joins 90 to 99 for digits
                        CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), true);
                        setTimeout(() => CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), false), 100);
                    }
                });
            }
        }

        document.getElementById('tvKeyEnter')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '100', true);   // Enter button join
                setTimeout(() => CrComLib.publishEvent('b', '100', false), 100);
            }
        });

        // ==================== VOLUME & CHANNEL CONTROLS ====================
        document.getElementById('tvVolUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '101', true);
                setTimeout(() => CrComLib.publishEvent('b', '101', false), 100);
            }
        });

        document.getElementById('tvVolDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '102', true);
                setTimeout(() => CrComLib.publishEvent('b', '102', false), 100);
            }
        });

        document.getElementById('tvMuteBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '103', true);
                setTimeout(() => CrComLib.publishEvent('b', '103', false), 100);
            }
        });

        document.getElementById('tvChUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '104', true);
                setTimeout(() => CrComLib.publishEvent('b', '104', false), 100);
            }
        });

        document.getElementById('tvChDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '105', true);
                setTimeout(() => CrComLib.publishEvent('b', '105', false), 100);
            }
        });

        // ==================== FAVORITES GRID (Dynamic) ====================
        // Example: Assign joins starting from 110 onwards
        const favButtons = document.querySelectorAll('.fav-btn');
        favButtons.forEach((btn, index) => {
            const joinNumber = 110 + index;   // 110, 111, 112 ...
        
            btn.addEventListener('click', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', String(joinNumber), true);
                    setTimeout(() => CrComLib.publishEvent('b', String(joinNumber), false), 100);
                }
                console.log(`Favorite ${index + 1} pressed → Digital Join ${joinNumber}`);
            });
        });
        

    function setupFeedbackSubscriptions() {
        // Existing dimmer feedback
        CrComLib.subscribeState('n', '30', (val) => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) slider.value = val;
            document.getElementById('dimValue').textContent = val;
            document.getElementById('dimPercentage').textContent = val + '%';
            updateDial(val);
        });

        // ==================== NEW: AC Feedback ====================
        CrComLib.subscribeState('n', '40', (val) => {
            const currentEl = document.getElementById('acCurrentTemp');
            if (currentEl) currentEl.textContent = Math.round(val) + '°C';
        });
    }

    function requestCurrentStatus() {
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('b', '99', true);
            setTimeout(() => CrComLib.publishEvent('b', '99', false), 100);
        }
    }

    function setupTopNavigation() {
        CrComLib.publishEvent("b", "active_state_class_page9", true);
    }

    // Clock
    function tick() {
        const el = document.getElementById('clockDisplay');
        if (!el) return;
        const n = new Date();
        el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
    }
    setInterval(tick, 15000);
    tick();

    // Page Load Handler
    let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:page9-import-page', (value) => {
        if (value && value['loaded']) {
            onInit();
            setTimeout(() => CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:page9-import-page', loadedSubId), 100);
        }
    });

    return {};
}})();


