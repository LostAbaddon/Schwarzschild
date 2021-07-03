window.totalDecodeURI = uri => {
	var next = decodeURIComponent(uri);
	if (next === uri) return next;
	else return totalDecodeURI(next);
};
window.useSharedWorker = !!window.SharedWorker;

// 只在有共享线程的情况下使用，否则切换到页面线程再切换回来还不如直接页面内调用数据库
if (useSharedWorker) {
	let TaskPool = new Map();
	let generateID = () => Math.floor(Math.random() * 100000000);

	let workerName = 'Shared-Worker DataCenter';
	let dataWorker = new SharedWorker('/js/worker/dataCenter.js');
	let workerPort = dataWorker.port;
	workerPort.onmessage = ({data}) => {
		console.log(workerName + ' finished task-' + data.tid);
		var res = TaskPool.get(data.tid);
		TaskPool.delete(data.tid);
		if (!res) return;
		res(data.result);
	};
	let sendRequest = req => {
		workerPort.postMessage(req);
	};
	window.DataCenter = {
		get: (dbName, store, key) => new Promise(res => {
			var tid = generateID();
			TaskPool.set(tid, res);
			console.log(workerName + ' start task-' + tid + ': get : ' + dbName + '/' + store + '/' + key);
			sendRequest({tid, action: 'get', dbName, store, key});
		}),
		set: (dbName, store, key, value) => new Promise(res => {
			var tid = generateID();
			TaskPool.set(tid, res);
			console.log(workerName + ' start task-' + tid + ': set : ' + dbName + '/' + store + '/' + key);
			sendRequest({tid, action: 'set', dbName, store, key, value});
		}),
		all: (dbName, store, key) => new Promise(res => {
			var tid = generateID();
			TaskPool.set(tid, res);
			console.log(workerName + ' start task-' + tid + ': all : ' + dbName + '/' + store + '/' + (key || 'default'));
			sendRequest({tid, action: 'all', dbName, store, key});
		}),
		del: (dbName, store, key) => new Promise(res => {
			var tid = generateID();
			TaskPool.set(tid, res);
			console.log(workerName + ' start task-' + tid + ': del : ' + dbName + '/' + store + '/' + key);
			sendRequest({tid, action: 'del', dbName, store, key});
		}),
		clear: (dbName, store) => new Promise(res => {
			var tid = generateID();
			TaskPool.set(tid, res);
			console.log(workerName + ' start task-' + tid + ': clear : ' + dbName + '/' + store);
			sendRequest({tid, action: 'clear', dbName, store});
		}),
		searchArticle: async (command) => new Promise(res => {
			var tid = generateID();
			TaskPool.set(tid, res);
			console.log(workerName + ' start task-' + tid + ': search : ' + command);
			sendRequest({tid, action: 'searchArticle', command, prefix: [Barn.API, Barn.DataGranary], map: CatePathMap});
		}),
	};
}

window.Barn = {
	server: '',
	API: '/api',
	DataGranary: '/api/granary',
	dbName: 'APIData',
	async init () {
		if (!useSharedWorker) {
			await loadJS('./js/worker/dataCenter.js');
			await DataCenter.init();
		}
	},
	quests: new Map(),
	waitForRequest: (url) => new Promise(res => {
		var list = Barn.quests.get(url);
		if (!list) {
			res(null);
			return;
		}
		list.push(res);
	}),
	get (url, notStill=false, timestamp=0) {
		return new Promise(async res => {
			var cache = await DataCenter.get(Barn.dbName, 'data', url);
			if (!!cache) {
				res(cache.data);
				if (!!notStill && timestamp <= cache.update) return;
			}

			if (!!Barn.quests.get(url)) {
				let data = await Barn.waitForRequest(url);
				if (!cache) res(data);
			}
			else {
				Barn.quests.set(url, []);
				let data;
				try {
					data = await axios.get(Barn.server + url);
				}
				catch (err) {
					data = null;
					console.error(err);
				}

				if (!!data) data = data.data;
				if (!!data) {
					await DataCenter.set(Barn.dbName, 'data', url, {data, update: timestamp || Date.now()});
					let oldTime = !!cache ? (cache.data.update || 0) : 0;
					let newTime = data.update || 0;
					if (newTime > oldTime || (data.update === undefined)) {
						let msg = {
							latest: newTime,
							last: oldTime
						};
						let isSource = !!url.match(/(^sources|[\\\/]sources)\.json$/i);
						if (isSource) msg.target = 'SOURCE';
						else {
							if (url.indexOf(Barn.DataGranary) === 0) url = url.replace(Barn.DataGranary, '');
							msg.target = url;
						}

						if (!!window.BroadcastChannel) {
							let bcch = new BroadcastChannel('source-updated');
							bcch.postMessage(msg);
						}
						else {
							PageBroadcast.emit('source-updated', msg);
						}
					}
				}

				let reqs = Barn.quests.get(url);
				Barn.quests.delete(url);
				if (!cache) res(data);
				if (!!reqs) reqs.forEach(req => req(data));
			}
		});
	},
	async clearAllCache () {
		await DataCenter.clear(Barn.dbName, 'data');
	},
};

// 资源管理
window.Granary = {
	async getSource (source, limit, timestamp) {
		source = totalDecodeURI(source);
		var result = { articles: [], comments: [] };
		await Promise.all(Array.generate(limit + 1).map(async index => {
			var url = Barn.API + '/' + source + '-' + index + '.json';
			var d = await Barn.get(url, true, timestamp);
			if (String.is(d)) return;
			result.articles.push(...d.articles);
			result.comments.push(...d.comments);
		}));
		result.articles.sort((a, b) => b.publish - a.publish);
		result.comments.sort((a, b) => b.publish - a.publish);
		return result;
	},
	async getCategory (category, page=0, count=10) {
		category = totalDecodeURI(category);
		var sources = await Barn.get(Barn.API + '/sources.json', false);
		var data = [];
		if (!sources || !sources.sources) return data;
		var timestamp = sources.update || 0;
		var tasks = sources.sources.map(async source => {
			var d = await Granary.getSource(source.owner, source.pages, timestamp);
			d = d.articles.filter(art => art.sort.indexOf(category) === 0);
			data.push(...d);
		});
		tasks.push((async () => {
			var mark = '/' + category;
			var list = await BookShelf.getAllArticles();
			list.reverse().forEach(art => {
				art.category = art.category || [];
				art.category.forEach(cate => {
					if (cate.indexOf(mark) !== 0) return;
					var doc = {
						type: 'local',
						title: art.title,
						author: art.author,
						description: art.description,
						filename: art.id,
						publish: art.publish,
						sort: cate,
					};
					data.push(doc);
				});
			});
		})());
		await Promise.all(tasks);
		var articleList = {};
		data.forEach(art => {
			var id = null;
			if (art.type === 'article') {
				id = art.sort + '/' + art.filename
			}
			else if (art.type === 'redirect') {
				id = art.target;
			}
			else if (art.type === 'local') {
				id = art.filename;
			}
			else return;
			var old = articleList[id];
			if (!old || art.publish > old.publish) articleList[id] = art;
		});
		data = Object.values(articleList);
		data.sort((a, b) => b.publish - a.publish);
		data = data.splice(page * count, count);
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

// 本地书架
window.BookShelf = {
	dbName: 'localBookShelf',
	newLongID () {
		var id = [];
		for (let i = 0; i < 32; i ++) {
			let j = Math.floor(Math.random() * 62);
			if (j < 10) id.push(j + '');
			else if (j < 36) id.push(String.fromCharCode(j + 87));
			else id.push(String.fromCharCode(j + 29));
		}
		return id.join('');
	},
	async getAllArticles () {
		return await DataCenter.all(BookShelf.dbName, 'list', 'publish');
	},
	async getArticle (id) {
		return await DataCenter.get(BookShelf.dbName, 'article', id)
	},
	async saveArticle (doc) {
		var info = {
			id: doc.id,
			title: doc.title,
			category: doc.category,
			author: doc.author,
			description: doc.description,
			publish: doc.publish
		};
		var data = {
			id: doc.id,
			title: doc.title,
			content: doc.content
		};
		await Promise.all([
			DataCenter.set(BookShelf.dbName, 'list', doc.id, info),
			DataCenter.set(BookShelf.dbName, 'article', doc.id, data)
		]);
		if (!!window.BroadcastChannel) {
			let bcch = new BroadcastChannel('local-article-updated');
			bcch.postMessage(doc.id);
		}
	},
	async removeArticle (id) {
		await Promise.all([
			DataCenter.del(BookShelf.dbName, 'list', id),
			DataCenter.del(BookShelf.dbName, 'article', id)
		]);
	},
};