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
	</div>
</template>

<script>
const channel = new BroadcastChannel('change-loading-hint');
global.callPageLoaded = () => {
	var ch = new BroadcastChannel('change-loading-hint');
	ch.postMessage({action: 'hide'});
};

export default {
	name: "Loading",
	data () {
		return {
			title: "载入中……",
			show: true,
			type: "pulse"
		}
	},
	created () {
		channel.addEventListener('message', async msg => {
			var data = msg.data;
			if (data.action === 'show') this.show = true;
			else if (data.action === 'hide') this.show = false;
			if (String.is(data.title)) this.title = data.title;
			if (['spin', 'pulse'].indexOf(data.type) >= 0) this.type = data.type;
		});
	}
}
</script>