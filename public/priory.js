const CacheName = 'schwarzschild';
const CacheUrl = [
	'/',
	'/index.html',
	'/404.png',
	'/favicon.ico',
	'/webapp.json',
];

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
// prepare();

const cacheResource = async (req, res) => {
	var cache = await caches.open(CacheName);
	await cache.put(req, res);
};

self.addEventListener('install', evt => {
	console.log('[:>  SW Installed <:]');
	evt.waitUntil(async () => {
		await caches.delete(CacheName);
		var cache = await caches.open(CacheName);
		await cache.addAll(CacheUrl);
	});
});
self.addEventListener('fetch', evt => {
	if (evt.request.method !== 'GET') return;
	if (!evt.request.url.match(/^https?:\/\//i)) return;
	if (evt.request.url.indexOf(self.location.origin) < 0) return;
	var fullpath = evt.request.url.replace(self.location.origin, '');
	var pathname = fullpath.split('/');
	var filename = pathname[pathname.length - 1];
	pathname.pop();
	pathname = pathname.join('/');
	if (filename === 'priory.js') return;
	if (filename.match(/(mp3|mp4|wav|avi|rm|rmvb)$/i)) return;
	if (filename.match(/hot-update\.json/i)) return;
	if (!!pathname.match(/^[\/\\]*api[\/\\]/i) || !!pathname.match(/^[\/\\]*api$/i)) return;
	// if (!fullpath.match(/^\/*#\/+|^\/*#$/)) caches.open(CacheName).then(cache => cache.add(fullpath)); // 将适合的请求都缓存起来
	if (!CacheUrl.includes(fullpath)) caches.open(CacheName).then(cache => {
		cache.add(fullpath);
		CacheUrl.push(fullpath);
	}); // 将适合的请求都缓存起来
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