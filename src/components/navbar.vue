<template>
	<div class="nav-bar">
		<div class="nav-hint"><i class="fas fa-angle-right" /></div>
		<div class="nav-docker">
			<router-link to="/">首页</router-link>
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
		else if (entry.type === 'viewer' || entry.type === 'view') {
			item.path = '/category?c=' + reqs.join(',')
		}
		map = entry.subs;
		result.push(item);
	});
	if (needHome) result.unshift({ name: "首页", path: '/' });
	return result;
};

export default {
	name: 'NavBar',
	data () {
		return {
			menu: ["site-menu"],
			aboutMe: "[:site-about-me:]"
		}
	},
	computed: {
		aboutMenu () {
			var menu = [
				{
					name: '配色',
					type: 'action',
					category: 'color',
					subs: ["theme-list"]
				},
				{
					name: '本站',
					type: 'page',
					category: 'about'
				},
			];
			if (!!this.aboutMe) {
				menu[1] = {
					name: '关于',
					type: 'page',
					category: '',
					subs: [menu[1]]
				};
				menu[1].subs.unshift({
					name: '本站',
					type: 'page',
					category: this.aboutMe
				});
				menu[1].subs[1].name = '系统';
			}
			else {
				menu[1].name = '关于';
			}
			return menu;
		}
	},
	mounted () {
		global.SiteMap = generateSiteMap(this.menu);
	}
}
</script>