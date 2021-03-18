<template>
	<section class="column container" @click="onClick">
		<header ref="header"></header>
		<caption v-if="showList">
			<span>文章列表</span>
			<div class="controller">
				<div class="hint"><i class="fas fa-sliders-h"></i></div>
				<div class="styleList">
					<div class="styleItem" name="bars"><i class="fas fa-bars"></i></div>
					<div class="styleItem" name="lines"><i class="fas fa-stream"></i></div>
					<div class="styleItem" name="columns"><i class="fas fa-columns"></i></div>
				</div>
			</div>
		</caption>
		<ColumnItem v-if="showList" v-for="article in list"
			:title="article.title"
			:author="article.author"
			:description="article.description"
			:type="article.type"
			:timemark="article.timemark"
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
			showList: true,
		}
	},
	methods: {
		async getHeaderInfo (category) {
			var info = await Granary.getColumnHeader(category);
			var content = '';
			if (!!info) {
				content = await MarkUp.parse(info, {
					toc: false,
					glossary: false,
					resources: false,
					showtitle: false,
					showauthor: false,
					classname: 'markup-content',
				});
			}
			this.$refs.header.innerHTML = content;
			if (!!info) {
				await this.afterMarkUp();
			}
		},
		async getArticleList (category) {
			var articles = await Granary.getCategory(category);
			this.list.splice(0, this.list.length);
			articles.forEach((art) => {
				art.category = getName(art.sort);
				art.placehoding = false;
				art.timestamp = (new Date(art.publish)).getTime();
				art.timemark = getTimeString(new Date(art.publish), "YYMMDDhhmm");
				art.description = art.description || '暂无';
				this.list.push(art);
			});
		},
		async update () {
			chChangeLoadingHint.postMessage({
				name: '加载中……',
				action: 'show'
			});

			var style = localStorage.getItem('columnStyle') || 'lines';
			this.$el.setAttribute('columnStyle', style);

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
					chChangeLoadingHint.postMessage({action: 'hide'});
					return;
				}
			}
			else {
				chChangeLoadingHint.postMessage({action: 'hide'});
				return;
			}
			category = category.replace(/^[\/\\]+/, '');

			var cateList = category.split('/').filter(c => c.length > 0);
			var cateType = SiteMap;
			if (cateList.length > 0) {
				cateList.some(cate => {
					cate = cateType[cate];
					if (!!cate.subs && cate.subs.length > 0) {
						cateType = cate.subs;
					}
					else {
						cateType = cate.type;
						return true;
					}
				});
			}
			else {
				cateType = 'viewer';
			}

			if (cateType === 'folder') {
				this.showList = false;
				await this.getHeaderInfo(category);
			}
			else if (cateType === 'viewer') {
				this.showList = true;
				await Promise.all([this.getHeaderInfo(category), this.getArticleList(category)]);
			}
			else {
				this.showList = false;
			}

			chChangeLoadingHint.postMessage({action: 'hide'});
		},
		onClick (evt) {
			var ele = findContentWrapper(evt.target);
			if (!ele) return;

			if (ele.classList.contains('hint')) {
				return;
			}
			else if (ele.classList.contains('styleItem')) {
				let name = ele.getAttribute('name');
				this.$el.setAttribute('columnStyle', name);
				localStorage.setItem('columnStyle', name);
				return;
			}
			else if (ele.nodeName.toLowerCase() === 'a') {
				if (onVueHyperLinkTriggered(this, evt)) return;
			}
			var filename = undefined, category = undefined, timestamp = undefined;
			if (!ele) return;
			while (!filename && !category) {
				filename = ele.getAttribute('filename');
				category = ele.getAttribute('path');
				timestamp = ele.getAttribute('timestamp') * 1;
				ele = ele.parentNode;
				if (!ele || ele === document.body) break;
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
	unmounted () {
		currColumn = null;
	}
}
</script>