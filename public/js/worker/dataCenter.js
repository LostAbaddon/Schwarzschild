self.global = self;

// 文章搜索组件，只适用于小体量情况
const SearchCenter = {
	foliationalize (command, subs=[], regs=[]) {
		// 去除不必要的空格
		command = command.replace(/(^\s+|\s+$)/g, '');

		// 识别正则表达式
		var level = 0, stops = [];
		command.replace(/(reg\(|\(|\))/g, (match, _, pos) => {
			if (match === 'reg(') {
				stops.push([pos, level]);
				level ++;
			}
			else if (match === '(') {
				level ++;
			}
			else if (match === ')') {
				level --;
				let last = stops[stops.length - 1];
				if (!last) return;
				if (level === last[1]) {
					stops.push(pos);
				}
			}
		});
		if (level !== 0) {
			throw new Error("查询指令语法错误，未闭合！");
		}
		stops = stops.map(s => {
			if (!s.length) return s;
			return s[0];
		});
		var l = stops.length;
		if (Math.floor(l / 2) * 2 !== l) {
			throw new Error("查询指令语法错误，未闭合！");
		}
		for (let i = l / 2 - 1; i >= 0; i --) {
			let a = stops[2 * i];
			let b = stops[2 * i + 1];
			let exp = command.substring(a + 4, b);
			exp = exp.match(/^\/(.*)\/([gi]*)/);
			let param = exp[2] || '';
			if (param.indexOf('g') < 0) param = param + 'g';
			exp = exp[1].replace(/\\/g, '\\\\').replace(/\//g, '\\/');
			let reg = new RegExp(exp, param);
			let idx = regs.length;
			regs[idx] = reg;
			command = command.substring(0, a) + '[REG:' + idx + ']' + command.substring(b + 1);
		}

		// 对搜索指令进行分支
		stops = [];
		command.replace(/(T|C|K|reg)?(\\*)([\(\)（）])/g, (match, type, pre, brace, pos) => {
			var len = (pre || '').length;
			if (len >> 1 << 1 !== len) return;
			type = type || '';
			pos += len + type.length;
			if (brace === '(' || brace === '（') {
				if (level === 0) stops.push(type, pos);
				level ++;
			}
			else {
				level --;
				if (level === 0) stops.push(pos);
			}
		});
		if (level !== 0) {
			throw new Error("查询指令语法错误，未闭合！");
		}
		l = stops.length;
		if (Math.floor(l / 3) * 3 !== l) {
			throw new Error("查询指令语法错误，未闭合！");
		}

		for (let i = l / 3 - 1; i >= 0; i --) {
			let j = 3 * i;
			if (!!stops[j]) {
				if (stops[j] === 'reg') {

				}
				continue;
			}
			let a = stops[j + 1];
			let b = stops[j + 2];
			let k = command.substring(a + 1, b);
			let x = subs.length;
			subs[x] = k;
			subs[x] = this.foliationalize(k, subs);
			command = command.substring(0, a - 1) + '[SUB:' + x + ']' + command.substring(b + 1);
		}

		l = 0;
		var parts = [], ops = [];
		command.replace(/\s*([\+\-\*])\s*/g, (match, op, pos) => {
			var p = command.substring(l, pos).replace(/(^\s*|\s*$)/g, '');
			if (!p) throw new Error("搜索指令出现空表达式！");
			l = pos + match.length;
			ops.push(op);
			parts.push(p);
		});
		parts.push(command.substring(l).replace(/(^\s*|\s*$)/g, ''));
		parts = parts.map(cmd => {
			var type = 'C';
			var exp = cmd;
			if (cmd.indexOf('T(') === 0) {
				type = 'T';
				exp = cmd.replace(/(^T\(|\)$)/g, '');
			}
			else if (cmd.indexOf('C(') === 0) {
				exp = cmd.replace(/(^C\(|\)$)/g, '');
			}
			else if (cmd.indexOf('K(') === 0) {
				type = 'K';
				exp = cmd.replace(/(^K\(|\)$)/g, '');
			}
			else if (cmd.indexOf('[SUB:') === 0) {
				type = 'G';
			}
			return {type, exp};
		});

		return {parts, ops, subs, regs};
	},
	prepareCloudArticle (list, prefixAPI, prefixData) {
		var result = {}, arts = {};
		for (let url in list) {
			let item = list[url].data;
			if (!item) continue;
			let u1 = url.replace(prefixAPI, '');
			let u2 = url.replace(prefixData, '');
			if (url.indexOf(prefixAPI) >= 0 && !!u1.match(/^\/\w+\-\d+\.json$/i)) {
				item.articles.forEach(item => {
					if (item.type !== 'article') return;
					var url = '/' + item.sort + '/' + item.filename;
					var doc = result[url];
					if (!doc || item.publish > doc.timestamp) {
						doc = {
							url,
							type: 'cloud',
							title: item.title,
							keywords: '',
							content: item.description,
							author: item.author,
							timestamp: item.publish || 0,
							score: 0
						};
						result[url] = doc;
					}
				});
			}
			else if (url.indexOf(prefixData) >= 0 && !!u2.match(/\.m[du]/i)) {
				if (!u2.match(/\/info\.md/i)) arts[u2] = item;
			}
		}
		result = Object.keys(result).map(url => result[url]);
		result.forEach(item => {
			var url = item.url;
			var content = arts[url];
			if (!!content) item.content = content;
		});
		return result;
	},
	prepareEdgeArticle (cate, list, cateMap) {
		var result = Object.keys(cate).map(id => {
			var item = cate[id];
			return {
				url: item.id,
				type: 'edge',
				title: item.title,
				keywords: item.category.map(c => cateMap[c] || c).join(', '),
				content: list[id].content,
				author: item.author,
				timestamp: item.publish || 0,
				score: 0
			}
		});
		return result;
	},
	searchViaCommand (command, wholeScope) {
		var count = command.ops.length;
		var scope = this.searchLogicly(command.parts[0], wholeScope, command.regs, command.subs);
		for (let i = 0; i < count; i ++) {
			let op = command.ops[i];
			let next = command.parts[i + 1];
			let scp;
			if (op === '+') scp = wholeScope;
			else scp = scope;
			let rst = this.searchLogicly(next, scp, command.regs, command.subs);
			if (!rst) continue;
			if (op === '+') {
				for (let l of rst) {
					scope.add(l);
				}
			}
			else if (op === '*') {
				scope = rst;
			}
			else if (op === '-') {
				for (let l of rst) {
					scope.delete(l);
				}
			}
		}
		return scope;
	},
	countKeyword (keyword, content) {
		var count = 0, last = 0;
		while (true) {
			let l = content.indexOf(keyword, last);
			if (l < 0) break;
			count ++;
			last = l + keyword.length;
		}
		return count;
	},
	searchLogicly (command, articles, regs, subs) {
		var result = new Set();
		var cmd = command.exp;
		var isReg = cmd.match(/^\[REG:(\d+)\]$/i);
		if (!isReg) {
			isReg = false;
		}
		else {
			cmd = isReg[1] * 1;
			if (isNaN(cmd)) {
				isReg = false;
				cmd = command.exp;
			}
			else {
				cmd = regs[cmd];
				if (!!cmd) {
					isReg = true;
				}
				else {
					isReg = false;
					cmd = command.exp;
				}
			}
		}

		if (command.type === 'G') {
			cmd = command.exp;
			let sub = cmd.match(/^\[SUB:(\d+)\]$/i);
			if (!!sub) {
				sub = sub[1] * 1;
				if (!isNaN(sub)) {
					sub = subs[sub];
					if (!!sub) {
						return this.searchViaCommand(sub, articles);
					}
				}
			}
		}

		var target = 'content';
		if (command.type === 'T') {
			target = 'title';
		}
		else if (command.type === 'K') {
			target = 'keywords';
		}

		if (isReg) {
			for (let item of articles) {
				let text = item[target];
				let count = text.match(cmd);
				if (!count) {
					count = 0;
				}
				else {
					count = count.length;
				}
				if (count <= 0) continue;
				item.score += Math.round(Math.log(count) * 5 + 10);
				result.add(item);
			}
		}
		else {
			for (let item of articles) {
				let count = this.countKeyword(cmd, item[target]);
				if (count <= 0) continue;
				item.score += Math.round(Math.log(count) * 5 + 10);
				result.add(item);
			}
		}
		return result;
	},
};

// 无论是主线程还是共享线程中的数据库实际操作对象
self.DataCenter = {
	dbs: new Map(),
	_waiters: new Map(),
	waitForReady: (dbName) => new Promise(res => {
		var db = DataCenter.dbs.get(dbName);
		if (!!db && db.ready) return res();
		var list = DataCenter._waiters.get(dbName);
		if (!list) {
			list = new Set();
			DataCenter._waiters.set(dbName, list);
		}
		list.add(res);
	}),
	resumeWaiters (dbName) {
		var reqList = DataCenter._waiters.get(dbName);
		if (!reqList) return;
		var list = [...reqList];
		reqList.clear();
		DataCenter._waiters.delete(dbName);
		list.forEach(req => req());
	},
	async _initAPIData () {
		var dbName = 'APIData';
		var db = new CachedDB(dbName, 2);
		DataCenter.dbs.set(dbName, db);
		db.onUpdate(() => {
			db.open('data', 'url', 10);
			db.open('index', 'url', 10);
			console.log('DataCenter::APIData Updated');
		});
		db.onConnect(() => {
			console.log('DataCenter::APIData Connected');
		});
		await db.connect();
		DataCenter.resumeWaiters(dbName);
	},
	async _initBookShelf () {
		var dbName = 'localBookShelf';
		var db = new CachedDB(dbName, 1);
		DataCenter.dbs.set(dbName, db);
		db.onUpdate(() => {
			db.open('article', 'id');
			db.open('list', 'id', 0, ['publish']);
			console.log('BookShelf::CacheStorage Updated');
		});
		db.onConnect(() => {
			console.log('BookShelf::CacheStorage Connected');
		});
		await db.connect();
		DataCenter.resumeWaiters(dbName);
	},
	async init () {
		await Promise.all([
			DataCenter._initAPIData(),
			DataCenter._initBookShelf()
		]);
	},
	onConnect (db, callback) {
		db = DataCenter.get(db);
		if (!db) return callback(null);
		db.onConnect(callback);
	},
	onUpdate (db, callback) {
		db = DataCenter.get(db);
		if (!db) return callback(null);
		db.onUpdate(callback);
	},
	async get (dbName, store, key) {
		var db = DataCenter.dbs.get(dbName);
		if (!db) return undefined;
		if (!db.ready) {
			await DataCenter.waitForReady(dbName);
		}
		if (!db.available) return undefined;
		return await db.get(store, key);
	},
	async set (dbName, store, key, value) {
		var db = DataCenter.dbs.get(dbName);
		if (!db) return null;
		if (!db.ready) {
			await DataCenter.waitForReady(dbName);
		}
		if (!db.available) return null;
		return await db.set(store, key, value);
	},
	async all (dbName, store, key) {
		var db = DataCenter.dbs.get(dbName);
		if (!db) return null;
		if (!db.ready) {
			await DataCenter.waitForReady(dbName);
		}
		if (!db.available) return null;
		return await db.all(store, key);
	},
	async del (dbName, store, key) {
		var db = DataCenter.dbs.get(dbName);
		if (!db) return null;
		if (!db.ready) {
			await DataCenter.waitForReady(dbName);
		}
		if (!db.available) return null;
		return await db.del(store, key);
	},
	async clear (dbName, store) {
		var db = DataCenter.dbs.get(dbName);
		if (!db) return null;
		if (!db.ready) {
			await DataCenter.waitForReady(dbName);
		}
		if (!db.available) return null;
		db.clearCache(store);
		return await db.clear(store);
	},
	async searchArticle (command, prefixAPI='', prefixData='', cateMap={}) {
		if (!!self.window && !!self.window.Barn) {
			prefixAPI = prefixAPI || Barn.API;
			prefixData = prefixData || Barn.DataGranary;
		}

		var origin = command;
		var start = Date.now();

		try {
			command = SearchCenter.foliationalize(command);
		}
		catch (err) {
			console.error(err);
			return err;
		}

		var [allC, allEA, allEL] = await Promise.all([
			DataCenter.all('APIData', 'data'),
			DataCenter.all('localBookShelf', 'article'),
			DataCenter.all('localBookShelf', 'list'),
		]);
		var cloudArticles = SearchCenter.prepareCloudArticle(allC, prefixAPI, prefixData);
		var edgeArticles = SearchCenter.prepareEdgeArticle(allEL, allEA, cateMap);
		var allArticle = new Set([...cloudArticles, ...edgeArticles]);
		var result = SearchCenter.searchViaCommand(command, allArticle);
		result = [...result];
		result.sort((a, b) => b.score - a.score);
		// var related = [];
		// for (let item of allArticle) {
		// 	if (item.score <= 0) continue;
		// 	if (result.includes(item)) continue;
		// 	related.push(item);
		// }

		result = result.map(item => {
			return {
				title: item.title,
				url: item.url,
				type: item.type,
				score: item.score / 10,
			}
		});
		// related = related.map(item => {
		// 	return {
		// 		title: item.title,
		// 		url: item.url,
		// 		type: item.type,
		// 		score: item.score / 10,
		// 	}
		// });

		start = Date.now() - start;
		console.log('Search [' + origin + '] time used: ' + start + 'ms.');

		return {match: result, timeused: start};
		// return {match: result, related, timeused: start};
	},
	hex2array (list) {
		list = list.split('').map(c => {
			c = parseInt(c, 16).toString(2).split('').map(i => i * 1);
			for (let i = c.length; i < 4; i ++) c.unshift(0);
			return c;
		});
		list = list.flat();
		return list;
	},
	async findLikelyArticle (id) {
		var info = await DataCenter.get('APIData', 'index', id);
		if (!info || !info.likehood) return null;
		var likehood = DataCenter.hex2array(info.likehood);

		var list = await DataCenter.all('APIData', 'index');
		list = Object.keys(list).map(name => [name, list[name]]);
		list = list.filter(item => !!item[1].likehood && item[0] !== id);
		var result = [];
		list.forEach(item => {
			var list = DataCenter.hex2array(item[1].likehood);
			var similarity = 0;
			list.forEach((d, i) => {
				if (d === likehood[i]) similarity ++;
			});
			result.push([item[0], item[1].title, similarity]);
		});
		result.sort((a, b) => b[2] - a[2]);
		result.splice(10);
		return result;
	},
};

// 如果在线程中
if (!self.window) {
	importScripts('/js/lrucache.js');
	importScripts('/js/cachedDB.js');

	let handler = (listener, sender) => async ({data}) => {
		if (data === 'suicide') {
			listener.close();
			return;
		}

		console.log('DataCenter::Task: ' + (data.dbName || 'all') + '/' + (data.store || 'all') + '/' + data.action);
		var act = DataCenter[data.action];
		var result = null;
		if (data.action === "searchArticle") {
			result = await DataCenter.searchArticle(data.command, ...data.prefix, data.map);
		}
		else if (data.action === "findLikelyArticle") {
			result = await DataCenter.findLikelyArticle(data.articleId);
		}
		else if (!!act) {
			result = await act(data.dbName, data.store, data.key, data.value);
		}

		sender.postMessage({tid: data.tid, result});
	};

	if (self.onconnect !== undefined) {
		self.onconnect = ({ports}) => {
			console.log('Shared-Worker DataCenter Connected!');
			var port = ports[0];
			port.onmessage = handler(port, port);
		};
		console.log('Shared-Worker DataCenter is READY!');
	}
	else {
		self.onmessage = handler(self, self);
		console.log('Dedicated-Worker DataCenter is READY!');
	}

	DataCenter.init();
}