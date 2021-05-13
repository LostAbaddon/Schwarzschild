<template>
	<div class="infobox-mask" :show="show"></div>
	<div class="infobox-frame scroller" :show="show">
		<div class="title">{{title}}</div>
		<div ref="content" class="content"></div>
		<div class="inputter" v-if="showInput"><input ref="inputter" type="text" @keydown.esc="onClick('ok')" @keydown.enter="onClick('cancel')"></div>
		<div class="controller">
			<div class="btn" action="yes" :hidden="!actYes" @click="onClick('yes')">是</div>
			<div class="btn" action="no" :hidden="!actNo" @click="onClick('no')">否</div>
			<div class="btn" action="ok" :hidden="!actOk" @click="onClick('ok')">确定</div>
			<div class="btn" action="cancel" :hidden="!actCancel" @click="onClick('cancel')">取消</div>
		</div>
	</div>
</template>

<script>
var current, callback, responsor;
window.showInfobox = async (option) => {
	if (!current) return;
	return await current.showInfoBox(option);
};

export default {
	name: "InfoBox",
	data () {
		return {
			show: false,
			title: '',
			showInput: false,
			actYes: false,
			actNo: false,
			actOk: false,
			actCancel: false,
		}
	},
	install (app) {
		require('../assets/css/infobox.css');
		app.component('InfoBox', this);
	},
	mounted () {
		current = this;
	},
	methods: {
		showInfoBox (option) {
			return new Promise(res => {
				if (this.show) return;

				if (String.is(option)) {
					this.title = option;
					this.actOk = true;
					this.actYes = false;
					this.actNo = false;
					this.actCancel = false;
				}
				else {
					this.title = option.title || '';
					option.mode = option.mode || '';
					this.showInput = !!option.input;
					if (option.mode.toLowerCase() === 'html') {
						this.$refs.content.innerHTML = option.content || '';
					}
					else {
						this.$refs.content.innerText = option.content || '';
					}
					option.action = option.action.toLowerCase();
					this.actYes = option.action.indexOf('y') >= 0;
					this.actNo = option.action.indexOf('n') >= 0;
					this.actOk = option.action.indexOf('o') >= 0;
					this.actCancel = option.action.indexOf('c') >= 0;
				}
				if (!!responsor) {
					responsor(null, null, this);
				}
				responsor = res;
				if (!!callback) {
					callback(null, null, this);
				}
				callback = option.callback;

				this.show = true;
			})
		},
		onClick (result) {
			if (result === 'yes' && !this.actYes) return;
			if (result === 'no' && !this.actNo) return;
			if (result === 'ok' && !this.actOk) return;
			if (result === 'cancel' && !this.actCancel) return;

			var value = null;
			if (!!this.$refs.inputter) value = this.$refs.inputter.value;
			if (!!responsor) {
				responsor(result, value || null, this);
			}
			responsor = null;
			if (!!callback) {
				callback(result, value || null, this);
			}
			callback = null;
			this.show = false;
			if (!!this.$refs.inputter) this.$refs.inputter.value = '';
		}
	}
}
</script>