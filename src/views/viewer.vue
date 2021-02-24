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

			var article = this.$route.query.f, timestamp = this.$route.query.t * 1, author = this.$route.query.a || 'LostAbaddon';
			if (!article) {
				this.$router.push({path: '/'});
				return;
			}
			timestamp = timestamp || 0;
			var [content, copyright] = await Promise.all([
				Granary.getArticle(article, timestamp),
				Granary.getArticle('copyright.md'),
			]);

			var html = '', hasContent = true;
			if (!content) {
				hasContent = false;
				html = '<div class="page_not_found"><div class="frame"></div><div class="title">指定内容不存在，请联系站长。</div></div>';
			}
			else if (!!copyright) {
				content = content + '\n\n\n' + copyright;
			}

			if (hasContent) {
				if (timestamp === 0) timestamp = Date.now();
				html = MarkUp.parse(content, {
					toc: true,
					glossary: true,
					resources: false,
					showtitle: true,
					showauthor: true,
					author,
					date: timestamp,
					classname: 'markup-content',
				});
				if (!html) {
					html = '<div class="page_not_found"><div class="frame"></div><div class="title">MarkUp 内容解析失败，请联系作者。</div></div>';
					hasContent = false;
				}
			}
			this.$el.querySelector('div.container').innerHTML = html;
			if (hasContent) {
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