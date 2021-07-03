window.EventEmitter = class EventEmitter {
	constructor () {
		this._events = new Map();
		this._onces = new Map();
	}
	on (event, callback) {
		var callbacks = this._events.get(event);
		if (!callbacks) {
			callbacks = new Set();
			this._events.set(event, callbacks);
		}
		callbacks.add(callback);
	}
	once (event, callback) {
		var callbacks = this._events.get(event);
		if (!callbacks) {
			callbacks = new Set();
			this._events.set(event, callbacks);
		}
		callbacks.add(callback);
		var onces = this._onces.get(event);
		if (!onces) {
			onces = new Set();
			this._onces.set(event, onces);
		}
		onces.add(callback);
	}
	off (event, callback) {
		var callbacks = this._events.get(event);
		if (!!callbacks) callbacks.delete(callback);
		var onces = this._onces.get(event);
		if (!!onces) onces.delete(callback);
	}
	clear (event) {
		var callbacks = this._events.get(event);
		if (!!callbacks) {
			callbacks.clear();
			this._events.delete(event);
		}
		var onces = this._onces.get(event);
		if (!onces) {
			onces.clear();
			this._onces.delete(event);
		}
	}
	clearAll () {
		for (let [_, callbacks] of this._events) {
			callbacks.clear();
		}
		this._events.clear();
		for (let [_, callbacks] of this._onces) {
			callbacks.clear();
		}
		this._onces.clear();
	}
	emit (event, ...data) {
		var callbacks = this._events.get(event);
		if (!callbacks) return;
		var onces = this._onces.get(event);
		for (let callback of callbacks) {
			let needBreak = callback(...data);
			if (!!onces && onces.has(callback)) {
				callbacks.delete(callback);
				onces.delete(callback);
			}
			if (!!needBreak && !(needBreak instanceof Promise)) break;
		}
	}
	async emitPipely (event, ...data) {
		var callbacks = this._events.get(event);
		if (!callbacks) return;
		var onces = this._onces.get(event);
		for (let callback of callbacks) {
			let needBreak = await callback(...data);
			if (!!onces && onces.has(callback)) {
				callbacks.delete(callback);
				onces.delete(callback);
			}
			if (!!needBreak) break;
		}
	}
}
window.PageBroadcast = new EventEmitter();

localStorage.__proto__.get = (key, def={}) => {
	var item = localStorage.getItem(key);
	if (!item) return def;
	try {
		item = JSON.parse(item);
	}
	catch (err) {
		return def;
	}
	return item;
};
localStorage.__proto__.set = (key, value) => {
	value = JSON.stringify(value);
	localStorage.setItem(key, value);
};

window.loadJS = (filepath) => new Promise(res => {
	var js = document.createElement('script');
	js.type = 'text/javascript';
	js.src = filepath;
	js.onload = res;
	js.onerror = res;
	document.body.appendChild(js);
});
window.loadCSS = (filepath) => new Promise(res => {
	var css = document.createElement('link');
	css.type = 'text/css';
	css.rel = 'stylesheet';
	css.href = filepath;
	css.onload = res;
	css.onerror = res;
	document.body.appendChild(css);
});

window.utf8tobase64 = str => window.btoa(window.unescape(window.encodeURIComponent(str)));
window.base64toutf8 = str => window.decodeURIComponent(window.escape(window.atob(str)));
window.base64tobuffer = str => {
	var dec = window.escape(window.atob(str)), len = dec.length, result = [];
	for (let i = 0; i < len; i ++) {
		let s = dec.substr(i, 1);
		if (s === '%') {
			s = dec.substr(i + 1, 2);
			try {
				s = parseInt(s, 16);
			}
			catch (err) {
				console.error("输入 base64 字符串格式错误：", err);
				return null;
			}
			result.push(s);
			i += 2;
		}
		else {
			result.push(s.charCodeAt(0));
		}
	}
	result = new Uint8Array(result);
	return result;
};

window.findContentWrapper = ele => {
	if (!ele) return ele;
	while (true) {
		let tag = (ele.nodeName || '').toLowerCase();
		if (['span', 'font', 'sup', 'sub', 'i', 'u', 'b', 'del', 'em', 'strong', 'code'].includes(tag)) ele = ele.parentElement;
		else return ele;
	}
};
window.onVueHyperLinkTriggered = (vue, evt) => {
	var ele = findContentWrapper(evt.target);
	if ((ele.nodeName || '').toLowerCase() !== 'a') return false;

	var path = ele.getAttribute('href');
	if (!path) return false;

	if (path.indexOf('#/') === 0) {
		path = path.replace(/^#+[\\\/]+/, '');
		path = path.split(/[\\\/]+/);
		path = { path: '/category', query: {c: path.join(',')} };
	}
	else if (path.indexOf('#') === 0) {
		path = path.replace(/^#+/, '');
		let target = document.querySelector('[name="' + path + '"]');
		if (!!target) {
			let app = document.body.querySelector('#app');
			if (!!app) {
				let offset = (target.offsetTop || 0) - app.scrollTop;
				if (!Devices.isMobile) offset -= 25; // 顶部 NavBar 高度
				app.scrollBy({top: offset, behavior: 'smooth'});
			}
		}
		evt.preventDefault();
		return true;
	}
	else if (path.indexOf('/page/#/') === 0) {
		path = path.replace(/^[\\\/]+page[\\\/]+#+[\\\/]+/, '/');
		path = { path };
	}
	else if (path.indexOf('/page/') === 0) {
		path = path.replace('/page/', '/');
		path = {path};
	}
	else if (path.indexOf('/article/') === 0) {
		path = path.replace('/article/', '');
		path = encodeURIComponent(path);
		path = {path: '/view', query: {f: path}};
	}
	else {
		return false;
	}

	evt.preventDefault();
	var originPath = location.hash.replace(/^#+/, '').split('?')[0];
	vue.$router.push(path);
	if (path.path === originPath) {
		PageBroadcast.emit('page-changed', path);
	}

	return true;
};

window.initMathJax = () => {
	if (initMathJax.initialized) return;
	initMathJax.initialized = true;
	MathJax.Hub.Config({
		extensions: ["tex2jax.js"],
		TeX: {
			extensions: ["AMSmath.js", "AMSsymbols.js"]
		},
		jax: ["input/TeX", "output/HTML-CSS"],
		tex2jax: {
			inlineMath: [["$","$"]],
			displayMath: [['$$', '$$']],
		},
		"HTML-CSS": {
			availableFonts: ["STIX","TeX"], //可选字体
			showMathMenu: false //关闭右击菜单显示
		}
	});
};
window.afterMarkUp = async (target, mathHook) => {
	if (!target) {
		target = document.body.querySelector('article.markup-content');
		if (!target) target = document.body.querySelector('#container');
	}
	// 初始化脚注尾注显示板
	InitNotes(document.body.querySelector('#container'));

	// MathHub的相关处理
	initMathJax();
	if (Function.is(mathHook)) {
		mathHook();
	}
	else {
		MathJax.Hub.Queue(["Typeset", MathJax.Hub, target]);
	}

	// 初始化动画图示
	initTableAnimationChart();

	// 初始化图片墙
	await ImageWall.init();
};

LifeCycle.on.ready(app => {
	console.log('Schwarzschild Blackhole System is READY!');

	app.config.globalProperties.afterMarkUp = window.afterMarkUp;
	const mutationObserver = new MutationObserver(async mutations => {
		var markups = document.querySelectorAll('.markup');
		await Promise.all([].map.call(markups, async mu => {
			var content = mu.innerText;
			content = content.replace(/^\t+|\t+$/g, '\n');
			content = await MarkUp.parse(content, {
				toc: mu.classList.contains('toc'),
				glossary: mu.classList.contains('glossary'),
				resources: mu.classList.contains('resources'),
				showtitle: mu.classList.contains('showtitle'),
				showauthor: false,
				classname: 'markup-content',
			});
			mu.innerHTML = content;
			mu.classList.remove('markup');
		}));
		if (markups.length > 0) await app.config.globalProperties.afterMarkUp();
	});
	mutationObserver.observe(document.body, {
		childList: true,
		subtree: true,
	});
	global.changeThemeColor = (color) => {
		if (!color) return;
		localStorage.setItem('themeColor', color);
		document.body.setAttribute('theme', color);
	};
	changeThemeColor(localStorage.getItem('themeColor'));
});
LifeCycle.on.initialized((app) => {
	console.log('Schwarzschild Blackhole System is INITIALIZED!');
});

var tmrDataUpdated = null;
const onDataUpdated = (msg) => {
	var url = msg.target;
	if (!!tmrDataUpdated) {
		clearTimeout(tmrDataUpdated);
	}
	tmrDataUpdated = setTimeout(() => {
		tmrDataUpdated = null;
		cbDataUpdated(url);
	}, 500);
};
const cbDataUpdated = (url) => {
	sessionStorage.setItem('sourceUpdated', url);
	location.reload();
};
if (!!window.BroadcastChannel) {
	let bcch = new BroadcastChannel('source-updated');
	bcch.onmessage = (msg) => {
		onDataUpdated(msg.data);
	};
}
else {
	PageBroadcast.on('source-updated', msg => {
		onDataUpdated(msg);
	});
}
PageBroadcast.on('source-updated-cancel-reload', () => {
	if (!!tmrDataUpdated) {
		clearTimeout(tmrDataUpdated);
		tmrDataUpdated = null;
	}
});