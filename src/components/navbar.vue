<template>
	<div class="nav-bar">
		<router-link to="/">首页</router-link>
		<font-awesome-icon icon="caret-right" />
		<NavMenuBar :menu="menu" />
	</div>
</template>

<script>
export default {
	name: 'NavBar',
	data () {
		return {
			menu: ["site-menu"]
		}
	},
}
</script>