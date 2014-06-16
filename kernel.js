var blacklist = [];
var use_blacklist = localStorage.__Extension_Enable_BlackList === '0' ? false : true;
var cancel_block = false;

function init_frame_titme (main) {
	var ui = newUI('div', 'cover');
	ui.innerHTML = "页面处理中，请稍候。。。";

	return ui;
}
function init_frame_main (main) {
	var ui = newUI('div', 'menu');

	var element = newUI('div', 'title');
	element.innerHTML = '简书助手';
	ui.appendChild(element);

	element = newUI('div', 'left_frame');
	element.innerHTML = 'Menu List';
	ui.appendChild(element);

	element = newUI('div', 'right_frame');
	element.innerHTML = 'Sub Menu Area<BR>sldkfjsldkf<BR>sdkfjsldkfj<DIV>skkksksks</DIV>';
	ui.appendChild(element);

	return ui;
}

var init_frame = {
	title: init_frame_titme,
	main: init_frame_main
};
var frames = {
	title: true,
	main: true
};

var hideCover = function () {};
var showCover = function () {};
var setCover = function () {};
var addCover = function () {
	var body = document.querySelector('body');
	var cover = newUI('div', 'inject_jsx_cover', {'height' : window.innerHeight + 'px'});
	body.appendChild(cover);

	frames.title = init_frame.title(cover);
	cover.appendChild(frames.title);

	var last_cover = frames.title;
	setCover = function (order) {
		var frame = frames[order];
		if (frame === true) {
			frame = init_frame[order](cover);
			frames[order] = frame;
		}
		if (!!frame) {
			cover.appendChild(frame)
			last_cover = frame;
		}
		else {
			last_cover = null;
		}
	};

	showCover = function (opacity) {
		cover.style.height = window.innerHeight + 'px';
		cover.style.background = "-webkit-linear-gradient(top, " +
									"rgba(200, 200, 200, " + opacity + ") 0%, " +
									"rgba(245, 245, 245, " + opacity + ") 20%, " +
									"rgba(245, 245, 245, " + opacity + ") 80%, " +
									"rgba(200, 200, 200, " + opacity + ") 100%)";
		body.appendChild(cover);
		setTimeout(function () {
			cover.style.opacity = 1;
		}, 0);
	};
	hideCover = function () {
		cover.style.opacity = '0';
		setTimeout(function () {
			!!last_cover && cover.removeChild(last_cover);
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

chrome.runtime.sendMessage({action: 'use_blacklist'}, function (response) {
	use_blacklist = !!response ? response.result : (localStorage.__Extension_Enable_BlackList === '1' ? true : false);
	localStorage.__Extension_Enable_BlackList = use_blacklist ? '1' : '0';
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.action === 'content_request') {
		if (cancel_block) return;

		var url_from = window.location.href.indexOf('?'), url_to = request.url.indexOf('?');

		if (url_from === url_to) {
			setCover('title');
			showCover(1);
		}
		else {
			url_from = url_from === -1 ? window.location.href : window.location.href.substring(0, url_from);
			url_to = url_to === -1 ? request.url : request.url.substring(0, url_to);
			setCover('title');
			showCover(url_from === url_to ? 0.8 : 1);
		}
	}
	else if (request.action === 'content_loaded') {
		if (cancel_block) return;
		applyBlackList();
		hideCover();
	}
	else if (request.action === 'redirection') {
		window.location.href = request.url;
	}
	else if (request.action === 'show_menu') {
		console.log(request.info);
		setCover('main');
		showCover(0.5);
	}
});

document.addEventListener('DOMContentLoaded', function () {
	if (page === 'write') {
		return;
	}

	if (!use_blacklist) return;

	cancel_block = true;
	addCover();

	chrome.runtime.sendMessage({action: 'read_blacklist'}, function(response) {
		blacklist = response.result;
		applyBlackList();
		hideCover();
		setTimeout(function () {
			cancel_block = false;
		}, 500);
	});
});