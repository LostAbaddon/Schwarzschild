(async () => {
	if (!navigator.serviceWorker) return;

	const channel = new BroadcastChannel('service-messages');
	channel.addEventListener('message', msg => {
		console.log('CacheUpdated: ' + msg.data.url + ' (' + msg.data.timestamp + ')');
	});

	if (!!window.caches) {
		let keys = await caches.keys();
		if (keys.length > 0) {
			keys.forEach(async key => {
				var cacheStorage = await caches.open(key);
				var cacheKeys = await cacheStorage.keys();
				console.log('资源缓存库 ' + key + ': ' + cacheKeys.length);
			});
		}
	}

	try {
		let sws = await navigator.serviceWorker.getRegistrations();
		console.log('Service Worker: ' + sws.length);
		for (let sw of sws) {
			if (!!sw.waiting) {
				console.log('有等待中的新版本 Service Worker');
				notify({
					title: "有新版网站中台等待更新",
					message: "新版 Service Worker 将在下次打开本页面后启用。",
					duration: 5000,
					type: "warn"
				});
			}
		}
	}
	catch (err) {
		console.error('获取已安装 Service 出错：', err);
	}

	try {
		let reg = await navigator.serviceWorker.register('/priory.js');
		reg.onupdatefound = (evt) => {
			evt.target.update();
		};
		console.log('安装 Service Worker ' + (!!reg ? '成功' : '失败'));
	}
	catch (err) {
		console.error('安装本地 Service 出错：', err);
	}
}) ();