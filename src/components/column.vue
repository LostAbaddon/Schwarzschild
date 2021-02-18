<template>
	<section class="column container" @click="onClick">
		<header v-if="header" class="markup"><pre>{{header}}</pre></header>
		<caption><span>文章列表</span></caption>
		<ColumnItem v-for="article in list"
			:title="article.title"
			:author="article.author"
			:description="article.description"
			:type="article.type"
			:timestamp="article.timestamp"
			:categoryName="article.category"
			:categoryPath="article.sort"
			:filename="article.filename"
		/>
	</section>
</template>

<script>
import ColumnItem from '@/components/columnItem.vue';

const getTimeString = _('Utils').getTimeString;
var currColumn = null;
const chPageChanged = new BroadcastChannel('page-changed');
chPageChanged.addEventListener('message', msg => {
	if (!currColumn) return;
	currColumn.update();
});
const chChangeLoadingHint = new BroadcastChannel('change-loading-hint');

const nameMap = new Map();
const getName = path => {
	var name = nameMap.get(path);
	if (!!name) return name;
	var m = SiteMap;
	name = null;
	path = path.split(/[\\\/]/).filter(p => p.length > 0);
	path.some((p, i) => {
		var entry = m[p];
		if (!entry) return true;
		m = entry.subs;
		if (i === path.length - 1) name = entry.name;
	});
	if (!!name) {
		nameMap.set(path, name);
		return name;
	}
	return path.last;
};

export default {
	name: "Column",
	components: {ColumnItem},
	data () {
		return {
			itemPerPage: 20,
			list: [],
			header: ''
		}
	},
	methods: {
		async getHeaderInfo (category) {
			var info = await Granary.getColumnHeader(category);
			console.log(info);
		},
		async getArticleList (category) {
			var articles = await Granary.getCategory(category);
			articles.forEach((art) => {
				art.category = getName(art.sort);
				art.placehoding = false;
				art.timestamp = getTimeString(new Date(art.publish), "YYMMDDhhmm");
				art.description = art.description || '暂无';
				this.list.push(art);
			});
			chChangeLoadingHint.postMessage({action: 'hide'});
		},
		async update () {
			chChangeLoadingHint.postMessage({
				name: '加载中……',
				action: 'show'
			});
			this.list.splice(0, this.list.length);
			this.header = '';

			var category = null;
			if (this.$route.path === '/') {
				category = '/';
			}
			else if (this.$route.path === '/category') {
				if (!!this.$route.query && !!this.$route.query.c) {
					category = '/' + this.$route.query.c.split(',').filter(c => c.length > 0).join('/');
				}
				else {
					chChangeLoadingHint.postMessage({name: '本页无内容……'});
					return;
				}
			}
			else {
				chChangeLoadingHint.postMessage({name: '本页无内容……'});
				return;
			}
			category = category.replace(/^[\/\\]+/, '');

			await Promise.all([this.getHeaderInfo(category), this.getArticleList(category)]);
		},
		onClick (evt) {
			var filename = undefined, category = undefined, timestamp = undefined, ele = evt.target;
			while (!filename && !category) {
				filename = ele.getAttribute('filename');
				category = ele.getAttribute('path');
				timestamp = ele.getAttribute('timestamp');
				ele = ele.parentNode;
				if (!ele) break;
			}
			if (!!category) {
				let path = '/category?c=' + category.split('/').join(',');
				if (this.$route.fullPath !== path) {
					this.$router.push({path});
				}
			}
			else if (!!filename) {
				this.$router.push({path: '/view', query: {f: filename, t: timestamp}});
			}
		}
	},
	mounted () {
		currColumn = this;
		this.update();
	},
	destroyed () {
		currColumn = null;
	}
}
</script>