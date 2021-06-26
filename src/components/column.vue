<template>
	<section ref="main" class="column container" @click="onClick" @mousewheel="onScroll">
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
			:redirect="article.target"
		/>
	</section>
	<div ref="loadingHint" class="column-loading hidden">加载中……</div>
</template>

<script>
import ColumnItem from '@/components/columnItem.vue';

const getTimeString = _('Utils').getTimeString;
var currColumn = null;
PageBroadcast.on('page-changed', async () => {
	await wait();
	if (!currColumn) return;
	currColumn.update();
});
PageBroadcast.on('page-scroll', () => {
	if (!currColumn) return;
	currColumn.onScroll();
});

export default {
	name: "Column",
	components: {ColumnItem},
	data () {
		return {
			itemPerPage: 20,
			list: [],
			showList: true,
			currentCategory: '',
			currentPage: 0,
			countPerPage: 10,
			noMoreItem: false,
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
			this.$refs.loadingHint.classList.remove('hidden');
			this.list.splice(this.currentPage * this.countPerPage, this.list.length);
			var articles = await Granary.getCategory(category, this.currentPage);
			articles.forEach((art) => {
				var sort = art.sort;
				if (sort[0] !== '/') sort = '/' + sort;
				art.category = CatePathMap[sort] || sort;
				art.placehoding = false;
				art.timestamp = (new Date(art.publish)).getTime();
				art.timemark = getTimeString(new Date(art.publish), "YYMMDDhhmm");
				art.description = art.description || '暂无';
				this.list.push(art);
			});
			this.noMoreItem = articles.length < this.countPerPage;
			this.$refs.loadingHint.classList.add('hidden');
		},
		async update () {
			PageBroadcast.emit('change-loading-hint', {
				name: '加载中……',
				action: 'show'
			});

			var style = localStorage.getItem('columnStyle') || 'lines';
			this.$refs.main.setAttribute('columnStyle', style);

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
					PageBroadcast.emit('change-loading-hint', {action: 'hide'});
					return;
				}
			}
			else {
				PageBroadcast.emit('change-loading-hint', {action: 'hide'});
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
				this.currentCategory = category;
				this.currentPage = 0;
				this.showList = true;
				await Promise.all([this.getHeaderInfo(category), this.getArticleList(category)]);
			}
			else {
				this.showList = false;
			}

			PageBroadcast.emit('change-loading-hint', {action: 'hide'});
		},
		onClick (evt) {
			var ele = findContentWrapper(evt.target);
			if (!ele) return;

			if (ele.classList.contains('hint')) {
				return;
			}
			else if (ele.classList.contains('styleItem')) {
				let name = ele.getAttribute('name');
				this.$refs.main.setAttribute('columnStyle', name);
				localStorage.setItem('columnStyle', name);
				return;
			}
			else if (ele.nodeName.toLowerCase() === 'a') {
				if (onVueHyperLinkTriggered(this, evt)) return;
			}
			var filename = undefined, category = undefined, timestamp = undefined, type = "article";
			if (!ele) return;
			while (!filename && !category) {
				filename = ele.getAttribute('redirect');
				if (!!filename) {
					type = 'redirect';
				}
				else {
					type = ele.getAttribute('type');
					filename = ele.getAttribute('filename');
				}
				category = ele.getAttribute('path');
				timestamp = ele.getAttribute('timestamp') * 1;
				ele = ele.parentNode;
				if (!ele || ele === document.body) break;
			}
			if (!!category) {
				this.$router.push({path: '/category', query: {c: category.split(/[\\\/]+/).join(',')}});
				if (this.$route.name === 'Category') {
					PageBroadcast.emit('page-changed', category);
				}
			}
			else if (!!filename) {
				if (type === 'local') this.$router.push({path: '/view', query: {l: filename}});
				else this.$router.push({path: '/view', query: {f: filename}});
			}
		},
		onScroll (evt) {
			if (!!this.tmrScroll) {
				clearTimeout(this.tmrScroll);
				this.tmrScroll = null;
			}
			this.tmrScroll = setTimeout(() => this.doScroll(), 100);
		},
		doScroll () {
			if (!!this.tmrScroll) {
				clearTimeout(this.tmrScroll);
				this.tmrScroll = null;
			}
			if (this.noMoreItem) return;
			var ele = this.$refs.loadingHint;
			var top = ele.getBoundingClientRect().top;
			var limit = document.body.getBoundingClientRect().height + 250;
			if (top > limit) return;
			this.currentPage ++;
			this.getArticleList(this.currentCategory);
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