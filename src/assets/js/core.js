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

window.onVueHyperLinkTriggered = (vue, evt) => {
	var ele = evt.target;
	if (!ele || !ele.nodeName || ele.nodeName.toLowerCase() !== 'a') return false;

	var path = ele.getAttribute('href');
	if (!path) return false;

	if (path.match(/^#+[\/\\]+/) === 0) {
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
	const mutationObserver = new MutationObserver(mutations => {
		var markups = document.querySelectorAll('.markup');
		[].forEach.call(markups, (mu) => {
			var content = mu.innerText;
			content = content.replace(/^\t+|\t+$/g, '\n');
			content = MarkUp.parse(content, {
				toc: mu.classList.contains('toc'),
				glossary: mu.classList.contains('glossary'),
				resources: mu.classList.contains('resources'),
				showtitle: mu.classList.contains('showtitle'),
				showauthor: false,
				classname: 'markup-content',
			});
			mu.innerHTML = content;
			mu.classList.remove('markup');
		});
		if (markups.length > 0) app.config.globalProperties.afterMarkUp();
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