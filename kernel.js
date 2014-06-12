var blacklist = [];
var use_blacklist = localStorage.__Extension_Enable_BlackList === '0' ? false : true;

var hideCover = function () {};
var showCover = function () {};
var addCover = function () {
	var body = document.querySelector('body');
	var cover = document.createElement('div');
	cover.style.position = 'fixed';
	cover.style.display = 'block';
	cover.style.width = '100%';
	cover.style.height = '100%';
	cover.style.lineHeight = '500px';
	cover.style.top = '0px';
	cover.style.left = '0px';
	cover.style.zIndex = '2000';
	cover.style.background = 'white';
	cover.style.opacity = '1';
	cover.style.transition = 'opacity ease 500ms';
	cover.style.textAlign = 'center';
	cover.style.fontSize = '60px';
	cover.style.fontWeight = 'bolder';
	cover.innerHTML = "页面处理中，请稍候。。。";
	body.appendChild(cover);

	showCover = function () {
		body.appendChild(cover);
		setTimeout(function () {
			cover.style.opacity = '1';
		}, 0);
	};
	hideCover = function () {
		cover.style.opacity = '0';
		setTimeout(function () {
			body.removeChild(cover);
		}, 500);
	};
};

var pickupLinks = function (word) {
	var links = document.querySelectorAll('a'), link, href, result = [], l = links.length, i;
	var reg = new RegExp('jianshu\.io\/users\/' + word, 'i');
	for (i = 0; i < l; i++) {
		link = links[i];
		href = link.href;
		if (!href) continue;
		if (!reg.test(href)) continue;
		result.push(link);
	}
	return result;
};

var findRoot = function (link) {
	var parent = link.parentNode, level = 0;
	while (level < 10) {
		if (parent.tagName === 'LI') {
			return parent;
		}
		if (parent.classList.contains('note-comment')) {
			return parent;
		}
		if (parent.tagName === 'BODY') {
			return null;
		}
		parent = parent.parentNode;
		level ++;
	}
	return null;
};

var page = 'home';
(function init () {
	var path = window.location.pathname;
	var url_notification = /^\/notifications/i,
		url_home = /^\/$/i,
		url_timeline = /^\/timeline$/i,
		url_latest = /^\/timeline\/latest/i,
		url_bookmark = /^\/bookmarks/i,
		url_article = /^\/p\//i,
		url_write = /^\/writer/i;

	if (url_notification.test(path)) page = 'notification';
	else if (url_home.test(path)) page = 'home';
	else if (url_timeline.test(path)) page = 'timeline';
	else if (url_latest.test(path)) page = 'latest';
	else if (url_bookmark.test(path)) page = 'bookmarks';
	else if (url_article.test(path)) page = 'article';
	else if (url_write.test(path)) page = 'write';
}) ();

function applySingleBlackWord (word) {
	var links = pickupLinks(word), l = links.length, i, root;
	for (i = 0; i < l; i++) {
		root = findRoot(links[i]);
		if (!root || !root.parentNode) continue;
		root.parentNode.removeChild(root);
	}
}

function applyBlackList () {
	blacklist.map(function (word) {
		applySingleBlackWord(word);
	});
}

function setUploader () {
	var uploaders = document.querySelectorAll('input[type="file"]'), l = uploaders.length, i;
	for (i = 0; i < l; i++) {
		uploaders[i].accept = 'image/*';
	}
}

chrome.runtime.sendMessage({action: 'use_blacklist'}, function (response) {
	use_blacklist = !!response ? response.result : (localStorage.__Extension_Enable_BlackList === '1' ? true : false);
	localStorage.__Extension_Enable_BlackList = use_blacklist ? '1' : '0';
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.action === 'content_request') {
		showCover();
	}
	else if (request.action === 'content_loaded') {
		applyBlackList();
		hideCover();
	}
	else if (request.action === 'writer_loaded') {
		setUploader();
	}
});

document.addEventListener('DOMContentLoaded', function () {
	if (page === 'write') {
		setUploader();
		return;
	}

	if (!use_blacklist) return;

	addCover();

	chrome.runtime.sendMessage({action: 'read_blacklist'}, function(response) {
		blacklist = response.result;
		applyBlackList();
		hideCover();
	});
});
