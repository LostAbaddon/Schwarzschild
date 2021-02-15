const CacheName = 'schwarzschild-v1';
const CacheUrl = [
	'/',
	'/index.html',
	'/favicon.ico',
	'/webapp.json',
];
const TagModify = 'last-modified';
const channel = new BroadcastChannel('service-messages');
const sendMessage = msg => {
	channel.postMessage(msg);
};

const cacheResource = async (req, res) => {
	var cache = await caches.open(CacheName);
	await cache.put(req, res);
};

self.addEventListener('install', evt => {
	console.log('>>::==  SW Installed  ==::<<');
	evt.waitUntil(async () => {
		var cache = await caches.open(CacheName);
		await cache.addAll(CacheUrl);
	});
});
self.addEventListener('activate', evt => {
	console.log('>>::==  SW Activated  ==::<<');
	evt.waitUntil(async () => {
		let keys = await caches.keys();
		if (keys.length === 0) {
			return;
		}
		keys.forEach(async key => {
			if (key !== CacheName) {
				try {
					await caches.delete(key);
				}
				catch (err) {
					console.error(err);
				}
				return;
			}
			var cacheStorage = await caches.open(key);
			var cacheKeys = await cacheStorage.keys();
			cacheKeys.forEach(cache => {
				console.log(cache.url);
			});
		});
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
	if (!!pathname.match(/^\/api\//i)) return;
	console.log('CacheFetch: ' + fullpath);
	caches.open(CacheName).then(cache => cache.add(fullpath)); // 将适合的请求都缓存起来
	evt.respondWith(caches.match(evt.request).then(cache => {
		var cacheAt = 0;
		if (cache) {
			let last = cache.headers.get(TagModify);
			if (!!last) {
				try {
					last = new Date(last);
					cacheAt = last.getTime();
				} catch {
					cacheAt = 0;
				}
			}
		}

		// 无论是否已有缓存，都会从服务器上重新获取一份并缓存下来，以备下次万一服务器不可用
		var remote = fetch(evt.request).then(res => {
			var stamp = 0;
			var last = res.headers.get(TagModify);
			if (!!last) {
				try {
					last = new Date(last);
					stamp = last.getTime();
				} catch {
					stamp = 0;
				}
			}
			if (stamp > cacheAt) {
				let clone = res.clone();
				cacheResource(evt.request, clone).then(() => {
					setTimeout(() => {
						sendMessage({
							event: 'cacheUpdated',
							url: evt.request.url,
							timestamp: stamp,
							lastCache: cacheAt,
						});
					}, 0);
				});
			}
			return res;
		}).catch(e => {
			console.error(e);
		});

		return cache || remote;
	}));
});
channel.addEventListener('message', evt => {
	var msg = evt.data;
	console.log(msg);
});