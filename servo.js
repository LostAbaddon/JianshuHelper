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

function getUserName (user, callback) {
	var xhr = new XMLHttpRequest(), dom = document.createElement('div');
	xhr.open('GET', 'http://jianshu.io/users/' + user + '/author_card', true);
	xhr.overrideMimeType('text/plain; charset=utf-8');
	xhr.onload = function (e) {
		if (this.status === 200) {
			dom.innerHTML = this.response;
			var name = dom.querySelector('div.header>span>a').innerHTML;
			dom.innerHTML = '';
			dom = null;
			xhr = null;
			callback(name);
		}
	};
	xhr.send();
}
function getUserNameCache (user, callback) {
	localStorage.removeItem('__user__' + user);
	var name = localStorage['__user__' + user];
	console.log('GUNC', user, name);
	if (!!name) {
		callback(name);
		if (!sessionStorage['__user__' + user]) {
			getUserName(user, function (new_name) {
				if (new_name === name) return;
				localStorage['__user__' + user] = new_name;
				sessionStorage['__user__' + user] = true;
				callback(new_name);
			});
		}
	}
	else {
		getUserName(user, function (name) {
			localStorage['__user__' + user] = name;
			sessionStorage['__user__' + user] = true;
			callback(name);
		});
	}
}
function removeUserNameCache (user) {
	localStorage.removeItem('__user__' + user);
}
function clearUserNameCache () {
	var key;
	for (key in localStorage) {
		if (key.indexOf('__user__') === 0) {
			localStorage.removeItem(key);
		}
	}
}

function requestHandler (request, sender) {
	var index, l, i, j;
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
				j = blacklist.indexOf(index[i]);
				if (j < 0) break;
				blacklist.splice(j, 1);
				removeUserNameCache(index[i]);
			}
			saveList();
			return blacklist;
		break;
		case "reset_blacklist":
			blacklist = [];
			localStorage.blacklist = '';
			clearUserNameCache();
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
		case "get_user_name":
			getUserNameCache(request.user, function (name) {
				var result = {
					result: true,
					user_id: request.user,
					user_name: name
				};
				chrome.tabs.sendMessage(sender.tab.id, {action: "user_name_got", result: result})
			});
			return false;
		break;
	}
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	sendResponse({result: requestHandler(request, sender)});
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