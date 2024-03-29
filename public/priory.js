const CacheName = 'schwarzschild';
const CacheUrl = [
	'/',
	'/index.html',
	'/404.png',
	'/favicon.ico',
	'/webapp.json',
];
var CacheAfterLoad = true;

const prepare = async () => {
	var keys = await caches.keys();
	if (keys.length > 0) {
		keys.forEach(async key => {
			var cacheStorage = await caches.open(key);
			var cacheKeys = await cacheStorage.keys();
			cacheKeys.forEach(req => {
				var url = req.url;
				if (!CacheUrl.includes(url)) CacheUrl.push(url);
			});
		});
	}
};
if (!CacheAfterLoad) prepare();

const cacheResource = async (req, res) => {
	var cache = await caches.open(CacheName);
	await cache.put(req, res);
};

self.addEventListener('install', evt => {
	console.log('[:>  SW Installed <:]');
	self.skipWaiting();

	evt.waitUntil(async () => {
		await caches.delete(CacheName);
		console.log('[:>  SW removed cache (' + CacheName + ') <:]');
		var cache = await caches.open(CacheName);
		await cache.addAll(CacheUrl);
	});
});
self.addEventListener('activate', async evt => {
	console.log('[:>  SW Activated <:]');

	await caches.delete(CacheName);
	console.log('[:>  SW removed cache (' + CacheName + ') <:]');
	var cache = await caches.open(CacheName);
	await cache.addAll(CacheUrl);

	// 通知线程管理者更新线程
	if (!!globalThis.BroadcastChannel) {
		let updater = new BroadcastChannel("updater");
		updater.postMessage(true);
	}
});
self.addEventListener('fetch', evt => {
	if (evt.request.method !== 'GET') return;

	// 只缓存本站资源
	// if (!evt.request.url.match(/^https?:\/\//i)) return;
	// if (evt.request.url.indexOf(self.location.origin) < 0) return;

	var fullpath = evt.request.url.replace(self.location.origin, '');
	fullpath = fullpath.split(/[\?\#]/)[0];
	var pathname = fullpath.split('/');
	var filename = pathname[pathname.length - 1];
	pathname.pop();
	pathname = pathname.join('/');
	pathname = pathname || '/';
	filetype = filename.match(/\.([^\\\/\?]+)(\?[^\\\/]+)?$/);
	if (!!filetype) filetype = filetype[1].toLowerCase();
	else filetype = '';

	if (!pathname.match(/^(\/|\\|https?|ftps?)/i)) return;
	if (filename.match(/hot-update\.js/i)) return;
	if (filename.match(/priory\.js/i)) return;
	if (['mp3', 'mp4', 'wav', 'avi', 'rm', 'rmvb', 'ogg', 'map'].includes(filetype)) return; // 大型媒体资源不缓存
	if (pathname.match(/^(ht|f)tps?/i)) { // 站外资源
		if (!filetype) return; // RESTful请求
		if (!['md', 'mu', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'ps', 'jpg', 'jpeg', 'gif', 'png', 'webp', 'ico'].includes(filetype)) return; // 只缓存特定类型的资源
	}
	else { // 本站资源
		if (['json', 'mu', 'md'].includes(filetype)) return; // MD、MU、JSON文档由indexedDB缓存
	}

	if (CacheAfterLoad) {
		// 获取后缓存
		caches.open(CacheName).then(cache => {
			cache.add(fullpath);
		});
	}
	else {
		if (!fullpath.match(/^\/*#\/+|^\/*#$/)) caches.open(CacheName).then(cache => cache.add(fullpath)); // 将适合的请求都缓存起来
		// 直接读取缓存
		if (!CacheUrl.includes(fullpath)) caches.open(CacheName).then(cache => {
			cache.add(fullpath);
			CacheUrl.push(fullpath);
		});
	}
	evt.respondWith(caches.match(evt.request).then(cache => {
		if (cache) {
			return cache;
		}

		// 如果没有缓存，则问后台要
		var remote = fetch(evt.request).then(res => {
			cacheResource(evt.request, res.clone()).then(() => {
				console.log('CacheUpaded: ' + evt.request.url);
			});
			return res;
		}).catch(e => {
			console.error('Fetch Failed: ' + evt.request.url);
			console.error(e);
		});

		return remote;
	}));
});