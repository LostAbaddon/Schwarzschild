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
	</div>
</template>

<script>
</script>