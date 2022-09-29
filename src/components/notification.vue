<template>
	<div class="notifaction-frame" :horizontal="hAlign" :vertial="vAlign" @click="onClick"></div>
</template>

<script>
var current;
var pending = new Set();
PageBroadcast.on('show-notification', data => {
	notify(data);
});
window.notify = msg => {
	if (!current) {
		pending.add(msg);
		return;
	}
	current.showMessage(msg);
};

export default {
	name: "Notification",
	props: {
		"hAlign": String,
		"vAlign": String
	},
	install (app) {
		require('../assets/css/notification.css');
		app.component('Notification', this);
	},
	async mounted () {
		current = this;
		if (!pending) return;
		for (let msg of pending) {
			await wait();
			this.showMessage(msg);
		}
		pending.clear();
		pending = null;
	},
	methods: {
		async showMessage (msg) {
			if (String.is(msg)) msg = {title: msg};
			var duration = msg.duration || 3000;
			var key = Math.floor(10000000000 * Math.random());
			msg.key = key;

			msg.ele = this.newMsg(msg);
			msg.ele.exit = async () => {
				if (!!msg.timer) clearTimeout(msg.timer);
				delete msg.timer;

				msg.ele.classList.remove('show');
				await wait(300);
				this.$el.removeChild(msg.ele);

				delete msg.ele.exit;
				delete msg.ele;
			};
			this.$el.appendChild(msg.ele);
			await wait(100);
			msg.ele.classList.add('show');

			msg.timer = setTimeout(msg.ele.exit, duration);
		},
		newMsg (msg) {
			var ele = document.createElement('section');
			ele.setAttribute('key', msg.key);
			ele.setAttribute('type', msg.type || 'default');
			if (!!msg.title) {
				let header = document.createElement('header');
				header.innerText = msg.title;
				ele.appendChild(header);
			}
			if (!!msg.message) {
				let article = document.createElement('article');
				article.innerText = msg.message;
				ele.appendChild(article);
			}
			return ele;
		},
		onClick (evt) {
			var ele = evt.target;
			if (!ele) return;
			if (!ele.exit) return;
			ele.exit();
		}
	}
}
</script>