<template>
	<div class="home">
		<HelloWorld title="Welcome to LostAbaddon's Death Foreseer Society!" msg="The world is waiting for its light, please WAIT for a while..."/>
	</div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'

export default {
	name: 'Home',
	components: {
		HelloWorld
	}
}
</script>
