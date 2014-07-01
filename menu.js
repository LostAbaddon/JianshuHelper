var blacklist = [];
var send = function (msg) {
	chrome.runtime.sendMessage({action: 'log', msg: msg});
};
var log = function () {};
var title = function () {};

function init_blacklist (url, tab, enable, total) {
	var user_name, state = 0, blacked = false,

		btn_block = query('.button.block'),
		btn_menu = query('.button.menu'),

		btn_usr_submit = query('.username button.submit'),
		ipt_usr_name = query('.username input'),

		pad_main = query('.main'),
		pad_add = query('.username');

	function showUserPad (name, hint) {
		title(name);
		btn_usr_submit.innerHTML = hint;
		pad_add.style.display = 'block';
		setTimeout(function () {
			pad_main.style.opacity = '0';
			pad_main.style.pointerEvents = 'none';
			pad_add.style.opacity = '1';
		}, 0);
	}
	function hideUserPad (callback) {
		title('请选择：');
		pad_add.style.opacity = '0';
		pad_main.style.opacity = '1';
		setTimeout(function () {
			pad_main.style.pointerEvents = 'auto';
			pad_add.style.display = 'none';
			!!callback && callback();
		}, 200);
	}
	function newListItem (item, id) {
		var btn_name = newUI('span'), btn_link = newUI('span'), btn_unlock = newUI('span');

		btn_name.className = 'name';
		btn_link.className = 'link';
		btn_unlock.className = 'link';

		btn_name.innerHTML = id;
		btn_link.innerHTML = '主页';
		btn_unlock.innerHTML = '解除';

		item.appendChild(btn_name);
		item.appendChild(btn_link);
		item.appendChild(btn_unlock);

		addEvent(btn_link, 'click', function () {
			chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {action: "redirection", url: 'http://jianshu.io/users/' + id});
			});
		});
		addEvent(btn_unlock, 'click', function () {
			chrome.runtime.sendMessage({action: 'remove_from_blacklist', id:[id]}, function (response) {
				log('成功将用户' + id + '从屏蔽列表移除。<BR>屏蔽总人数：' + response.result.length);
				frame.removeChild(item);
			});
		});
	}

	addEvent(btn_usr_submit, 'click', function () {
		if (state === 0) {
			user_name = ipt_usr_name.value;
			if (user_name.trim() === '') {
				hideUserPad();
			}
			else {
				chrome.runtime.sendMessage({action: 'add_to_blacklist', id:[user_name]}, function (response) {
					log('添加用户' + user_name + '至屏蔽列表成功。<BR>屏蔽总人数：' + response.result.length);
					hideUserPad(function () {ipt_usr_name.value = '';});
				});
			}
		}
		else if (state === 1) {
			user_name = ipt_usr_name.value;
			if (user_name.trim() === '') {
				hideUserPad();
			}
			else {
				chrome.runtime.sendMessage({action: 'remove_from_blacklist', id:[user_name]}, function (response) {
					log('成功将用户' + user_name + '从屏蔽列表移除。<BR>屏蔽总人数：' + response.result.length);
					hideUserPad(function () {ipt_usr_name.value = '';});
				});
			}
		}
	});

	if (/jianshu\.io\/users\//i.test(url)) {
		user_name = url.match(/\bjianshu\.io\/users\/\w*\b/i)[0].replace(/\bjianshu\.io\/users\//i,'');
		blacked = blacklist.indexOf(user_name) >= 0;
		if (blacked) {
			btn_block.innerHTML = '解除当前用户屏蔽';
			addEvent(btn_block, 'click', function () {
				chrome.runtime.sendMessage({action: 'remove_from_blacklist', id:[user_name]}, function (response) {
					log('成功将用户' + user_name + '从屏蔽列表移除。<BR>屏蔽总人数：' + response.result.length);
				});
			});
		}
		else {
			btn_block.innerHTML = '屏蔽当前用户';
			addEvent(btn_block, 'click', function () {
				chrome.runtime.sendMessage({action: 'add_to_blacklist', id:[user_name]}, function (response) {
					log('添加用户' + user_name + '至屏蔽列表成功。<BR>屏蔽总人数：' + response.result.length);
				});
			});
		}
	}
	else {
		addEvent(btn_block, 'click', function () {
			state = 0;
			showUserPad('请输入欲屏蔽用户ID：', '屏蔽之');
		});
	}

	addEvent(btn_menu, 'click', function () {
		chrome.tabs.sendMessage(tab.id, {action: "show_menu", info : {
			blacklist_enable: enable,
			blacklist_number: total
		}});
		window.close();
	});
}

document.addEventListener('DOMContentLoaded', function () {
	chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
		var url = tabs[0].url;
		if (!(/((\/jianshu)|(^jianshu))((\.io\/)|(\.io$))/i.test(url))) {
			window.close();
			return;
		}

		var log_pad = query('.logpad');
		log = function (msg) {
			log_pad.innerHTML = msg;
		};

		var title_panel = query('.title');
		title = function (msg) {
			title_panel.innerHTML = msg;
		};

		blacklist = !localStorage.blacklist ? [] : localStorage.blacklist.split(',');
		init_blacklist(url, tabs[0], localStorage.useBlacklist === '1' ? true : false, blacklist.length);

		log('正太已准备就绪！<BR>屏蔽总人数：' + blacklist.length);
	});
});