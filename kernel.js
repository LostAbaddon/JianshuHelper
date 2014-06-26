var blacklist = [];
var use_blacklist = localStorage.__Extension_Enable_BlackList === '0' ? false : true;
var cancel_block = false, menu_shown = false;
var block_controller = {
	setBlockNumber: function () {},
	setBlockToggle: function (enable) {
		use_blacklist = enable;
		localStorage.__Extension_Enable_BlackList = use_blacklist ? '1' : '0';
	}
};
var user_name_cacher = {};

function init_frame_titme (main) {
	var ui = newUI('div', 'cover');
	ui.innerHTML = "页面处理中，请稍候。。。";

	return ui;
}
function init_frame_main (main) {
	var ui = newUI('div', 'menu'), element, elem, button;
	var area_block;
	var block_title, btn_reset, btn_toggle;

	element = newUI('div', 'title');
	element.innerHTML = '简书助手';
	ui.appendChild(element);

	element = newUI('div', 'left_frame');
	ui.appendChild(element);

	button = newUI('div', 'button');
	button.innerHTML = '屏蔽用户';
	element.appendChild(button);

	button = newUI('div', 'button');
	button.innerHTML = '其它';
	element.appendChild(button);

	element = newUI('div', 'right_frame');
	ui.appendChild(element);

	area_block = newUI('div', 'area');
	element.appendChild(area_block);

	elem = newUI('div', 'title');
	area_block.appendChild(elem);

	block_title = newUI('span', 'title_title');
	block_title.innerHTML = '当前屏蔽人数：';
	elem.appendChild(block_title);

	btn_reset = newUI('span', 'inline_button');
	btn_reset.innerHTML = '重置';
	elem.appendChild(btn_reset);

	btn_toggle = newUI('span', 'inline_button');
	btn_toggle.innerHTML = use_blacklist ? '禁用' : '启用';
	elem.appendChild(btn_toggle);

	elem = newUI('div', 'list_area');
	area_block.appendChild(elem)

	blacklist.map(function (item) {
		var item_dom = newUI('div', 'list_item');
		var item_id = newUI('span', ['list_col', 'id']),
			item_name = newUI('span', ['list_col', 'name']),
			item_jump = newUI('span', ['list_col', 'inline_button']),
			item_unblock = newUI('span', ['list_col', 'inline_button']);
		item_dom.appendChild(item_id);
		item_dom.appendChild(item_name);
		item_dom.appendChild(item_jump);
		item_dom.appendChild(item_unblock);
		elem.appendChild(item_dom);

		item_id.innerHTML = item;
		item_jump.innerHTML = '查看主页';
		item_unblock.innerHTML = '解除屏蔽';

		user_name_cacher[item] = function (name) {
			item_name.innerHTML = name;
		};
		chrome.runtime.sendMessage({action: 'get_user_name', user: item}, function (response) {
			if (response.result === true) user_name_cacher[item](response.user_name);
		});
	});

	block_controller.setBlockNumber = function (num) {
		block_title.innerHTML = '当前屏蔽人数：' + num;
	};
	block_controller.setBlockToggle = function (enable) {
		use_blacklist = enable;
		localStorage.__Extension_Enable_BlackList = use_blacklist ? '1' : '0';
		btn_toggle.innerHTML = enable ? '禁用' : '启用';
	};

	addEvent(btn_toggle, 'click', function (e) {
		if (use_blacklist) {
			chrome.runtime.sendMessage({action: 'turn_off_blacklist'}, function (response) {
				block_controller.setBlockToggle(false);
			});
		}
		else {
			chrome.runtime.sendMessage({action: 'turn_on_blacklist'}, function (response) {
				block_controller.setBlockToggle(true);
			});
		}
	});

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
	block_controller.setBlockToggle(!!response ? response.result : (localStorage.__Extension_Enable_BlackList === '1' ? true : false));
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
		menu_shown = !menu_shown;
		if (menu_shown) {
			setCover('main');
			showCover(0.5);
		}
		else {
			hideCover();
		}
		block_controller.setBlockToggle(request.info.blacklist_enable);
		block_controller.setBlockNumber(request.info.blacklist_number);
	}
	else if (request.action === 'user_name_got') {
		var callback = user_name_cacher[request.result.user_id];
		!!callback && (request.result.result === true) && callback(request.result.user_name);
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