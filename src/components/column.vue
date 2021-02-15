<template>
	<section class="column">
		<div class="loading">载入中……</div>
	</section>
</template>

<script>
var currColumn = null;
const channel = new BroadcastChannel('page-changed');
channel.addEventListener('message', msg => {
	if (!currColumn) return;
	currColumn.update();
});

export default {
	name: "Column",
	methods: {
		async update () {
			var loading = this.$el.querySelector('div.loading');
			loading.innerHTML = '加载中……';
			loading.classList.remove('hide');

			var category = null;
			if (this.$route.path === '/') {
				category = '/';
			}
			else if (this.$route.path === '/category') {
				if (!!this.$route.query && !!this.$route.query.c) {
					category = '/' + this.$route.query.c.split(',').filter(c => c.length > 0).join('/');
				}
				else {
					loading.innerHTML = '本页无内容……';
					return;
				}
			}
			else {
				loading.innerHTML = '本页无内容……';
				return;
			}
			await Granary.get('category', category);
			
			loading.classList.add('hide');
		}
	},
	mounted () {
		currColumn = this;
		this.update();
	},
	destroyed () {
		currColumn = null;
		var loading = this.$el.querySelector('div.loading');
		loading.classList.remove('hide');
	}
}
</script>