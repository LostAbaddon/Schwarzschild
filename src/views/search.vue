<template>
	<Crumb />
	<div class="searchPage controller">
		<span ref="searchCommand" class="keywords" contenteditable=true @keydown.enter="active"></span>
		<span class="button" @click="active"><i class="fa fas fa-search"></i>搜索</span>
	</div>
	<div class="searchPage articleList">
		<div class="title">本地与云端</div>
		<div class="hint" v-if="result.length===0">无</div>
		<div class="article" v-for="item in result" @click="openArticle(item)">{{item.title}} （匹配度：{{item.score}}）</div>
		<div class="title">边缘搜索（<span>{{edgeCount}}</span>）</div>
		<div class="hint" v-if="remote.length===0">无</div>
		<div class="article" v-for="item in remote" @click="openArticle(item)">{{item.title}} （匹配度：{{item.score}}）</div>
	</div>
	<div class="searchPage commandPad">
		<div class="title">搜索命令</div>
		<div class="command">T(*)：标题条件</div>
		<div class="command">C(*)：正文条件（默认）</div>
		<div class="command">K(*)：关键词条件</div>
		<div class="command">reg(*)：采用正则表达式</div>
		<div class="command">+：条件或</div>
		<div class="command">*：条件与</div>
		<div class="command">-：扣除</div>
		<div class="title">注意事项</div>
		<div class="command">本搜索对本地文库中内容可以进行本地全文搜索，但对云端内容，则只有缓存下来的内容（也即浏览过的内容）才能进行本地全文搜索，否则只会对摘要部分搜索。</div>
	</div>
</template>

<script>
export default {
	name: 'Search',
	data () {
		return {
			result: [],
			remote: [],
			edgeCount: 0
		}
	},
	mounted () {
		PageBroadcast.emit('change-loading-hint', {
			action: 'hide'
		});
		this.$refs.searchCommand.focus();
	},
	methods: {
		active (evt) {
			evt.preventDefault();
			var command = this.$refs.searchCommand.innerText;
			if (!command) {
				notify({
					title: "无法执行空查询",
					duration: 2000,
					type: "error"
				});
				this.$refs.searchCommand.focus();
				return;
			}
			this.search(command);
		},
		async search (command) {
			PageBroadcast.emit('change-loading-hint', {
				action: 'show',
				title: '搜索中……'
			});

			console.log('Search: ' + command);
			var list = await DataCenter.searchArticle(command);
			if (list instanceof Error) {
				PageBroadcast.emit('change-loading-hint', {
					action: 'hide'
				});
				console.error(list);
				notify({
					title: list.message,
					duration: 5000,
					type: "error"
				});
				return;
			}
			if (!!window.gtag) {
				gtag('event', 'search', {
					'send_to': gaid,
					'search_term': command
				});
			}

			this.result.splice(0, this.result.length, ...list.match);
			notify({
				title: '本次搜索用时: ' + list.timeused + 'ms',
				duration: 2000,
				type: "success"
			});

			PageBroadcast.emit('change-loading-hint', {
				action: 'hide'
			});
		},
		openArticle (article) {
			var url = location.href.split('#')[0] + '#/view?';
			if (article.type === 'cloud') {
				url += 'f=' + article.url.replace(/^\//, '');
			}
			else {
				url += 'l=' + article.url;
			}
			var win = window.open(url);
			win.focus();
		},
	},
}
</script>