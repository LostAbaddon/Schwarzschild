<template>
	<div class="viewer">
		<Crumb />
		<div class="container" @click="onClick"></div>
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

			var article = this.$route.query.f, timestamp = this.$route.query.t * 1;
			if (!article) {
				this.$router.push({path: '/'});
				return;
			}
			var isMU = !!article.match(/\.mu$/i);
			timestamp = timestamp || 0;
			var tasks = [Granary.getArticle(article, timestamp)];
			if (isMU) tasks.push(Granary.getContent('api/copyright.md'));
			var [content, copyright] = await Promise.all(tasks);

			var html = '', title = '', hasContent = true;
			if (!content) {
				hasContent = false;
				html = '<div class="page_not_found"><div class="frame"></div><div class="title">指定内容不存在，请联系站长。</div></div>';
			}
			else if (!!copyright && isMU) {
				content = content + '\n\n\n' + copyright;
			}

			if (hasContent) {
				if (timestamp === 0) timestamp = Date.now();
				let markup = MarkUp.fullParse(content, {
					toc: true,
					glossary: isMU,
					resources: false,
					showtitle: true,
					showauthor: isMU,
					date: timestamp,
					classname: 'markup-content',
				});
				title = ' | ' +  markup.title;
				html = markup.content;
				if (!html) {
					html = '<div class="page_not_found"><div class="frame"></div><div class="title">MarkUp 内容解析失败，请联系作者。</div></div>';
					hasContent = false;
				}
			}
			this.$el.querySelector('div.container').innerHTML = html;
			if (hasContent) {
				await this.afterMarkUp();
			}
			document.title = title + ' (' + this.SiteName + ')';

			chChangeLoadingHint.postMessage({
				action: 'hide'
			});
		},
		onClick (evt) {
			onVueHyperLinkTriggered(this, evt);
		}
	},
	mounted () {
		this.update();
	}
}
</script>