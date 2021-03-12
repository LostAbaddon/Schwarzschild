<template>
	<div class="container markup" @click="onClick"><pre>
# 网站介绍

本站是由 [[:library:] 库（[:version:]）]([:libraryPage:])自动构建的静态网站。

[:library:] 是由 [[:author:]]([:mail:]) 所做的一个便捷的静态网站生成工具，功能包括网站资源缓存（使用 cacheStorage）、支持桌面 App 模式，且能使用[自带的 Markdown 解析器（Asimov，支持更多语法与效果的 MarkUp 语法）](https://github.com/LostAbaddon/Asimov)对 MD 文件进行自动转义（比如本页面）。

## 特色

本网站会使用 [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) + [CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) 进行页面静态资源缓存。只有当页面中台（Service Worker）更新时才会更新页面静态资源。

同时，本网站会使用 [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) 将请求来的数据做缓存，用来缓存文章列表和访问过的文章数据。

另一方面，本站用 [SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker) 来做 MarkUp 解析，以避免影响主线程中操作。

## 本网站构建于——

-	vue v3.0.7
	+	vue-axios v3.2.4
	+	vue-router v4.0.0
-	fontawesome v5.15.2
	+	free-solid
	+	free-regular
	+	free-brands
-	[jLAss v1.0.3](https://github.com/LostAbaddon/jLAss): 自建 JS 库
-	[Asimov v1.0.1](https://github.com/LostAbaddon/Asimov): 自建的 MarkDown 解析器，支持更多语法（MarkUp）

## 强制清空缓存

若想强制清空缓存，可以点击[这里](@clearAllCache)。

# 注意事项

Vue 3 用的 WebPack 打包出来的代码在大部分浏览器上都可以正常运行，但在大部分 Safari 浏览器上会被认定为语法错误，所以需要加装 babel 插件来将 ES6 代码降级为 ES5。

大家可以自己进行配置，这里不默认做这步操作，因为我不喜欢做这种没营养的事……
	</pre></div>
</template>

<script>
export default {
	name: 'AboutSite',
	mounted () {
		callPageLoaded();
	},
	methods: {
		async onClick (evt) {
			var target = evt.target;
			if (target.tagName === 'SPAN') target = target.parentElement;
			if (target.hash !== '#clearAllCache' && target.hash !== '#/clearAllCache') return;
			evt.preventDefault();
			evt.stopPropagation();

			await Granary.clearAllCache();
			console.log('已清空所有缓存');
			notify({
				title: "已清空所有缓存",
				duration: 3000,
				type: 'success'
			});
		}
	}
}
</script>

<style scoped>
.container {
	margin-bottom: 100px;
}
</style>