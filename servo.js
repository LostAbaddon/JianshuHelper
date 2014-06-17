if (!localStorage.useBlacklist) {
	localStorage.useBlacklist = '1';
}
var use_blacklist = localStorage.useBlacklist === '0' ? false : true;
var blacklist = (localStorage.blacklist || '')
	.split(',')
	.map(function (item) {
		return item.trim();
	})
	.filter(function (item) {
		return item.length > 0;
	});
var filter = {
	urls: [
		"*://*.jianshu.io/*",
		"*://jianshu.io/*",
		"*://*.jianshu.io/*/*",
		"*://jianshu.io/*/*",
		"*://*.jianshu.io:*/*",
		"*://jianshu.io:*/*",
	]
};
var pageRequest = [
	/\/timeline\b/i,
	/\/bookmarks\b/i,
	/\/top\/((weekly)|(monthly))\b/i,
	/\/recommendations\/notes\b/i,
	/\/latest_articles\b/i,
	/\/top_articles\b/i,
	/\/notifications\b/i,
];

function saveList () {
	localStorage.blacklist = JSON.stringify(blacklist).replace(/^\[/, '').replace(/\]$/, '').replace(/"/gi, '');
}

function requestHandler (request) {
	var index, l, i;
	switch (request.action) {
		case "add_to_blacklist":
			index = request.id;
			l = index.length;
			for (i = 0; i < l; i++) {
				if (blacklist.indexOf(index[i]) >= 0) break;
				blacklist.push(index[i]);
			}
			saveList();
			return blacklist;
		break;
		case "read_blacklist":
			return blacklist;
		break;
		case "remove_from_blacklist":
			index = request.id;
			l = index.length;
			for (i = 0; i < l; i++) {
				index[i] = blacklist.indexOf(index[i]);
				if (index[i] < 0) break;
				blacklist.splice(index[i], 1);
			}
			saveList();
			return blacklist;
		break;
		case "reset_blacklist":
			blacklist = [];
			localStorage.blacklist = '';
			return true;
		break;
		case "is_user_blocked":
			return blacklist.indexOf(request.id) >= 0;
		break;
		case "log":
			console.log('log: ', request.msg);
			return true;
		break;
		case "use_blacklist":
			return use_blacklist;
		break;
		case "turn_on_blacklist":
			use_blacklist = true;
			localStorage.useBlacklist = '1';
			return use_blacklist;
		break;
		case "turn_off_blacklist":
			use_blacklist = false;
			localStorage.useBlacklist = '0';
			return use_blacklist;
		break;
	}
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	sendResponse({result: requestHandler(request)});
});

chrome.webRequest.onBeforeRequest.addListener(function (details) {
	var url = details.url;
	if (pageRequest.some(function (reg) {
		return reg.test(url);
	})) {
		chrome.tabs.sendMessage(details.tabId, {action: "content_request", url: url});
	}
}, filter);
chrome.webRequest.onCompleted.addListener(function (details) {
	var url = details.url;
	if (pageRequest.some(function (reg) {
		return reg.test(url);
	})) {
		chrome.tabs.sendMessage(details.tabId, {action: "content_loaded", url: url});
	}
	else if (/\/writer\/notes\/\w*\/content/i.test(url)) {
		chrome.tabs.sendMessage(details.tabId, {action: "writer_loaded"});
	}
}, filter);