window.totalDecodeURI = uri => {
	var next = decodeURIComponent(uri);
	if (next === uri) return next;
	else return totalDecodeURI(next);
};

const Barn = {
	server: '',
	DB: null,
	ready: false,
	API: '/api',
	DataGranary: '/api/granary',
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
			var isSource = !!url.match(/(^sources|[\\\/]sources)\.json$/);
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
				await Barn.DB.set('data', url, {data, update: timestamp || Date.now()});
				let oldTime = !!cache ? (cache.data.update || 0) : 0;
				let newTime = data.update || 0;
				if (newTime > oldTime) {
					let msg = {
						latest: newTime,
						last: oldTime
					};
					if (isSource) msg.target = 'SOURCE';
					else msg.target = url;
					PageBroadcast.emit('source-updated', msg);
				}
			}
			if (!cache) res(data);
		});
	},
	async clearAllCache () {
		Barn.DB.clearCache('data');
		await Barn.DB.clear('data');
	},
};

// 资源管理
window.Granary = {
	async getSource (source, limit) {
		source = totalDecodeURI(source);
		var result = { articles: [], comments: [] };
		await Promise.all(Array.generate(limit + 1).map(async index => {
			var url = Barn.API + '/' + source + '-' + index + '.json';
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
		category = totalDecodeURI(category);
		var sources = await Barn.get(Barn.API + '/sources.json', false);
		var data = [];
		if (!sources || !sources.sources) return data;
		await Promise.all(sources.sources.map(async source => {
			var d = await Granary.getSource(source.owner, source.pages);
			d = d.articles.filter(art => art.sort.indexOf(category) === 0);
			data.push(...d);
		}));
		var articleList = {};
		data.forEach(art => {
			var id = null;
			if (art.type === 'article') {
				id = art.sort + '/' + art.filename
			}
			else if (art.type === 'redirect') {
				id = art.target;
			}
			else return;
			var old = articleList[id];
			if (!old || art.publish > old.publish) articleList[id] = art;
		});
		data = Object.values(articleList);
		data.sort((a, b) => b.publish - a.publish);
		return data;
	},
	async getColumnHeader (category) {
		category = totalDecodeURI(category);
		var sources = await Barn.get(Barn.API + '/sources.json', false);
		sources = sources || {};
		sources.update = sources.update || 0;

		var info = Barn.DataGranary + '/';
		if (!!category) info = info + category + '/';
		info = info + 'info.md';

		var data;
		try {
			data = await Barn.get(info, true, sources.update);
			data = !!data ? data : '';
		}
		catch (err) {
			data = '';
		}
		return data;
	},
	async getArticle (filepath, timestamp=0) {
		filepath = totalDecodeURI(filepath);
		if (timestamp <= 0) {
			var sources = await Barn.get(Barn.API + '/sources.json', false);
			sources = sources || {};
			timestamp = sources.update || 0;
		}

		filepath = Barn.DataGranary + '/' + filepath;
		var content;
		try {
			content = await Barn.get(filepath, true, timestamp);
			content = !!content ? content : '';
		}
		catch (err) {
			content = '你所寻找的文件不存在！';
		}
		return content;
	},
	async getContent (filepath, notStill=true) {
		filepath = totalDecodeURI(filepath);
		if (notStill) {
			var sources = await Barn.get(Barn.API + '/sources.json', false);
			sources = sources || {};
			timestamp = sources.update || 0;
		}

		var content;
		try {
			content = await Barn.get(filepath, notStill, timestamp);
			content = !!content ? content : '';
		}
		catch (err) {
			content = '你所寻找的文件不存在！';
		}
		return content;
	},
	async clearAllCache () {
		sessionStorage.clear();
		var tasks = [ Barn.clearAllCache() ];
		if (!!window.caches) tasks.push(caches.delete('schwarzschild'));
		await Promise.all(tasks);
	},
};

Barn.init();