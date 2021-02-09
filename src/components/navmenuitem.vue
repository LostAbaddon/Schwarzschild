<template>
	<div class="nav-menu-item">
		<router-link :to="action">{{title}}<font-awesome-icon icon="caret-down" class="nav-fa" v-if="!!subs" /></router-link>
		<NavMenuBar v-if="!!subs" :menu="subs" />
	</div>
</template>

<script>
export default {
	name: 'NavMenuItem',
	props: {
		title: String,
		action: String,
		subs: Array
	}
}
</script>