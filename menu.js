var send = function (msg) {
	chrome.runtime.sendMessage({action: 'log', msg: msg});
};
var log = function () {};
var title = function () {};

function query (selector, all) {
	if (!!all) return document.querySelectorAll(selector);
	else return document.querySelector(selector);
}
function addEvent (dom, event, handler) {
	dom.addEventListener(event, handler);
}

function init_blacklist (url, enable) {
	var user_name, state = 0,

		btn_add = query('.button.add'),
		btn_remove = query('.button.remove'),
		btn_show = query('.button.show'),
		btn_reset = query('.button.reset'),
		btn_toggle = query('.button.toggle'),

		btn_usr_submit = query('.username button.submit'),
		ipt_usr_name = query('.username input'),
		btn_list_back = query('.showall button.back'),

		pad_main = query('.main'),
		pad_add = query('.username'),
		pad_list = query('.showall');

	btn_toggle.innerHTML = enable ? '停止屏蔽' : '启动屏蔽';

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
	addEvent(btn_list_back, 'click', function () {
		title('请选择：');
		pad_list.style.opacity = '0';
		pad_main.style.opacity = '1';
		setTimeout(function () {
			pad_main.style.pointerEvents = 'auto';
			pad_list.style.display = 'none';
			!!callback && callback();
		}, 200);
	})

	if (/jianshu\.io\/users\//i.test(url)) {
		btn_add.innerHTML = '屏蔽当前用户';
		user_name = url.match(/\bjianshu\.io\/users\/\w*\b/i)[0].replace(/\bjianshu\.io\/users\//i,'');
		addEvent(btn_add, 'click', function () {
			chrome.runtime.sendMessage({action: 'add_to_blacklist', id:[user_name]}, function (response) {
				log('添加用户' + user_name + '至屏蔽列表成功。<BR>屏蔽总人数：' + response.result.length);
			});
		});
	}
	else {
		addEvent(btn_add, 'click', function () {
			state = 0;
			showUserPad('请输入欲屏蔽用户ID：', '屏蔽之');
		});
	}

	addEvent(btn_remove, 'click', function () {
		state = 1;
		showUserPad('欲解除屏蔽用户ID：', '解除屏蔽');
	});
	addEvent(btn_show, 'click', function () {
		var frame = query('.showall'), items = query('.showall .item', true), l = items.length, i;
		for (i = 0; i < l; i++) {
			frame.removeChild(items[i]);
		}

		title('屏蔽用户列表：');
		pad_list.style.display = 'block';
		setTimeout(function () {
			pad_main.style.opacity = '0';
			pad_main.style.pointerEvents = 'none';
			pad_list.style.opacity = '1';
		}, 0);

		chrome.runtime.sendMessage({action: 'read_blacklist'}, function(response) {
			var list = response.result;
			l = list.length;
			for (i = 0; i < l; i++) {
				items = document.createElement('div');
				items.className = 'item';
				items.innerHTML = list[i];
				addEvent(items, 'click', function () {
					var name = this.innerHTML.trim(), self = this;
					chrome.runtime.sendMessage({action: 'remove_from_blacklist', id:[name]}, function (response) {
						log('成功将用户' + name + '从屏蔽列表移除。<BR>屏蔽总人数：' + response.result.length);
						frame.removeChild(self);
					});
				});
				frame.appendChild(items);
			}
		});
	});
	addEvent(btn_reset, 'click', function () {
		chrome.runtime.sendMessage({action: 'reset_blacklist'}, function () {
			log('屏蔽列表已清空！');
		});
	});
	addEvent(btn_toggle, 'click', function () {
		enable = !enable;
		if (enable) {
			chrome.runtime.sendMessage({action: 'turn_on_blacklist'}, function (response) {
				btn_toggle.innerHTML = '停止屏蔽';
			});
		}
		else {
			chrome.runtime.sendMessage({action: 'turn_off_blacklist'}, function (response) {
				btn_toggle.innerHTML = '启用屏蔽';
			});
		}
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

		init_blacklist(url, localStorage.useBlacklist === '1' ? true : false);

		log('正太已准备就绪！<BR>屏蔽总人数：' + (!localStorage.blacklist ? 0 : localStorage.blacklist.split(',').length));
	});
});
