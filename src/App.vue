<template>
	<NavBar/>
	<loading />
	<Notification hAlign="right" vAlign="top" />
	<ImageShowcase />
	<div id="container">
		<router-view/>
	</div>
	<div id="footnoteFrame"></div>
	<TailBar />
	<div class="masker" @click="onClick"></div>
</template>

<script>
export default {
	name: 'App',
	methods: {
		onClick () {
			document.querySelector('.masker').classList.remove('show');
		}
	}
}
</script>