<template>
	<div class="viewer">
		<Crumb />
		<div class="container"></div>
	</div>
</template>

<script>
const chChangeLoadingHint = new BroadcastChannel('change-loading-hint');

export default {
	name: 'Viewer',
	methods: {
		async update () {
			chChangeLoadingHint.postMessage({
				name: '加载中……',
				action: 'show'
			});

			var article = this.$route.query.f, timestamp = this.$route.query.t;
			if (!article) {
				this.$router.push({path: '/'});
				return;
			}
			var [content, copyright] = await Promise.all([
				Granary.getArticle(article, timestamp),
				Granary.getArticle('copyright.md'),
			]);
			if (!!copyright) {
				content = content + '\n\n\n' + copyright;
			}

			var html = '<div>解析失败……</div>';
			if (!!content) {
				html = MarkUp.parse(content, {
					toc: true,
					glossary: true,
					resources: true,
					showtitle: true,
					showauthor: true,
					classname: 'markup-content',
				});
			}
			this.$el.querySelector('div.container').innerHTML = html;
			if (!!content) {
				MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
			}

			chChangeLoadingHint.postMessage({
				action: 'hide'
			});
		}
	},
	mounted () {
		this.update();
	}
}
</script>