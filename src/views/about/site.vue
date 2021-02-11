<template>
	<div class="container">
		<p>本站是由 <a target="_blank" href="[:libaryPage:]">[:libary:] 库（[:version:]）</a>自动构建的静态网站。</p>
		<p>[:libary:] 是由 <a href="mailto:[:mail:]">[:author:]</a> 所做的一个便捷的静态网站生成工具，功能包括网站资源缓存（使用 cacheStorage）、支持桌面 App 模式，且能使用自带的 Markdown 解析器对 MD 文件进行自动转义。</p>
	</div>
</template>

<script>
export default {
	name: 'AboutSite',
}
</script>

<style scoped>
.container {
	margin-bottom: 100px;
}
</style>