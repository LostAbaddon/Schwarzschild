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
	<div class="container likehoods" v-if="likehoods.length>0">
		<article class="markup-content">
			<hr class="endnote-line">
			<section class="endnote-chapter">
				<h1 class="endnote-title">随机推荐</h1>
				<ul>
					<li v-for="item in likehoods" @click="gotoArticle(item[0])"><p class="endnote-content">{{item[1]}}</p></li>
				</ul>
			</section>
		</article>
	</div>
	<div class="likeCoinArea" v-if="showLikeCoin">
		<iframe v-if="!!likecoin" :src="likecoin"></iframe>
	</div>
	<div class="shareArea" v-if="showSharing">
		<span @click="shareMe">分享本页</span>
	</div>
	<div class="passwordInputter" :show="showPassword">
		<div class="title">请输入 IV 码：</div>
		<input ref="ivinputter" @keydown="onEnter">
		<button @click="submitIV">确定</button>
	</div>
</template>

<script>
const CCLicenses = ['BY', 'SA', 'NC', 'ND'];
const LicensesContent = {
	BY: "署名",
	SA: "相同方式共享",
	NC: "非商业性使用",
	ND: "禁止演绎"
};

var current = null, timer, lastIVRequest, copyrightContent = null;
PageBroadcast.on('page-scroll', (data) => {
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
PageBroadcast.on('page-changed', async () => {
	await wait();
	if (!current) return;
	current.update();
});
const onSourceUpdated = msg => {
	if (!current) return;
	var cancel = current.updateCloudArticle(msg.target);
	if (cancel) PageBroadcast.emit('source-updated-cancel-reload');
};
PageBroadcast.on('source-updated', msg => {
	onSourceUpdated(msg);
});

export default {
	name: 'Viewer',
	data () {
		return {
			likecoin: "",
			showLikeCoin: false,
			menuList: [],
			chapList: [],
			chapMap: {},
			showPassword: false,
			likehoods: [],
			showSharing: !!navigator.share,
			articleID: '',
			articleTitle: '',
		}
	},
	methods: {
		async update () {
			PageBroadcast.emit('change-loading-hint', {
				name: '加载中……',
				action: 'show'
			});

			var article = this.$route.query.f, type = 0;
			if (!article) {
				article = this.$route.query.l;
				if (!!article) {
					type = 1;
					article = article.split('/').last;
				}
			}
			if (!article) {
				this.$router.push({path: '/'});
				return;
			}

			await this.loadArticle(article, type);

			PageBroadcast.emit('change-loading-hint', {action: 'hide'});
		},
		async updateEdgeArticle (aid) {
			var id = (this.$route.query.l || '').split('/').last;
			if (id !== aid) return;

			PageBroadcast.emit('change-loading-hint', {
				action: 'show', title: '更新中...'
			});

			await this.loadArticle(id, 1);

			PageBroadcast.emit('change-loading-hint', {action: 'hide'});
		},
		updateCloudArticle (source) {
			var shouldRefresh = (source === 'SOURCE') || (source === '/' + this.$route.query.f);
			if (!shouldRefresh) {
				return !!source.match(/\.e?m[du]$/i);
			}

			if (source !== 'SOURCE') {
				notify({
					title: "本页有更新",
					duration: 1500,
					type: "info"
				});
				PageBroadcast.emit('change-loading-hint', {
					name: '更新中……',
					action: 'show'
				});
			}
			this.loadArticle(this.$route.query.f, 0, true).then(() => {
				if (source !== 'SOURCE') {
					PageBroadcast.emit('change-loading-hint', {action: 'hide'});
					notify({
						title: "本页有更新",
						message: "已自动更新内容",
						duration: 3000,
						type: "success"
					});
				}
			});

			return true;
		},
		async loadArticle (articleID, articleType=0, savePosition=false) {
			var isCloud = articleType === 0;
			var isEdge = articleType === 1;
			this.articleID = articleID;

			this.likehoods.splice(0);

			var isMU = !isCloud || !!articleID.match(/\.e?mu$/i);
			var isEncrypt = isCloud && !!articleID.match(/\.em[ud]$/i);
			if (isEncrypt && (!window.crypto || !window.crypto.getRandomValues
				|| !window.crypto.subtle || !window.crypto.subtle.encrypt || !window.crypto.subtle.decrypt)) {
				this.showLikeCoin = false;
				this.menuList.clear();
				this.$refs.article.innerText = '<article class="markup-content"><section><p>您的浏览器不支持<span class="english">WebCrypto</span>模块功能，请换用现代浏览器！</p></section></article>';
				return;
			}

			var timestamp = (this.$route.query.t * 1) || 0;
			var tasks = [];

			if (isCloud) tasks.push(Granary.getArticle(articleID, timestamp));
			else if (isEdge) tasks.push(BookShelf.getArticle(articleID));

			if (isMU) {
				if (!!copyrightContent) tasks.push((async () => copyrightContent)());
				else tasks.push(Granary.getContent('/data/copyright.md'));
			}

			var [content, copyright] = await Promise.all(tasks);
			if (!isCloud) content = content.content;
			if (!copyrightContent && !!copyright) copyrightContent = copyright;

			if (isEncrypt) {
				content = await this.decrypt(content);
				if (!content && !!lastIVRequest) {
					return;
				}
			}

			var html = '', title = '', hasContent = true;
			if (!content) {
				hasContent = false;
				html = '<div class="page_not_found"><div class="frame"></div><div class="title">指定内容不存在，请联系站长。</div></div>';
			}
			else if (!!copyright && isMU) {
				if (!content.match(/(^ *#|\n *#)[ 　\t]*.+/)) {
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
				this.articleTitle = markup.title;
				html = markup.content;
				if (!html) {
					html = '<div class="page_not_found"><div class="frame"></div><div class="title">MarkUp 内容解析失败，请联系作者。</div></div>';
					hasContent = false;
				}
			}
			var container = document.querySelector('#app');
			var position = !!container ? container.scrollTop : 0;
			this.$refs.article.innerHTML = html;
			if (hasContent) {
				this.afterMarkUp();
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
			if (isEdge) {
				let header = this.$refs.article.children.item(0);
				if (!!header) header = header.children.item(0);
				if (!!header) header = header.nextSibling;
				if (!!header) {
					let info = newEle('section', 'localAlert');
					info.innerHTML = '这是存储在浏览器本地的文件，其它设备与用户无法看到本页内容！';
					header.parentElement.insertBefore(info, header);
				}
			}
			if (isCloud) {
				this.getLikely(articleID);
			}

			if (!!container && savePosition) container.scrollTo(0, position);

			window.PageInfo = window.PageInfo || {};
			window.PageInfo.title = title;
			if (isCloud) window.PageInfo.url = this.$route.query.f;
			else if (isEdge) window.PageInfo.url = 'l=' + this.$route.query.l;
			PageBroadcast.emit('memory-updated', {
				type: 'history',
				title,
				url: window.PageInfo.url
			});
		},
		async getLikely (articleID) {
			var list = await DataCenter.findLikelyArticle(articleID);
			this.likehoods.push(...list.map(item => [item[0], item[1]]));
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
		},
		gotoArticle (article) {
			var target = {
				path: '/view',
				query: { f: article }
			};
			this.$router.push(target);
			PageBroadcast.emit('page-changed', target);
		},
		requestIVWord () {
			return new Promise(res => {
				var lastRes = lastIVRequest;
				lastIVRequest = res;
				if (!!lastRes) {
					lastRes(null);
				}
				this.showPassword = true;
			});
		},
		onEnter (evt) {
			if (evt.keyCode === 13) this.submitIV();
		},
		submitIV () {
			var iv = this.$refs.ivinputter.value;
			if (!iv) {
				notify({
					type: "warn",
					title: "IV 码不能为空"
				});
				return;
			}
			var code;
			try {
				code = base64tobuffer(iv);
			}
			catch (err) {
				notify({
					type: "error",
					duration: 2000,
					title: "无效IV码"
				});
			}

			var res = lastIVRequest;
			lastIVRequest = null;
			this.showPassword = false;
			res([code, iv]);
		},
		async decrypt (content) {
			var key = localStorage.getItem('CurrentKey');
			if (!key) {
				notify({
					type: "error",
					duration: 2000,
					title: "密钥丢失",
					message: '请在“设置/密钥管理”中选择或添加密钥'
				});
				return '';
			}
			try {
				key = base64tobuffer(key);
				key = await window.crypto.subtle.importKey("raw", key, "AES-GCM", true, ["encrypt", "decrypt"]);
			}
			catch (err) {
				notify({
					type: "error",
					duration: 2000,
					title: "密钥损坏",
					message: '解码密钥失败，请在“设置/密钥管理”中选择或添加可用密钥'
				});
				return '';
			}

			var keyMap = localStorage.get('EncryptedContentKeys', {});
			var iv, code;
			code = keyMap[this.$route.query.f];
			if (!!code) {
				iv = base64tobuffer(code);
			}
			else {
				[iv, code] = await this.requestIVWord();
				if (iv === null) {
					return '';
				}
			}

			content = base64tobuffer(content);
			if (!content) {
				notify({
					title: "BASE64 内容解码失败！",
					duration: 2000,
					type: "error"
				});
				return '';
			}
			try {
				content = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv}, key, content);
			}
			catch (err) {
				notify({
					type: "error",
					duration: 2000,
					title: "密钥或IV码错误",
					message: '请在“设置/密钥管理”中选择或添加正确的密钥，或换一个IV码重试。'
				});
				return "";
			}
			try {
				content = (new TextDecoder()).decode(content);
			}
			catch (err) {
				notify({
					title: "内容解码失败！",
					duration: 2000,
					type: "error"
				});
				return "";
			}

			// 记录已成功使用的密钥与IV码
			keyMap[this.$route.query.f] = code;
			localStorage.set('EncryptedContentKeys', keyMap);

			return content;
		},
		async shareMe () {
			var share = {
				title: this.articleTitle,
				text: '',
				url: location.origin + location.pathname + '#/view?f=' + this.articleID,
			};
			var nodes = this.$refs.article.querySelectorAll('article > section');
			nodes = [].map.call(nodes, n => n);
			nodes = nodes.filter(n => !n.querySelector('h1[name="ContentTable"]') && !n.classList.contains('endnote-chapter'));
			nodes = nodes.map(n => {
				var ns = [].map.call(n.childNodes, n => n);
				ns = ns.filter(n => !n.tagName.match(/h(\d|r)/i));
				return ns;
			});
			nodes = nodes.flat().map(n => n.innerText).join('\n');
			nodes = nodes.replace(/[\n\t\r　 ]+/g, ' ');
			if (nodes.length > 150) nodes = nodes.substr(0, 148) + '……';
			share.text = nodes;
			try {
				share = await navigator.share(share);
				notify({
					title: "分享成功",
					duration: 1500,
					type: "success"
				});
			}
			catch (err) {
				console.error(err);
				notify({
					title: "分享失败",
					duration: 2500,
					type: "error"
				});
			}
		},
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