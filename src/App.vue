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
	<div class="backer" :show="overscroll" @click="backTop"><i class="fas fa-angle-up"></i></div>
	<div ref="masker" class="masker" @click="onClick"></div>
</template>

<script>
export default {
	name: 'App',
	data () {
		return {
			overscroll: false
		}
	},
	mounted () {
		app.onscroll = this.onScroll;
	},
	methods: {
		onScroll () {
			if (app.scrollTop >= app.offsetHeight) {
				if (!this.overscroll) this.overscroll = true;
			}
			else {
				if (this.overscroll) this.overscroll = false;
			}
		},
		onClick () {
			this.$refs.masker.classList.remove('show');
		},
		backTop () {
			app.scrollBy({top: -app.scrollTop, behavior: 'smooth'});
		}
	}
}
</script>