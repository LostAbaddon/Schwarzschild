<template>
	<div class="nav-menu-item">
		<a @click="click(type, action)">{{title}}<i class="fas fa-caret-down" v-if="!!subs" /></a>
		<i class="hint fas fa-caret-right" v-if="!!subs" />
		<NavMenuBar v-if="!!subs" :menu="subs" :supers="action" />
	</div>
</template>

<script>
export default {
	name: 'NavMenuItem',
	props: {
		title: String,
		type: String,
		action: String,
		subs: Array
	},
	methods: {
		click (type, action) {
			action = action.split(',').filter(f => f.length > 0);
			if (action.length === 0) return;

			var target = {};
			if (type === 'page') {
				target.path = '/' + action.join('/');
			}
			else if (type === 'viewer' || type === 'folder') {
				target.path = '/category';
				target.query = {c: action.join(',')};
			}
			else if (type === 'article') {
				target.path = '/view';
				target.query = {f: action.last};
			}
			else if (type === 'action') {
				if (action[0] === 'color') {
					changeThemeColor(action[1]);
				}
				else if (action[0] === 'keyManager') {
					(new BroadcastChannel('setting')).postMessage({ action: 'KeyManager' });
				}
				return;
			}
			else {
				return;
			}
			var can_go = true, same_page = false;
			console.log(target);
			if (this.$route.path === target.path) {
				same_page = true;
				let c1 = !!this.$route.query ? (this.$route.query.c || this.$route.query.f || '') : '';
				let c2 = !!target.query ? (target.query.c || target.query.f || '') : '';
				if (c1 === c2) can_go = false;
			}
			if (can_go) {
				this.$router.push(target);
				if (same_page) (new BroadcastChannel('page-changed')).postMessage(target);
			}
		}
	}
}
</script>