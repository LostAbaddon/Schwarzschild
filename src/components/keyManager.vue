<template>
	<div class="KeyManager" :show="show" @click="close">
		<div class="keyManagerFrame">
			<div class="title">秘钥管理</div>
			<div class="desc">秘钥将用于加密阅读</div>
			<div class="keyListArea">
				<div class="keyItem" v-for="key in keyList" :current="key.current">
					<div class="keyContent" @click="chooseKey(key.key)">{{key.key}}</div>
					<div class="keyDeleter" v-if="!!key.editable" @click="removeKey(key.key, key.editable)"><i class="fas fa-times"></i></div>
				</div>
			</div>
			<div class="controlBox">
				<input ref="keyInputter" type="text" @keydown="onEnter">
				<button @click="appendKey">添加</button>
			</div>
		</div>
	</div>
</template>

<script>
const DefaultKey = "[:DEFAULT-AES-KEY:]";
if (!localStorage.CurrentKey) localStorage.CurrentKey = DefaultKey;

var current = null;
PageBroadcast.on('setting', (data) => {
	if (!current) return;
	if (data.action !== 'KeyManager') return;
	current.update();
	current.show = true;
});
export default {
	name: 'KeyManager',
	data () {
		return {
			show: false,
			keyList: []
		}
	},
	created () {
		current = this;
		var key = localStorage.getItem('CurrentKey');
		if (!key) localStorage.setItem('CurrentKey', DefaultKey);
	},
	methods: {
		update () {
			var currentKey = localStorage.getItem('CurrentKey');
			if (!currentKey) {
				localStorage.setItem('CurrentKey', DefaultKey);
				currentKey = DefaultKey;
			}
			this.keyList.clear();
			this.keyList.push({
				key: DefaultKey,
				editable: false,
				current: currentKey === DefaultKey
			});
			var list = localStorage.get('keyList', []);
			if (list.length === 0) return;
			this.keyList.push(...(list.map(l => {
				return {
					key: l,
					editable: true,
					current: currentKey === l
				}
			})));
		},
		close (evt) {
			if (evt.target === this.$el) this.show = false;
		},
		chooseKey (key) {
			localStorage.setItem('CurrentKey', key);
			this.keyList.forEach(item => item.current = item.key === key);
			notify({
				type: "success",
				title: "密钥更换成功"
			});
		},
		removeKey (key, editable) {
			if (!editable) {
				notify({
					type: "warn",
					title: "该密钥不可删除"
				});
				return;
			}
			if (!key) return;
			var index = -1;
			this.keyList.some((item, i) => {
				if (item.key !== key) return;
				index = i;
				return true;
			});
			if (index < 0) return;

			this.keyList.splice(index, 1);
			notify({
				type: "success",
				title: "成功删除密钥" + key
			});

			var list = this.keyList.map(item => item.key);
			list.splice(0, 1); // 去掉默认密钥
			localStorage.set('keyList', list);
		},
		appendKey () {
			var key = this.$refs.keyInputter.value;
			if (!key) {
				notify({
					type: "warn",
					title: "请输入密钥数据"
				});
				this.$refs.keyInputter.focus();
				return;
			}

			this.keyList.push({ key, editable: true, current: false });
			this.$refs.keyInputter.value = '';
			notify({
				type: "success",
				title: "成功添加密钥" + key
			});

			var list = this.keyList.map(item => item.key);
			list.splice(0, 1); // 去掉默认密钥
			localStorage.set('keyList', list);
		},
		onEnter (evt) {
			if (evt.keyCode === 13) {
				this.appendKey();
			}
		}
	}
}
</script>