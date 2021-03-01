<template>
	<div class="loading" :class="show?'show':'hide'">
		<div class="hint">
			<div class="animate spin" v-if="type==='spin'"><i class="fas fa-spinner fa-spin fa-fast" /></div>
			<div class="animate pulse" v-if="type==='pulse'">
				<i class="fas fa-square" />
				<i class="fas fa-square" />
				<i class="fas fa-square" />
				<i class="fas fa-square" />
				<i class="fas fa-square" />
			</div>
			<div class="title">{{title}}</div>
		</div>
		<div class="forceQuit" v-if="forcequit" @click="forceQuit">强制关闭</div>
	</div>
</template>

<script>
const channel = new BroadcastChannel('change-loading-hint');
global.callPageLoaded = () => {
	var ch = new BroadcastChannel('change-loading-hint');
	ch.postMessage({action: 'hide'});
};
var quiter = null;

export default {
	name: "Loading",
	data () {
		return {
			title: "载入中……",
			show: true,
			type: "pulse",
			forcequit: false
		}
	},
	created () {
		channel.addEventListener('message', msg => {
			var data = msg.data;
			if (data.action === 'show') {
				data.title = data.title || '载入中……';
				this.forcequit = false;
				if (!!quiter) {
					clearTimeout(quiter);
					quiter = null;
				}
				quiter = setTimeout(() => {
					this.forcequit = true;
				}, 5000);
				this.show = true;
			}
			else if (data.action === 'hide') {
				data.title = data.title || '载入中……';
				this.forcequit = false;
				if (!!quiter) {
					clearTimeout(quiter);
					quiter = null;
				}
				this.show = false;
			}
			if (String.is(data.title)) this.title = data.title;
			if (['spin', 'pulse'].indexOf(data.type) >= 0) this.type = data.type;
		});
	},
	methods: {
		forceQuit () {
			if (!!quiter) {
				clearTimeout(quiter);
				quiter = null;
			}
			this.show = false;
		}
	}
}
</script>