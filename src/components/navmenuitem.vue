<template>
	<div class="nav-menu-item">
		<a @click="click(type, action)">{{title}}<font-awesome-icon icon="caret-down" class="nav-fa" v-if="!!subs" /></a>
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
			if (type === 'page') {
				if (action.length > 0) {
					let target = '/' + action.last;
					let currentPath = location.pathname, currentSearch = location.search;
					if (target !== currentPath || !!currentSearch) this.$router.push({path: target});
				}
			}
			else if (type === 'viewer') {
				let currentPath = location.pathname, currentSearch = location.search;
				let query = action.join(',');
				let target = '?q=' + query;
				if (currentPath !== '/category' || currentSearch !== target) this.$router.push({path: "/category", query: { q: query }});
			}
		}
	}
}
</script>