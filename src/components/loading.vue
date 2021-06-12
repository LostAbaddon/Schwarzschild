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
global.callPageLoaded = () => {
	PageBroadcast.emit('change-loading-hint', {action: 'hide'});
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
		PageBroadcast.on('change-loading-hint', msg => {
			if (msg.action === 'show') {
				msg.title = msg.title || '载入中……';
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
			else if (msg.action === 'hide') {
				msg.title = msg.title || '载入中……';
				this.forcequit = false;
				if (!!quiter) {
					clearTimeout(quiter);
					quiter = null;
				}
				this.show = false;
			}
			if (String.is(msg.title)) this.title = msg.title;
			if (['spin', 'pulse'].indexOf(msg.type) >= 0) this.type = msg.type;
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