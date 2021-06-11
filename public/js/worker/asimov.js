self.global = self;

importScripts('../../Asimov/markup.js');
importScripts('../../Asimov/extensions.js');
importScripts('./extmarkup.js');

const isSharedWorker = !self.Worker;

if (isSharedWorker) {
	self.onconnect = ({ports}) => {
		var port = ports[0];
		console.log('Shared-Worker Connected!');
		port.onmessage = ({data}) => {
			if (data === 'suicide') {
				port.close();
				return;
			}

			var result = '', len = 0;
			if (data.action === 'parse') {
				result = MarkUp.fullParse(data.content, data.config);
				len = result.content.length;
			}
			else if (data.action === 'reverse') {
				result = MarkUp.plaintextReverse(data.content, data.config);
				len = result.length;
			}
			else {
				result = "未知任务类型！";
			}

			console.log('Asimov Done: ' + data.content.length + ' / ' + len);
			port.postMessage({id: data.id, result});
		};
	};
	console.log('Shared-Worker Asimov is READY!');
}
else {
	self.onmessage = ({data}) => {
		if (data === 'suicide') {
			port.close();
			return;
		}

		var result = '', len = 0;
		if (data.action === 'parse') {
			result = MarkUp.fullParse(data.content, data.config);
			len = result.content.length;
		}
		else if (data.action === 'reverse') {
			result = MarkUp.plaintextReverse(data.content);
			len = result.length;
		}
		else {
			result = "未知任务类型！";
		}

		console.log('Asimov Done: ' + data.content.length + ' / ' + len);
		self.postMessage({id: data.id, result});
	};
	console.log('Dedicated-Worker Asimov is READY!');
}