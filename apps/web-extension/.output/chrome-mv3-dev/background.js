var background = (function() {
	//#region ../../node_modules/wxt/dist/utils/define-background.mjs
	function defineBackground(arg) {
		if (arg == null || typeof arg === "function") return { main: arg };
		return arg;
	}
	//#endregion
	//#region ../../node_modules/wxt/dist/browser.mjs
	/**
	* Contains the `browser` export which you should use to access the extension
	* APIs in your project:
	*
	* ```ts
	* import { browser } from 'wxt/browser';
	*
	* browser.runtime.onInstalled.addListener(() => {
	*   // ...
	* });
	* ```
	*
	* @module wxt/browser
	*/
	var browser = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
	//#endregion
	//#region entrypoints/background.ts
	var background_default = defineBackground({
		manifest: { permissions: [
			"storage",
			"contextMenus",
			"sidePanel",
			"activeTab"
		] },
		main() {
			console.log("Background loaded");
			browser.commands.onCommand.addListener(async (command) => {
				console.log("Command:", command);
				if (command === "save-selection") {
					const [tab] = await browser.tabs.query({
						active: true,
						currentWindow: true
					});
					if (tab.id) {
						const selection = (await browser.scripting.executeScript({
							target: { tabId: tab.id },
							func: () => window.getSelection()?.toString().trim() || ""
						}))[0]?.result;
						console.log("Selection:", selection?.slice(0, 30));
						if (selection && tab.url && !tab.url.startsWith("chrome://")) {
							await browser.storage.session.set({ pendingSelection: selection });
							browser.action.setBadgeText({ text: "!" });
							browser.action.setBadgeBackgroundColor({ color: "#e5446c" });
						}
					}
				}
			});
			browser.contextMenus?.create({
				id: "save-to-rwote",
				title: "Save to Rwote",
				contexts: ["selection"]
			});
			browser.contextMenus?.onClicked.addListener(async (info, tab) => {
				if (info.menuItemId === "save-to-rwote" && info.selectionText && tab.id) {
					await browser.storage.session.set({ pendingSelection: info.selectionText.trim() });
					browser.action.setBadgeText({ text: "!" });
					browser.action.setBadgeBackgroundColor({ color: "#e5446c" });
				}
			});
			browser.action.onClicked.addListener(async (tab) => {
				if (tab.id) {
					browser.action.setBadgeText({ text: "" });
					await browser.sidePanel.open({ tabId: tab.id });
					browser.tabs.sendMessage(tab.id, { type: "refresh" });
				}
			});
		}
	});
	//#endregion
	//#region ../../node_modules/@webext-core/match-patterns/lib/index.js
	var _MatchPattern = class {
		constructor(matchPattern) {
			if (matchPattern === "<all_urls>") {
				this.isAllUrls = true;
				this.protocolMatches = [..._MatchPattern.PROTOCOLS];
				this.hostnameMatch = "*";
				this.pathnameMatch = "*";
			} else {
				const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
				if (groups == null) throw new InvalidMatchPattern(matchPattern, "Incorrect format");
				const [_, protocol, hostname, pathname] = groups;
				validateProtocol(matchPattern, protocol);
				validateHostname(matchPattern, hostname);
				validatePathname(matchPattern, pathname);
				this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
				this.hostnameMatch = hostname;
				this.pathnameMatch = pathname;
			}
		}
		includes(url) {
			if (this.isAllUrls) return true;
			const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
			return !!this.protocolMatches.find((protocol) => {
				if (protocol === "http") return this.isHttpMatch(u);
				if (protocol === "https") return this.isHttpsMatch(u);
				if (protocol === "file") return this.isFileMatch(u);
				if (protocol === "ftp") return this.isFtpMatch(u);
				if (protocol === "urn") return this.isUrnMatch(u);
			});
		}
		isHttpMatch(url) {
			return url.protocol === "http:" && this.isHostPathMatch(url);
		}
		isHttpsMatch(url) {
			return url.protocol === "https:" && this.isHostPathMatch(url);
		}
		isHostPathMatch(url) {
			if (!this.hostnameMatch || !this.pathnameMatch) return false;
			const hostnameMatchRegexs = [this.convertPatternToRegex(this.hostnameMatch), this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))];
			const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
			return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
		}
		isFileMatch(url) {
			throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
		}
		isFtpMatch(url) {
			throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
		}
		isUrnMatch(url) {
			throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
		}
		convertPatternToRegex(pattern) {
			const starsReplaced = this.escapeForRegex(pattern).replace(/\\\*/g, ".*");
			return RegExp(`^${starsReplaced}$`);
		}
		escapeForRegex(string) {
			return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		}
	};
	var MatchPattern = _MatchPattern;
	MatchPattern.PROTOCOLS = [
		"http",
		"https",
		"file",
		"ftp",
		"urn"
	];
	var InvalidMatchPattern = class extends Error {
		constructor(matchPattern, reason) {
			super(`Invalid match pattern "${matchPattern}": ${reason}`);
		}
	};
	function validateProtocol(matchPattern, protocol) {
		if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*") throw new InvalidMatchPattern(matchPattern, `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`);
	}
	function validateHostname(matchPattern, hostname) {
		if (hostname.includes(":")) throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
		if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*.")) throw new InvalidMatchPattern(matchPattern, `If using a wildcard (*), it must go at the start of the hostname`);
	}
	function validatePathname(matchPattern, pathname) {}
	//#endregion
	//#region \0virtual:wxt-background-entrypoint?/home/abhi/projects/dsa-insights/apps/web-extension/entrypoints/background.ts
	function print(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger = {
		debug: (...args) => print(console.debug, ...args),
		log: (...args) => print(console.log, ...args),
		warn: (...args) => print(console.warn, ...args),
		error: (...args) => print(console.error, ...args)
	};
	var ws;
	/** Connect to the websocket and listen for messages. */
	function getDevServerWebSocket() {
		if (ws == null) {
			const serverUrl = "ws://localhost:3000";
			logger.debug("Connecting to dev server @", serverUrl);
			ws = new WebSocket(serverUrl, "vite-hmr");
			ws.addWxtEventListener = ws.addEventListener.bind(ws);
			ws.sendCustom = (event, payload) => ws?.send(JSON.stringify({
				type: "custom",
				event,
				payload
			}));
			ws.addEventListener("open", () => {
				logger.debug("Connected to dev server");
			});
			ws.addEventListener("close", () => {
				logger.debug("Disconnected from dev server");
			});
			ws.addEventListener("error", (event) => {
				logger.error("Failed to connect to dev server", event);
			});
			ws.addEventListener("message", (e) => {
				try {
					const message = JSON.parse(e.data);
					if (message.type === "custom") ws?.dispatchEvent(new CustomEvent(message.event, { detail: message.data }));
				} catch (err) {
					logger.error("Failed to handle message", err);
				}
			});
		}
		return ws;
	}
	/** https://developer.chrome.com/blog/longer-esw-lifetimes/ */
	function keepServiceWorkerAlive() {
		setInterval(async () => {
			await browser.runtime.getPlatformInfo();
		}, 5e3);
	}
	function reloadContentScript(payload) {
		if (browser.runtime.getManifest().manifest_version == 2) reloadContentScriptMv2(payload);
		else reloadContentScriptMv3(payload);
	}
	async function reloadContentScriptMv3({ registration, contentScript }) {
		if (registration === "runtime") await reloadRuntimeContentScriptMv3(contentScript);
		else await reloadManifestContentScriptMv3(contentScript);
	}
	async function reloadManifestContentScriptMv3(contentScript) {
		const id = `wxt:${contentScript.js[0]}`;
		logger.log("Reloading content script:", contentScript);
		const registered = await browser.scripting.getRegisteredContentScripts();
		logger.debug("Existing scripts:", registered);
		const existing = registered.find((cs) => cs.id === id);
		if (existing) {
			logger.debug("Updating content script", existing);
			await browser.scripting.updateContentScripts([{
				...contentScript,
				id,
				css: contentScript.css ?? []
			}]);
		} else {
			logger.debug("Registering new content script...");
			await browser.scripting.registerContentScripts([{
				...contentScript,
				id,
				css: contentScript.css ?? []
			}]);
		}
		await reloadTabsForContentScript(contentScript);
	}
	async function reloadRuntimeContentScriptMv3(contentScript) {
		logger.log("Reloading content script:", contentScript);
		const registered = await browser.scripting.getRegisteredContentScripts();
		logger.debug("Existing scripts:", registered);
		const matches = registered.filter((cs) => {
			const hasJs = contentScript.js?.find((js) => cs.js?.includes(js));
			const hasCss = contentScript.css?.find((css) => cs.css?.includes(css));
			return hasJs || hasCss;
		});
		if (matches.length === 0) {
			logger.log("Content script is not registered yet, nothing to reload", contentScript);
			return;
		}
		await browser.scripting.updateContentScripts(matches);
		await reloadTabsForContentScript(contentScript);
	}
	async function reloadTabsForContentScript(contentScript) {
		const allTabs = await browser.tabs.query({});
		const matchPatterns = contentScript.matches.map((match) => new MatchPattern(match));
		const matchingTabs = allTabs.filter((tab) => {
			const url = tab.url;
			if (!url) return false;
			return !!matchPatterns.find((pattern) => pattern.includes(url));
		});
		await Promise.all(matchingTabs.map(async (tab) => {
			try {
				await browser.tabs.reload(tab.id);
			} catch (err) {
				logger.warn("Failed to reload tab:", err);
			}
		}));
	}
	async function reloadContentScriptMv2(_payload) {
		throw Error("TODO: reloadContentScriptMv2");
	}
	try {
		const ws = getDevServerWebSocket();
		ws.addWxtEventListener("wxt:reload-extension", () => {
			browser.runtime.reload();
		});
		ws.addWxtEventListener("wxt:reload-content-script", (event) => {
			reloadContentScript(event.detail);
		});
		ws.addEventListener("open", () => ws.sendCustom("wxt:background-initialized"));
		keepServiceWorkerAlive();
	} catch (err) {
		logger.error("Failed to setup web socket connection with dev server", err);
	}
	browser.commands.onCommand.addListener((command) => {
		if (command === "wxt:reload-extension") browser.runtime.reload();
	});
	var result;
	try {
		result = background_default.main();
		if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
	} catch (err) {
		logger.error("The background crashed on startup!");
		throw err;
	}
	//#endregion
	return result;
})();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvZGVmaW5lLWJhY2tncm91bmQubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3eHQtZGV2L2Jyb3dzZXIvc3JjL2luZGV4Lm1qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyLm1qcyIsIi4uLy4uL2VudHJ5cG9pbnRzL2JhY2tncm91bmQudHMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQHdlYmV4dC1jb3JlL21hdGNoLXBhdHRlcm5zL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyNyZWdpb24gc3JjL3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kLnRzXG5mdW5jdGlvbiBkZWZpbmVCYWNrZ3JvdW5kKGFyZykge1xuXHRpZiAoYXJnID09IG51bGwgfHwgdHlwZW9mIGFyZyA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4geyBtYWluOiBhcmcgfTtcblx0cmV0dXJuIGFyZztcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgZGVmaW5lQmFja2dyb3VuZCB9O1xuIiwiLy8gI3JlZ2lvbiBzbmlwcGV0XG5leHBvcnQgY29uc3QgYnJvd3NlciA9IGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWRcbiAgPyBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgOiBnbG9iYWxUaGlzLmNocm9tZTtcbi8vICNlbmRyZWdpb24gc25pcHBldFxuIiwiaW1wb3J0IHsgYnJvd3NlciBhcyBicm93c2VyJDEgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy9icm93c2VyLnRzXG4vKipcbiogQ29udGFpbnMgdGhlIGBicm93c2VyYCBleHBvcnQgd2hpY2ggeW91IHNob3VsZCB1c2UgdG8gYWNjZXNzIHRoZSBleHRlbnNpb25cbiogQVBJcyBpbiB5b3VyIHByb2plY3Q6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICd3eHQvYnJvd3Nlcic7XG4qXG4qIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4qICAgLy8gLi4uXG4qIH0pO1xuKiBgYGBcbipcbiogQG1vZHVsZSB3eHQvYnJvd3NlclxuKi9cbmNvbnN0IGJyb3dzZXIgPSBicm93c2VyJDE7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGJyb3dzZXIgfTtcbiIsImV4cG9ydCBkZWZhdWx0IGRlZmluZUJhY2tncm91bmQoe1xuICBtYW5pZmVzdDoge1xuICAgIHBlcm1pc3Npb25zOiBbJ3N0b3JhZ2UnLCAnY29udGV4dE1lbnVzJywgJ3NpZGVQYW5lbCcsICdhY3RpdmVUYWInXSxcbiAgfSxcbiAgbWFpbigpIHtcbiAgICBjb25zb2xlLmxvZygnQmFja2dyb3VuZCBsb2FkZWQnKTtcblxuICAgIC8vIEhhbmRsZSBrZXlib2FyZCBjb21tYW5kXG4gICAgYnJvd3Nlci5jb21tYW5kcy5vbkNvbW1hbmQuYWRkTGlzdGVuZXIoYXN5bmMgKGNvbW1hbmQpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdDb21tYW5kOicsIGNvbW1hbmQpO1xuICAgICAgaWYgKGNvbW1hbmQgPT09ICdzYXZlLXNlbGVjdGlvbicpIHtcbiAgICAgICAgY29uc3QgW3RhYl0gPSBhd2FpdCBicm93c2VyLnRhYnMucXVlcnkoeyBhY3RpdmU6IHRydWUsIGN1cnJlbnRXaW5kb3c6IHRydWUgfSk7XG4gICAgICAgIGlmICh0YWIuaWQpIHtcbiAgICAgICAgICAvLyBFeGVjdXRlIHNjcmlwdCB0byBnZXQgc2VsZWN0aW9uXG4gICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IGJyb3dzZXIuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuICAgICAgICAgICAgdGFyZ2V0OiB7IHRhYklkOiB0YWIuaWQgfSxcbiAgICAgICAgICAgIGZ1bmM6ICgpID0+IHdpbmRvdy5nZXRTZWxlY3Rpb24oKT8udG9TdHJpbmcoKS50cmltKCkgfHwgJycsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gcmVzdWx0c1swXT8ucmVzdWx0O1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdTZWxlY3Rpb246Jywgc2VsZWN0aW9uPy5zbGljZSgwLCAzMCkpO1xuICAgICAgICAgIGlmIChzZWxlY3Rpb24gJiYgdGFiLnVybCAmJiAhdGFiLnVybC5zdGFydHNXaXRoKCdjaHJvbWU6Ly8nKSkge1xuICAgICAgICAgICAgYXdhaXQgYnJvd3Nlci5zdG9yYWdlLnNlc3Npb24uc2V0KHsgcGVuZGluZ1NlbGVjdGlvbjogc2VsZWN0aW9uIH0pO1xuICAgICAgICAgICAgYnJvd3Nlci5hY3Rpb24uc2V0QmFkZ2VUZXh0KHsgdGV4dDogJyEnIH0pO1xuICAgICAgICAgICAgYnJvd3Nlci5hY3Rpb24uc2V0QmFkZ2VCYWNrZ3JvdW5kQ29sb3IoeyBjb2xvcjogJyNlNTQ0NmMnIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gQ29udGV4dCBtZW51XG4gICAgYnJvd3Nlci5jb250ZXh0TWVudXM/LmNyZWF0ZSh7XG4gICAgICBpZDogJ3NhdmUtdG8tcndvdGUnLFxuICAgICAgdGl0bGU6ICdTYXZlIHRvIFJ3b3RlJyxcbiAgICAgIGNvbnRleHRzOiBbJ3NlbGVjdGlvbiddLFxuICAgIH0pO1xuXG4gICAgYnJvd3Nlci5jb250ZXh0TWVudXM/Lm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcihhc3luYyAoaW5mbywgdGFiKSA9PiB7XG4gICAgICBpZiAoaW5mby5tZW51SXRlbUlkID09PSAnc2F2ZS10by1yd290ZScgJiYgaW5mby5zZWxlY3Rpb25UZXh0ICYmIHRhYi5pZCkge1xuICAgICAgICBhd2FpdCBicm93c2VyLnN0b3JhZ2Uuc2Vzc2lvbi5zZXQoeyBwZW5kaW5nU2VsZWN0aW9uOiBpbmZvLnNlbGVjdGlvblRleHQudHJpbSgpIH0pO1xuICAgICAgICBicm93c2VyLmFjdGlvbi5zZXRCYWRnZVRleHQoeyB0ZXh0OiAnIScgfSk7XG4gICAgICAgIGJyb3dzZXIuYWN0aW9uLnNldEJhZGdlQmFja2dyb3VuZENvbG9yKHsgY29sb3I6ICcjZTU0NDZjJyB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEljb24gY2xpY2tcbiAgICBicm93c2VyLmFjdGlvbi5vbkNsaWNrZWQuYWRkTGlzdGVuZXIoYXN5bmMgKHRhYikgPT4ge1xuICAgICAgaWYgKHRhYi5pZCkge1xuICAgICAgICBicm93c2VyLmFjdGlvbi5zZXRCYWRnZVRleHQoeyB0ZXh0OiAnJyB9KTtcbiAgICAgICAgYXdhaXQgYnJvd3Nlci5zaWRlUGFuZWwub3Blbih7IHRhYklkOiB0YWIuaWQgfSk7XG4gICAgICAgIGJyb3dzZXIudGFicy5zZW5kTWVzc2FnZSh0YWIuaWQsIHsgdHlwZTogJ3JlZnJlc2gnIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxufSk7IiwiLy8gc3JjL2luZGV4LnRzXG52YXIgX01hdGNoUGF0dGVybiA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuKSB7XG4gICAgaWYgKG1hdGNoUGF0dGVybiA9PT0gXCI8YWxsX3VybHM+XCIpIHtcbiAgICAgIHRoaXMuaXNBbGxVcmxzID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gWy4uLl9NYXRjaFBhdHRlcm4uUFJPVE9DT0xTXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gXCIqXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGdyb3VwcyA9IC8oLiopOlxcL1xcLyguKj8pKFxcLy4qKS8uZXhlYyhtYXRjaFBhdHRlcm4pO1xuICAgICAgaWYgKGdyb3VwcyA9PSBudWxsKVxuICAgICAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIFwiSW5jb3JyZWN0IGZvcm1hdFwiKTtcbiAgICAgIGNvbnN0IFtfLCBwcm90b2NvbCwgaG9zdG5hbWUsIHBhdGhuYW1lXSA9IGdyb3VwcztcbiAgICAgIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCk7XG4gICAgICB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpO1xuICAgICAgdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gcHJvdG9jb2wgPT09IFwiKlwiID8gW1wiaHR0cFwiLCBcImh0dHBzXCJdIDogW3Byb3RvY29sXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IGhvc3RuYW1lO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gcGF0aG5hbWU7XG4gICAgfVxuICB9XG4gIGluY2x1ZGVzKHVybCkge1xuICAgIGlmICh0aGlzLmlzQWxsVXJscylcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGNvbnN0IHUgPSB0eXBlb2YgdXJsID09PSBcInN0cmluZ1wiID8gbmV3IFVSTCh1cmwpIDogdXJsIGluc3RhbmNlb2YgTG9jYXRpb24gPyBuZXcgVVJMKHVybC5ocmVmKSA6IHVybDtcbiAgICByZXR1cm4gISF0aGlzLnByb3RvY29sTWF0Y2hlcy5maW5kKChwcm90b2NvbCkgPT4ge1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cHNcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwc01hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZpbGVcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGaWxlTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZnRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRnRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwidXJuXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzVXJuTWF0Y2godSk7XG4gICAgfSk7XG4gIH1cbiAgaXNIdHRwTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIdHRwc01hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0hvc3RQYXRoTWF0Y2godXJsKSB7XG4gICAgaWYgKCF0aGlzLmhvc3RuYW1lTWF0Y2ggfHwgIXRoaXMucGF0aG5hbWVNYXRjaClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBob3N0bmFtZU1hdGNoUmVnZXhzID0gW1xuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoKSxcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaC5yZXBsYWNlKC9eXFwqXFwuLywgXCJcIikpXG4gICAgXTtcbiAgICBjb25zdCBwYXRobmFtZU1hdGNoUmVnZXggPSB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLnBhdGhuYW1lTWF0Y2gpO1xuICAgIHJldHVybiAhIWhvc3RuYW1lTWF0Y2hSZWdleHMuZmluZCgocmVnZXgpID0+IHJlZ2V4LnRlc3QodXJsLmhvc3RuYW1lKSkgJiYgcGF0aG5hbWVNYXRjaFJlZ2V4LnRlc3QodXJsLnBhdGhuYW1lKTtcbiAgfVxuICBpc0ZpbGVNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZmlsZTovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNGdHBNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZnRwOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc1Vybk1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiB1cm46Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGNvbnZlcnRQYXR0ZXJuVG9SZWdleChwYXR0ZXJuKSB7XG4gICAgY29uc3QgZXNjYXBlZCA9IHRoaXMuZXNjYXBlRm9yUmVnZXgocGF0dGVybik7XG4gICAgY29uc3Qgc3RhcnNSZXBsYWNlZCA9IGVzY2FwZWQucmVwbGFjZSgvXFxcXFxcKi9nLCBcIi4qXCIpO1xuICAgIHJldHVybiBSZWdFeHAoYF4ke3N0YXJzUmVwbGFjZWR9JGApO1xuICB9XG4gIGVzY2FwZUZvclJlZ2V4KHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuICB9XG59O1xudmFyIE1hdGNoUGF0dGVybiA9IF9NYXRjaFBhdHRlcm47XG5NYXRjaFBhdHRlcm4uUFJPVE9DT0xTID0gW1wiaHR0cFwiLCBcImh0dHBzXCIsIFwiZmlsZVwiLCBcImZ0cFwiLCBcInVyblwiXTtcbnZhciBJbnZhbGlkTWF0Y2hQYXR0ZXJuID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybiwgcmVhc29uKSB7XG4gICAgc3VwZXIoYEludmFsaWQgbWF0Y2ggcGF0dGVybiBcIiR7bWF0Y2hQYXR0ZXJufVwiOiAke3JlYXNvbn1gKTtcbiAgfVxufTtcbmZ1bmN0aW9uIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCkge1xuICBpZiAoIU1hdGNoUGF0dGVybi5QUk9UT0NPTFMuaW5jbHVkZXMocHJvdG9jb2wpICYmIHByb3RvY29sICE9PSBcIipcIilcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGAke3Byb3RvY29sfSBub3QgYSB2YWxpZCBwcm90b2NvbCAoJHtNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmpvaW4oXCIsIFwiKX0pYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpIHtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiOlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIGBIb3N0bmFtZSBjYW5ub3QgaW5jbHVkZSBhIHBvcnRgKTtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiKlwiKSAmJiBob3N0bmFtZS5sZW5ndGggPiAxICYmICFob3N0bmFtZS5zdGFydHNXaXRoKFwiKi5cIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgSWYgdXNpbmcgYSB3aWxkY2FyZCAoKiksIGl0IG11c3QgZ28gYXQgdGhlIHN0YXJ0IG9mIHRoZSBob3N0bmFtZWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKSB7XG4gIHJldHVybjtcbn1cbmV4cG9ydCB7XG4gIEludmFsaWRNYXRjaFBhdHRlcm4sXG4gIE1hdGNoUGF0dGVyblxufTtcbiJdLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxLDIsNF0sIm1hcHBpbmdzIjoiOztDQUNBLFNBQVMsaUJBQWlCLEtBQUs7QUFDOUIsTUFBSSxPQUFPLFFBQVEsT0FBTyxRQUFRLFdBQVksUUFBTyxFQUFFLE1BQU0sS0FBSztBQUNsRSxTQUFPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0VhUixJQUFNLFVEZmlCLFdBQVcsU0FBUyxTQUFTLEtBQ2hELFdBQVcsVUFD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