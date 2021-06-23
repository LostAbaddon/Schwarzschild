self.global = self;

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
		var db = new CachedDB(dbName, 1);
		DataCenter.dbs.set(dbName, db);
		db.onUpdate(() => {
			db.open('data', 'url', 10);
			console.log('DataCenter::APIData Updated');
		});
		db.onConnect(() => {
			console.log('DataCenter::APIData Connected');
		});
		await db.connect();
		DataCenter.resumeWaiters(dbName);
	},
	async init () {
		await Promise.all([
			DataCenter._initAPIData()
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
	async all (dbName, store) {
		var db = DataCenter.dbs.get(dbName);
		if (!db) return null;
		if (!db.ready) {
			await DataCenter.waitForReady(dbName);
		}
		if (!db.available) return null;
		return await db.all(store);
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

		console.log('DataCenter::Task: ' + data.dbName + '/' + data.store + '/' + data.action);
		var act = DataCenter[data.action];
		var result = null;
		if (!!act) {
			result = await DataCenter[data.action](data.dbName, data.store, data.key, data.value);
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
		self.onmessage = handler(port, self);
		console.log('Dedicated-Worker DataCenter is READY!');
	}
}

DataCenter.init();