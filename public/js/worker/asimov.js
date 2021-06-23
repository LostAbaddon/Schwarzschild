self.global = self;

importScripts('../../Asimov/markup.js');
importScripts('../../Asimov/extensions.js');
importScripts('./extmarkup.js');

const handler = (listener, sender) => ({data}) => {
	if (data === 'suicide') {
		listener.close();
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
	sender.postMessage({id: data.id, result});
};

if (self.onconnect !== undefined) {
	self.onconnect = ({ports}) => {
		console.log('Shared-Worker Asimov Connected!');
		var port = ports[0];
		port.onmessage = handler(port, port);
	};
	console.log('Shared-Worker Asimov is READY!');
}
else {
	self.onmessage = handler(port, self);
	console.log('Dedicated-Worker Asimov is READY!');
}