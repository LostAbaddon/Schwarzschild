localStorage.__proto__.get = (key, def={}) => {
	var item = localStorage.getItem(key);
	if (!item) return def;
	try {
		item = JSON.parse(item);
	}
	catch {
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
		let channel = new BroadcastChannel('page-changed');
		channel.postMessage(path);
	}

	return true;
};

LifeCycle.on.ready(app => {
	console.log('Schwarzschild Blackhole System is READY!');

	var FootNoteUnInited = true;
	app.config.globalProperties.afterMarkUp = async () => {
		InitNotes(document.body.querySelector('#container'));
		if (FootNoteUnInited) {
			FootNoteUnInited = false;
			MathJax.Hub.Config({
				extensions: ["tex2jax.js"],
				TeX: {
					extensions: ["AMSmath.js", "AMSsymbols.js"]
				},
				jax: ["input/TeX", "output/HTML-CSS"],
				tex2jax: {
					inlineMath: [["$","$"]]}
				}
			);
			MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
		}
		else {
			MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
		}
		await ImageWall.init();
	};
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
const cbDataUpdated = data => {
	sessionStorage.setItem('sourceUpdated', data.target);
	location.reload();
};
(new BroadcastChannel('source-updated')).addEventListener('message', ({data}) => {
	if (!!tmrDataUpdated) {
		clearTimeout(tmrDataUpdated);
	}
	tmrDataUpdated = setTimeout(() => {
		tmrDataUpdated = null;
		cbDataUpdated(data);
	}, 100);
});