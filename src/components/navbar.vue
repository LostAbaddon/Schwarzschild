<template>
	<div class="nav-bar">
		<router-link to="/">首页</router-link>
		<font-awesome-icon icon="caret-right" />
		<NavMenuBar :menu="menu" />
	</div>
</template>

<script>
export default {
	name: 'NavBar',
	data () {
		return {
			menu: [
				["随笔", "/essay"],
				["格物致知", "/science", [
					["数学", '/math'],
					["物理", '/phy', [
						["测试1", '/test1'],
						["测试2", '/test2'],
						["测试3", '/test3', [
							["哈哈a", '/hahaa'],
							["哈哈b", '/hahab'],
						]],
						["测试4", '/test4'],
					]],
					["其它", '/others']
				]],
				["异世界", "/novel"],
				["小工具", "/tools", [
					['作文板', '/writer']
				]],
				["娱乐大厅", "/games"]
			]
		}
	},
}
</script>