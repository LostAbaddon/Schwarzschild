window.InitAsimov = async () => {
	// 如果支持线程，则启用线程来解析MarkUp
	if (!!window.SharedWorker || !!window.Worker) {
		let TaskPool = new Map();
		let generateID = () => Math.floor(Math.random() * 100000000);

		let asimovWorker, workerPort, workerName;
		if (!!window.SharedWorker) {
			workerName = 'Shared-Worker Asimov';
			asimovWorker = new SharedWorker('/js/worker/asimov.js');
			workerPort = asimovWorker.port;
		}
		else {
			workerName = 'Dedicated-Worker Asimov';
			asimovWorker = new Worker('/js/worker/asimov.js');
			workerPort = asimovWorker;
		}
		workerPort.onmessage = ({data}) => {
			console.log(workerName + ' finished task-' + data.id);
			var res = TaskPool.get(data.id);
			TaskPool.delete(data.id);
			if (!res) return;
			res(data.result);
		};

		window.MarkUp = window.MarkUp || {};
		window.MarkUp.fullParse = (text, config) => new Promise(res => {
			var id = generateID();
			TaskPool.set(id, res);
			console.log(workerName + ' started parse-task: ' + id);
			workerPort.postMessage({id, action: 'parse', content: text, config});
		});
		window.MarkUp.parse = async (text, config) => {
			var result;
			result = await MarkUp.fullParse(text + '\n', config);
			if (!result) return '';
			return result.content;
		};
		// 由于Worker中不能操纵Node和Fragment，所以这里使用一个阉割版。这倒是意料之外的BUG。
		window.MarkUp.reverse = (content) => new Promise(res => {
			var id = generateID();
			TaskPool.set(id, res);
			console.log(workerName + ' started reverse-task: ' + id);
			workerPort.postMessage({id, action: 'reverse', content});
		});

		window.onbeforeunload = () => {
			workerPort.postMessage('suicide');
			workerPort.close();
		};
	}
	// 如果不支持线程，则在浏览器主线程解析MarkUp
	else {
		await loadJS('/Asimov/markup.js');
		await loadJS('/Asimov/extensions.js');
		await loadJS('/js/worker/extmarkup.js');
	}
};