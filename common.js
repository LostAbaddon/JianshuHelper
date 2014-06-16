function query (selector, all) {
	if (!!all) return document.querySelectorAll(selector);
	else return document.querySelector(selector);
}
function addEvent (dom, event, handler) {
	dom.addEventListener(event, handler);
}
var newUI = function (tag, classes, style) {
	var ui = document.createElement(tag);

	if (!classes) return ui;

	if (!!classes) {
		if (typeof classes === 'string') ui.className = classes;
		else if (!!classes.length) classes.map(function (name) {ui.classList.add(name)});
		else {
			for (var key in classes) {
				ui.style[key] = classes[key];
			}
		}
	}

	if (!!style) {
		for (var key in style) {
			ui.style[key] = style[key];
		}
	}

	return ui;
}