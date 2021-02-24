<template>
	<div class="nav-bar">
		<router-link to="/">首页</router-link>
		<i class="fas fa-caret-right" />
		<div class="nav-container">
			<NavMenuBar :menu="menu" />
		</div>
		<div class="about-bar nav-container right">
			<NavMenuBar :menu="aboutMenu" />
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