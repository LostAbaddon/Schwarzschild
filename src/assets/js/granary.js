const chDataFetched = new BroadcastChannel('fetch-data');

const Barn = {
	server: '',
	DB: null,
	ready: false,
	async init () {
		Barn.DB = new CachedDB("APIData", 1);
		Barn.DB.onUpdate(() => {
			Barn.DB.open('data', 'url', 10);
			console.log('Barn::CacheStorage::APIData Updated');
		});
		Barn.DB.onConnect(() => {
			console.log('Barn::CacheStorage::APIData Connected');
		});
		await Barn.DB.connect();
		Barn.ready = true;

		var cbs = [...Barn.waiters];
		Barn.waiters = [];
		cbs.forEach(res => res());
	},
	waiters: [],
	waitForReady: () => new Promise(res => {
		if (Barn.ready) return res();
		Barn.waiters.push(res);
	}),
	get (url, notStill=false, timestamp=0) {
		return new Promise(async res => {
			if (!Barn.ready) {
				await Barn.waitForReady();
			}
			var cache = await Barn.DB.get('data', url);
			if (!!cache) {
				res(cache.data);
				if (!!notStill && timestamp <= cache.update) return;
			}
			var data;
			try {
				data = await axios.get(Barn.server + url);
			}
			catch (err) {
				data = null;
				console.error(err);
			}
			if (!!data) data = data.data;
			if (!!data) {
				await Barn.DB.set('data', url, {data, update: Date.now()});
				if (!!cache) {
					chDataFetched.postMessage({ url, data });
				}
			}
			if (!cache) res(data);
		});
	},
	async clearAllCache () {
		Barn.DB.clearCache('data');
		await Barn.DB.clear('data');
	}
};

// 资源管理
window.Granary = {
	async getSource (source, limit) {
		var result = { articles: [], comments: [] };
		await Promise.all(Array.generate(limit + 1).map(async index => {
			var url = '/api/' + source + '-' + index + '.json';
			var d = await Barn.get(url, limit !== index);
			if (String.is(d)) return;
			result.articles.push(...d.articles);
			result.comments.push(...d.comments);
		}));
		result.articles.sort((a, b) => b.publish - a.publish);
		result.comments.sort((a, b) => b.publish - a.publish);
		return result;
	},
	async getCategory (category) {
		var sources = await Barn.get('/api/sources.json', false);
		var data = [];
		if (!sources || !sources.sources) return data;
		await Promise.all(sources.sources.map(async source => {
			var d = await Granary.getSource(source.owner, source.pages);
			d = d.articles.filter(art => art.sort.indexOf(category) === 0);
			data.push(...d);
		}));
		data.sort((a, b) => b.publish - a.publish);
		return data;
	},
	async getColumnHeader (category) {
		var sources = await Barn.get('/api/sources.json', true);

		var info = '/api/granary/';
		if (!!category) info = '/api/granary/' + category + '/';
		info = info + 'info.md';
		var data = sessionStorage.getItem(info);
		if (String.is(data)) return data;
		try {
			data = await Barn.get(info, true, sources.update);
			data = !!data ? data : '';
			sessionStorage.setItem(info, data);
		}
		catch {
			data = '';
		}
		return data;
	},
	async getArticle (filepath, timestamp) {
		filepath = '/api/granary/' + filepath;
		var content = sessionStorage.getItem(filepath);
		if (String.is(content)) return content;

		try {
			content = await Barn.get(filepath, true, timestamp);
			content = !!content ? content : '';
			sessionStorage.setItem(filepath, content);
		}
		catch {
			content = '你所寻找的文件不存在！';
		}
		return content;
	},
	async getContent (filepath) {
		var content = sessionStorage.getItem(filepath);
		if (String.is(content)) return content;

		try {
			content = await Barn.get(filepath, true, 0);
			content = !!content ? content : '';
			sessionStorage.setItem(filepath, content);
		}
		catch (err) {
			content = '你所寻找的文件不存在！';
		}
		return content;
	},
	async clearAllCache () {
		sessionStorage.clear();
		var keys = await caches.keys();
		if (!keys) return;
		var tasks = keys.map(key => caches.delete(key));
		tasks.push(Barn.clearAllCache());
		await Promise.all(tasks);
	},
};

chDataFetched.addEventListener('message', msg => {
	console.log(msg);
});
Barn.init();