<template>
	<div class="nav-bar">
		<div class="nav-hint" @click="toggleHint"><i class="fas fa-angle-right" /></div>
		<div class="nav-docker">
			<a @click="backHome">首页</a>
			<i class="fas fa-caret-right" />
			<div class="nav-container">
				<NavMenuBar :menu="menu" />
			</div>
			<div class="about-bar nav-container right">
				<NavMenuBar :menu="aboutMenu" />
			</div>
		</div>
	</div>
</template>

<script>
const generateSiteMap = menu => {
	var map = {};
	menu.forEach(m => {
		var item = { "name": m.name, "type": m.type };
		if (!!m.subs) item.subs = generateSiteMap(m.subs);
		map[m.category] = item;
	});
	return map;
};
global.getPathNameList = (path, needHome=true) => {
	if (!global.SiteMap) return null;
	var map = global.SiteMap, reqs = [], result = [];
	path.some((p, i) => {
		if (!map) return true;
		var entry = map[p];
		if (!entry) return true;
		var item = { name: entry.name };
		reqs.push(p);
		if (entry.type === 'page') {
			item.path = '/' + reqs.join('/');
		}
		else if (entry.type === 'viewer' || entry.type === 'view' || entry.type === 'folder') {
			item.path = '/category';
			item.query = {c:reqs.join(',')};
		}
		map = entry.subs;
		result.push(item);
	});
	if (needHome) result.unshift({ name: "首页", path: '/' });
	return result;
};
var current;
(new BroadcastChannel('route-updated')).addEventListener('message', ({data}) => {
	if (!!current) current.disableFavoriteAction();
});
(new BroadcastChannel('memory-updated')).addEventListener('message', ({data}) => {
	var name, append = true;
	if (data.type === 'history') {
		name = 'memory/history';
	}
	else if (data.type === 'favorite') {
		name = 'memory/favorite';
	}
	else if (data.type === 'unfavorite') {
		name = 'memory/favorite';
		append = false;
	}
	else {
		return;
	}

	var list = localStorage.get(name, []);
	var index = -1;
	list.some((item, i) => {
		if (item[1] !== data.url) return;
		index = i;
		return true;
	});
	if (index >= 0) {
		list.splice(index, 1);
	}
	if (append) {
		list.unshift([data.title, data.url]);
		if (list.length > 10) {
			list.splice(10, list.length - 10);
		}
	}
	localStorage.set(name, list);

	if (!!current) current.updateMemory();
});

export default {
	name: 'NavBar',
	data () {
		return {
			menu: ["site-menu"],
			aboutMe: "[:site-about-me:]",
			aboutMenu: [
				{
					name: '收藏',
					type: 'action',
					category: 'addFavorite',
					disabled: true
				},
				{
					name: '配色',
					type: 'action',
					category: 'color',
					subs: ["theme-list"]
				},
				{
					name: '设置',
					type: 'page',
					category: '',
					subs: [
						{
							name: '秘钥管理',
							type: 'action',
							category: 'keyManager',
						},
						{
							name: '本站',
							type: 'page',
							category: 'about'
						},
					]
				},
			],
			memoryMenu: {
				name: '记忆宫殿',
				type: 'page',
				category: '',
				subs: [
					{
						name: '收藏夹',
						type: 'page',
						category: '',
						subs: []
					},
					{
						name: '浏览历史',
						type: 'page',
						category: '',
						subs: []
					}
				]
			},
		}
	},
	mounted () {
		current = this;

		if (!!this.aboutMe) {
			this.aboutMenu[2].subs[1] = {
				name: '关于',
				type: 'page',
				category: '',
				subs: [this.aboutMenu[2].subs[1]]
			};
			this.aboutMenu[2].subs[1].subs.unshift({
				name: '本站',
				type: 'page',
				category: this.aboutMe
			});
			this.aboutMenu[2].subs[1].subs[1].name = '系统';
		}
		else {
			this.aboutMenu[2].subs[1].name = '关于';
		}
		if (memoryMode === 1) {
			this.memoryMenu.name = '浏览历史';
		}
		else if (memoryMode === 2) {
			this.memoryMenu.name = '收藏夹';
		}
		this.menu.push(this.memoryMenu);

		this.updateMemory();

		global.SiteMap = generateSiteMap(this.menu);
	},
	methods: {
		toggleHint () {
			if (!Devices.isMobile) return;
			document.querySelector('.masker').classList.add('show');
		},
		backHome () {
			location.href = '/#'; // 避免URL污染
		},
		updateMemory () {
			if (memoryMode < 1) {
				this.aboutMenu[0].disabled = true;
				this.memoryMenu.disabled = true;
				return;
			}
			if (memoryMode === 1) this.aboutMenu[0].disabled = true;
			else this.aboutMenu[0].disabled = false;

			var history = [], favorite = [];
			if (memoryMode !== 2) history = localStorage.get('memory/history', history);
			if (memoryMode !== 1) favorite = localStorage.get('memory/favorite', favorite);

			if (history.length === 0 && favorite.length === 0) {
				this.memoryMenu.disabled = true;
				if (memoryMode > 1) {
					this.aboutMenu[0].name = '添加收藏';
					this.aboutMenu[0].category = 'addFavorite';
				}
			}
			else {
				this.memoryMenu.disabled = false;

				if (history.length === 0) {
					if (this.memoryMode === 1) {
						this.memoryMenu.disabled = true;
					}
					else if (this.memoryMode > 2) {
						this.memoryMenu.subs[1].disabled = true;
					}
				}
				else {
					let historyList;
					if (memoryMode === 1) {
						historyList = this.memoryMenu;
					}
					else if (memoryMode > 2) {
						historyList = this.memoryMenu.subs[1];
					}
					historyList.disabled = false;
					if (historyList.subs.length > history.length) {
						historyList.subs.splice(history.length, historyList.subs.length - history.length);
					}
					history.forEach((item, i) => {
						historyList.subs[i] = {
							name: item[0],
							type: 'article',
							category: item[1]
						};
					});
				}

				if (favorite.length === 0) {
					if (this.memoryMode === 2) {
						this.memoryMenu.disabled = true;
						this.aboutMenu[0].name = '添加收藏';
						this.aboutMenu[0].category = 'addFavorite';
					}
					else if (this.memoryMode > 2) {
						this.memoryMenu.subs[0].disabled = true;
						this.aboutMenu[0].name = '添加收藏';
						this.aboutMenu[0].category = 'addFavorite';
					}
				}
				else {
					this.memoryMenu.subs[0].disabled = false;
					let favoriteList;
					if (memoryMode === 2) {
						favoriteList = this.memoryMenu;
					}
					else if (memoryMode > 2) {
						favoriteList = this.memoryMenu.subs[0];
					}
					favoriteList.disabled = false;
					if (favoriteList.subs.length > favorite.length) {
						favoriteList.subs.splice(favorite.length, favoriteList.subs.length - favorite.length);
					}
					let favorited = false;
					favorite.forEach((item, i) => {
						favoriteList.subs[i] = {
							name: item[0],
							type: 'article',
							category: item[1]
						};
						if (item[1] === (window.PageInfo || '').url) favorited = true;
					});
					if (favorited) {
						this.aboutMenu[0].name = '取消收藏';
						this.aboutMenu[0].category = 'removeFavorite';
					}
					else {
						this.aboutMenu[0].name = '添加收藏';

						this.aboutMenu[0].category = 'addFavorite';
					}
				}
			}
		},
		disableFavoriteAction () {
			this.aboutMenu[0].disabled = true;
		}
	}
}
</script>