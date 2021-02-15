<template>
	<div class="container markup"><pre>
# 网站介绍

本站是由 [[:library:] 库（[:version:]）]([:libraryPage:])自动构建的静态网站。

[:library:] 是由 [[:author:]]([:mail:]) 所做的一个便捷的静态网站生成工具，功能包括网站资源缓存（使用 cacheStorage）、支持桌面 App 模式，且能使用[自带的 Markdown 解析器（Asimov，支持更多语法与效果的 MarkUp 语法）](https://github.com/LostAbaddon/Asimov)对 MD 文件进行自动转义（比如本页面）。

## 特色

本网站会使用 Service Worker + CacheStorage 进行页面静态资源缓存。只有当页面中台（Service Worker）更新时才会更新页面静态资源。

同时，本网站会使用 IndexDB 将请求来的数据做缓存，用来缓存文章列表和访问过的文章数据。

## 本网站构建于——

-	vue v2.6.12
	+	vue-cli v2.9.6
	+	vue-axios v0.21.1
	+	vue-notification v1.3.20
-	fontawesome v5.7.1
	+	free-solid
	+	free-regular
	+	free-brands
-	[jLAss v1.0.2](https://github.com/LostAbaddon/jLAss): 自建 JS 库
-	[Asimov v1.0.0](https://github.com/LostAbaddon/Asimov): 自建的 MarkDown 解析器，支持更多语法（MarkUp）
	</pre></div>
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