<template>
	<div class="nav-bar">
		<router-link to="/">首页</router-link>
		<font-awesome-icon icon="caret-right" />
		<div class="nav-container">
			<NavMenuBar :menu="menu" />
		</div>
		<div class="about-bar nav-container right">
			<NavMenuBar :menu="aboutMenu" />
		</div>
	</div>
</template>

<script>
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
					name: '本站',
					type: 'page',
					category: 'about'
				}
			];
			if (!!this.aboutMe) {
				menu.unshift({
					name: '站长',
					type: 'page',
					category: this.aboutMe
				});
				menu = [{
					name: '关于',
					type: 'page',
					category: '',
					subs: menu
				}];
			}
			else {
				menu[0].name = '关于';
			}
			return menu;
		}
	}
}
</script>