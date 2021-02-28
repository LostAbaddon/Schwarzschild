<template>
	<div id="app">
		<NavBar/>
		<notifications class="notification" />
		<loading />
		<div id="container">
			<router-view/>
		</div>
		<div id="footnoteFrame"></div>
		<TailBar />
		<div class="masker" @click="onClick"></div>
	</div>
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