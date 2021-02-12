<template>
	<div class="nav-menu-item">
		<a @click="click(type, action)">{{title}}<i class="fas fa-caret-down" v-if="!!subs" /></a>
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
			else if (type === 'viewer') {
				target.path = '/category';
				target.query = {c: action.join(',')};
			}
			else {
				return;
			}
			var can_go = true;
			if (this.$route.path === target.path) {
				let c1 = !!this.$route.query ? (this.$route.query.c || '') : '';
				let c2 = !!target.query ? (target.query.c || '') : '';
				if (c1 === c2) can_go = false;
			}
			if (can_go) this.$router.push(target);
		}
	}
}
</script>