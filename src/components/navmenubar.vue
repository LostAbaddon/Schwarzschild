<template>
	<nav class="nav-menu-bar">
		<NavMenuItem v-for="item in menu" :title="item[0]" :action="item[1]" :subs="item[2]" />
	</nav>
</template>

<script>
export default {
	name: 'NavMenuBar',
	props: {
		menu: Array
	}
}
</script>