<template>
	<div class="container markup" @click="onClick"><pre>
# 网站介绍

本站是由[[:library:]库（[:version:]）]([:libraryPage:])自动构建的静态网站。

[:library:]是由[[:author:]]([:mail:]) 所做的一个便捷的静态网站生成工具，功能包括网站资源缓存（使用cacheStorage）、支持桌面App模式，且能使用[自带的 Markdown解析器（Asimov，支持更多语法与效果的MarkUp语法）](https://github.com/LostAbaddon/Asimov)对MD文件进行自动转义（比如本页面），其中MU后缀文件使用完整的Asimov功能，MD后缀文件则不会采用部分功能（比如版权信息、LikeCoin设置，等等）。

## 特色

本网站会使用[Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) + [CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)进行页面静态资源缓存。只有当页面中台（Service Worker）更新时才会更新页面静态资源。

同时，本网站会使用[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)将请求来的数据做缓存，用来缓存文章列表和访问过的文章数据。本站会用[WebCryptoAPI](https://developer.mozilla.org/en-US/docs/Web/API/Crypto)进行加密阅读，并使用[SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)来做MarkUp解析，以避免影响主线程中操作。

## 本网站构建于——

-	vue v3.0.7
	+	vue-axios v3.2.4
	+	vue-router v4.0.0
-	fontawesome v5.15.2
	+	free-solid
	+	free-regular
	+	free-brands
-	[MathJax v2.5.0](https://www.mathjax.org/mathjax-v2-5-now-available/)
-	[ESBuild v0.9.2](https://github.com/evanw/esbuild)
	超快速代码压缩工具，由[evanw](https://github.com/evanw)制作并开源（遵守[MIT开源协议](https://github.com/evanw/esbuild/blob/master/LICENSE.md)）。
	+	**注意：**
		ESBuild安装后，在NPMv7上可能会存在问题而无法自动编译成功，此时须手动在package-lock.json中添加或修改“hasInstallScript”字段，其值为 true，而后运行脚本`npm run rebuildESBuild`。
-	[jLAss v1.0.3](https://github.com/LostAbaddon/jLAss): 自建JS库
-	[Asimov v1.1.0](https://github.com/LostAbaddon/Asimov): 自建的MarkDown解析器，支持更多语法（MarkUp）

## 强制清空缓存

若想强制清空缓存，可以点击[这里](@clearAllCache)。

# 注意事项

Vue 3用的WebPack打包出来的代码在大部分浏览器上都可以正常运行，但在大部分Safari浏览器上会被认定为语法错误，所以需要加装babel插件来将ES6代码降级为ES5。

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