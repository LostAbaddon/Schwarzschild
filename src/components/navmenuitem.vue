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
			action = action.split(',');
			if (type === 'page') {
				console.log(action.last);
			}
			console.log(type, action);
		}
	}
}
</script>