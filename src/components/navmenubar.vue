<template>
	<nav class="nav-menu-bar">
		<NavMenuItem v-for="item in menu" :title="item.name" :action="(!!item.category&&item.category.length>0)?(!!supers?(supers+','+item.category):item.category):''" :type="item.type" :subs="item.subs" :disabled="item.disabled" />
	</nav>
</template>

<script>
export default {
	name: 'NavMenuBar',
	props: {
		supers: "",
		menu: Array
	}
}
</script>