<template>
	<Crumb />
	<div ref="menu" class="floatMenu" v-if="menuList.length>0">
		<i class="fas fa-bars"></i>
		<div class="menuFrame">
			<div v-for="item in menuList" class="menuItem"
				:read="item.read"
				:level="item.level"
				@click="gotoMenu(item.key)">{{item.title}}</div>
		</div>
	</div>
	<div ref="article" class="container" @click="onClick"></div>
	<div class="likeCoinArea" v-if="showLikeCoin">
		<iframe v-if="!!likecoin" :src="likecoin"></iframe>
	</div>
</template>

<script>
const chScroll = new BroadcastChannel('page-scroll');
const chChangeLoadingHint = new BroadcastChannel('change-loading-hint');
const CCLicenses = ['BY', 'SA', 'NC', 'ND'];
const LicensesContent = {
	BY: "署名",
	SA: "相同方式共享",
	NC: "非商业性使用",
	ND: "禁止演绎"
};

var current = null, timer;
chScroll.addEventListener('message', ({data}) => {
	if (!current) return;
	if (!!timer) {
		clearTimeout(timer);
	}
	timer = setTimeout(() => {
		if (!current) return;
		current.onScroll(data);
		timer = null;
	}, 100);
});

export default {
	name: 'Viewer',
	data () {
		return {
			likecoin: "",
			showLikeCoin: false,
			menuList: [],
			chapList: [],
			chapMap: {}
		}
	},
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
			if (isMU) tasks.push(Granary.getContent('/api/copyright.md'));
			var [content, copyright] = await Promise.all(tasks);

			var html = '', title = '', hasContent = true;
			if (!content) {
				hasContent = false;
				html = '<div class="page_not_found"><div class="frame"></div><div class="title">指定内容不存在，请联系站长。</div></div>';
			}
			else if (!!copyright && isMU) {
				if (!content.match(/(^ *#|\n *#)[ \t].+/)) {
					content = "# 正文\n\n" + content;
				}
				content = content + '\n\n\n' + copyright;
			}

			var markup;
			if (hasContent) {
				if (timestamp === 0) timestamp = Date.now();
				markup = await MarkUp.fullParse(content, {
					toc: true,
					glossary: isMU,
					resources: false,
					showtitle: true,
					showauthor: isMU,
					date: timestamp,
					classname: 'markup-content',
				});
				markup.meta.others = markup.meta.others || {};
				copyright = markup.meta.others.CopyRight;
				title = '《' + markup.title + '》';
				html = markup.content;
				if (!html) {
					html = '<div class="page_not_found"><div class="frame"></div><div class="title">MarkUp 内容解析失败，请联系作者。</div></div>';
					hasContent = false;
				}
			}
			this.$refs.article.innerHTML = html;
			if (hasContent) {
				await this.afterMarkUp();
				this.addLikeCoin(markup.meta.others.LikeCoin);
				this.refreshMenu(markup);
				if (!!copyright && isMU) {
					await wait();
					this.adjustCopyRight(copyright);
				}
			}
			else {
				this.showLikeCoin = false;
				this.likecoin = '';
				this.refreshMenu();
			}
			document.title = title + ' (' + this.SiteName + ')';

			chChangeLoadingHint.postMessage({
				action: 'hide'
			});
		},
		adjustCopyRight (copyright) {
			if (!copyright) return html;
			var licenses = [], version = "0";
			if (!copyright.match(/^ *cc *0(\.0)* *$/i)) {
				if (!copyright.match(/^ *(cc +)(\w+\-)*\w+( +(\d+\.)*\d) *$/i)) return;
				copyright = copyright.replace(/^ *cc +/i, '').replace(/ +$/, '').split(/ +/);
				version = copyright[1] || '4.0';
				if (version.indexOf('.') < 0) version = version + '.0';
				licenses = copyright[0].split('-').map(l => l.toUpperCase()).filter(l => CCLicenses.includes(l));
				licenses.sort((a, b) => b > a ? -1 : (b < a ? 1 : 0));
			}
			var crSection = null;
			this.$refs.article.querySelectorAll('section').forEach(sect => {
				var title = sect.querySelector('h1');
				if (!title) return;
				if (title.innerText !== '版权申明') return;
				crSection = sect;
			});

			var link = crSection.querySelector('p a');
			var content = crSection.querySelector('blockquote p');
			if (licenses.length === 0) {
				link.innerText = '公共领域许可（CC0）协议';
				link.href = "https://en.wikipedia.org/wiki/Creative_Commons_license#Zero_/_public_domain";
				content.innerHTML = '通过本协议，您的作品将不受限制地在全球范围内发布内容，您将法律允许范围内放弃一切权利。';
				let next = content.parentElement.nextSibling;
				next.parentElement.removeChild(next);
			}
			else if (licenses.includes('BY')) {
				link.innerText = '知识共享署名 4.0 国际许可（CC ' + licenses.join('-') + ' ' + version + '）协议';
				link.href = 'http://creativecommons.org/licenses/' + licenses.join('-').toLowerCase() + '/' + version + '/';
				content.innerHTML =
					"通过本协议，您可以<a href='https://en.wikipedia.org/wiki/Creative_Commons_license#Attribution' target='_blank'>分享并演绎本作品（创建派生内容）</a>，只要你遵守以下授权条款规定：" +
					licenses.map(l => '<strong>' + LicensesContent[l] + '</strong>').join('、')
					+ "。<br>具体内容请查阅上述协议声明。";
			}
			else {
				link.innerText = '知识共享 4.0 许可（CC ' + licenses.join('-') + ' ' + version + '）协议';
				link.href = 'https://en.wikipedia.org/wiki/Creative_Commons';
				content.innerHTML =
					"通过本协议，您可以<a href='https://en.wikipedia.org/wiki/Creative_Commons_license#Attribution' target='_blank'>分享并演绎本作品（创建派生内容）</a>，只要你遵守以下授权条款规定：" +
					licenses.map(l => '<strong>' + LicensesContent[l] + '</strong>').join('、')
					+ "。<br>具体内容请查阅上述协议声明。";
			}
		},
		addLikeCoin (likeCoin) {
			var available = true;
			if (!!this.LikeCoin && !!this.LikeCoin.forbidden && this.LikeCoin.forbidden.length > 0) {
				let host = ('.' + location.hostname + '.').replace(/\.+/g, '.');
				available = this.LikeCoin.forbidden.every(fb => {
					fb = ('.' + fb + '.').replace(/\.+/g, '.');
					return host.indexOf(fb) < 0;
				});
			}
			if (!available) {
				this.showLikeCoin = false;
				return;
			}

			if (!likeCoin) {
				if (!this.LikeCoin) {
					this.showLikeCoin = false;
					return;
				}
				if (String.is(this.LikeCoin)) likeCoin = this.LikeCoin;
				else likeCoin = this.LikeCoin.id;
			}

			if (!!likeCoin) {
				this.showLikeCoin = true;
				this.likecoin = "https://button.like.co/" + likeCoin;
			}
			else {
				this.likecoin = "";
			}
		},
		refreshMenu (markup) {
			this.menuList.clear();
			this.chapList.clear();
			for (let key in this.chapMap) {
				delete this.chapMap[key];
			}

			if (!markup) return;

			markup.chapList.forEach(chap => {
				this.menuList.push({
					level: chap[0] - 1,
					key: chap[1],
					title: chap[2],
					read: false
				});
				var chapEle = this.$refs.article.querySelector('a[name="' + chap[1] + '"]');
				if (!!chapEle) {
					this.chapList.push(chapEle);
					this.chapMap[chap[1]] = chapEle;
				}
			});
		},
		onScroll (option) {
			var limit = Devices.isMobile ? 0 : 25, index = 0, noLeft = true, delta = 0;
			if (option.total > option.height) {
				delta = option.top / (option.total - option.height);
				delta = (delta * delta) * option.height;
			}
			this.chapList.some((chap, i) => {
				var top = chap.getBoundingClientRect().top;
				top -= delta;
				if (top > limit) {
					noLeft = false;
					index = i;
					return true;
				}
			});
			if (index === 0 && noLeft) index = this.menuList.length

			for (let i = 0; i < this.menuList.length; i ++) {
				this.menuList[i].read = i < index;
			}
		},
		onClick (evt) {
			onVueHyperLinkTriggered(this, evt);
		},
		gotoMenu (menuKey) {
			var chap = this.chapMap[menuKey];
			if (!chap) return;
			var top = chap.getBoundingClientRect().top - (Devices.isMobile ? 5 : 30);
			app.scrollBy({top, behavior: 'smooth'});
			this.$refs.article.focus();
		}
	},
	async mounted () {
		current = this;
		await this.update();
		this.$refs.article.focus();
	},
	unmounted () {
		current = null;
	}
}
</script>