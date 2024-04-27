// ==UserScript==
// @name         Link Sanitizer
// @description  Clean up unnecessary hyperlink redirections and link shims
// @version      1.1.10
// @author       cloux <cloux@rote.ch>
// @license      WTFPL 2.0; http://www.wtfpl.net/about/
// @namespace    https://github.com/cloux
// @homepage     https://github.com/cloux/LinkSanitizer
// @supportURL   https://github.com/cloux/LinkSanitizer
// @updateURL    https://raw.githubusercontent.com/cloux/LinkSanitizer/master/linksanitizer.user.js 
// @icon         http://icons.iconarchive.com/icons/designbolts/seo/128/Natural-Link-icon.png
// @include      *
// @run-at       document-start
// ==/UserScript==

(function() {
	// Limit contentType to "text/plain" or "text/html"
	if (document.contentType && document.contentType !== "text/plain" && document.contentType !== "text/html") {
		console.log("Hyperlink Sanitizer - Not loading for content type " + document.contentType);
		return;
	}

	// Sanitize single link
	function sanitize(weblink) {
		// Skip non-http links      
		if (!/^http/.test(weblink)) {
			return weblink;
		}

		// Whitelisted services
		const whitelistedServices = [
			/google\.[a-z]*\/(ServiceLogin|Logout|AccountChooser)/,
			/^https:\/\/translate\.google\./,
			/^http.*(login|registration)[./?].*http/,
			/\/oauth\?/,
			/\/signin[/?]/,
			/^https?:\/\/downloads\.sourceforge\.net\//,
			/^https?:\/\/(www\.)?facebook\.com\/sharer/,
			/^https?:\/\/(www\.)?linkedin\.com\/share/,
			/^https?:\/\/(www\.)?twitter\.com\/(intent\/tweet|share)/,
			/^https?:\/\/(www\.)?pinterest\.com\/pin\/create\//,
			/^https?:\/\/(www\.)?getpocket\.com\/save/,
			/^https?:\/\/[a-z.]*archive\.org\//,
			/^https?:\/\/github\.com\//,
			/^https:\/\/id\.atlassian\.com\//
		];

		if (whitelistedServices.some(regex => regex.test(weblink))) {
			return weblink;
		}

		console.log("Hyperlink: " + weblink);
		var strnew = weblink.replace(/^..*(https?(%3A|:)[^\\()&]*).*/, '$1');
		strnew = strnew.replace(/%23/g, '#')
			.replace(/%26/g, '&')
			.replace(/%2F/g, '/')
			.replace(/%3A/g, ':')
			.replace(/%3D/g, '=')
			.replace(/%3F/g, '?')
			.replace(/%25/g, '%'); // NOTE: %25 must be translated last

		console.log("SANITIZED: " + strnew);
		return strnew;
	}

	// MutationObserver callback
	function callback(mutationsList) {
		for (var mutation of mutationsList) {
			switch(mutation.type) {
				case "attributes":
					if (/..https?(%3A|:)/.test(mutation.target.href)) {
						var sanitizedLink = sanitize(mutation.target.href);
						if (mutation.target.href !== sanitizedLink) {
							mutation.target.href = sanitizedLink;
						}
					}
					break;
				case "childList":
					for (var node of mutation.addedNodes) {
						if (node.href && /..https?(%3A|:)/.test(node.href)) {
							node.href = sanitize(node.href);
						}
					}
					break;
			}
		}
	}

	// Create an observer instance linked to the callback function
	const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
	var observer = new MutationObserver(callback);
	// Start observing added elements and changes of href attributes
	observer.observe(window.document.documentElement, { attributeFilter: [ "href" ], childList: true, subtree: true });
})();
