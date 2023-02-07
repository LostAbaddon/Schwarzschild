((root, ua, nav) => {
	// 运行环境检测
	root.Devices = {};

	Devices.isAndroid = !!ua.match(/Android/i);
	Devices.isiPhone = !!ua.match(/iPhone/i);
	Devices.isiPad = !!ua.match(/iPad/i);
	Devices.isiPod = !!ua.match(/iPod/i);
	Devices.isiOS = Devices.isiPhone || Devices.isiPad || Devices.isiPod;
	Devices.isBlackBerry = !!ua.match(/BlackBerry/i);
	Devices.isIE = nav.pointerEnabled || nav.msPointerEnabled;
	Devices.isSafari = !!ua.match(/safari/i) && !ua.match(/chrome/i);
	Devices.isOpera = !!ua.match(/Opera/i) && !ua.match(/Opera Mini/i);
	Devices.isOperaMini = !!ua.match(/Opera Mini/i);
	Devices.isWinPhone = !!ua.match(/IEMobile/i) || !!ua.match(/WPDesktop/i);
	Devices.isWebOS = !!ua.match(/webOS/i);
	Devices.isUiWebView = !!ua.match(/AppleWebKit/i);
	Devices.isMobile = Devices.isAndroid || Devices.isiOS || Devices.isBlackBerry || Devices.isWinPhone || Devices.isWebOS;

	// LifeCycle
	const Callbacks = new Map();
	Callbacks.set('loaded', []);
	Callbacks.set('ready', []);
	Callbacks.set('initialized', []);

	root.LifeCycle = {
		on: {
			loaded (cb, newLoop = false) {
				var cbs = Callbacks.get('loaded');
				cbs.push(cb);
			},
			ready (cb, newLoop = false) {
				var cbs = Callbacks.get('ready');
				cbs.push(cb);
			},
			initialized (cb, newLoop = false) {
				var cbs = Callbacks.get('initialized');
				cbs.push(cb);
			}
		},
		emit: {
			async loaded () {
				var cbs = Callbacks.get('loaded');
				if (!cbs || cbs.size === 0) return true;
				var results = await Promise.all(cbs.map(async cb => await cb()));
				return !results.some(r => !!r);
			},
			async ready (app) {
				var cbs = Callbacks.get('ready');
				if (!cbs || cbs.size === 0) return true;
				var results = await Promise.all(cbs.map(async cb => await cb(app)));
				return !results.some(r => !!r);
			},
			async initialized (app) {
				var cbs = Callbacks.get('initialized');
				if (!cbs || cbs.size === 0) return true;
				var results = await Promise.all(cbs.map(async cb => await cb(app)));
				return !results.some(r => !!r);
			}
		}
	};

	// UI 辅助工具
	root.newEle = (tag, ...classList) => {
		var div = document.createElement(tag || 'div');
		classList = classList.flat(Infinity);
		classList = classList.filter(i => !!i);
		classList = classList.map(i => i.split(/[ 　\t]+/));
		classList = classList.flat(Infinity);
		classList = classList.filter(i => !!i);
		classList.forEach(c => div.classList.add(c));
		return div;
	};
}) (window, window.navigator.userAgent, window.navigator);