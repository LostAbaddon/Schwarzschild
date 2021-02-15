# Schwarzschild

-	Version: 0.1.0
-	Author: [LostAbaddon](lostabaddon@gmail.com)

静态网站构建器，可用于 GitHub Pages 等处。

## 缓存

本网站会使用 Service Worker + CacheStorage 进行页面静态资源缓存。只有当页面中台（Service Worker）更新时才会更新页面静态资源。

同时，本网站会使用 IndexDB 将请求来的数据做缓存，用来缓存文章列表和访问过的文章数据。

## 依赖库

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

## 用法

```
const Schwarzschild = require('Schwarzschild/'));
Schwarzschild.launch(require('./config.json'));
```

### 命令行用法

可使用开关参数 `-h` 或 `--help` 查看距离命令行用法。

-	build<br>
	生成文件但不启动 demo 模式
-	demo<br>
	vue-cli 的 Serve 模式
-	publish<br>
	使用 vue-cli 来生成页面，并导出到指定目录<br>
	可设置 commit message 信息来自动 commit 更改信息

### MarkUp 用法

详细语法可以点[这里](https://github.com/LostAbaddon/Asimov/blob/main/demo.mu)查看。

Schwarzschild 会自动将页面中带有 markup 类名的容器中的内容解析出来。需注意的是，容器内是HTML内容，代码中的换行不是实际的换行，所以可以用 br 标签来换行，或将代码套在 pre 块中。

可在 class 中增加以下类名来启用 MarkUp 的宏功能：

-	toc: 自动生成文首目录
-	glossary: 自动生成文尾引用列表
-	resources: 	自动生成文尾资源列表

## 项目目录

-	config.json:	项目配置文件
-	site:	替换 Schwarzschild 的文件，数据文件也可以放在里面
-	api: 网站数据文件夹，其中包括文章列表、文章等所有动态数据

### config.json

```
{
	"title": "项目名，将用在页面 title 上",
	"shortname": "WebApp 用的网站短名",
	"description": "WebApp 用的网站介绍",
	"owner": "网站站长",
	"publish": "项目发布路径",
	"jLAss": true, // true表示引用最基础服务，默认是 true
	"siteMap": [
		{
			"name": "目录1，viewer表示内容页，category对应到本地文件夹中内容目录路径",
			"type": "viewer",
			"category": "test1"
		},
		{
			"name": "目录2，page表示独立页",
			"type": "page",
			"category": "test2",
			"subs": [
				{
					"name": "子目录1，category会自动追加父级到前",
					"type": "viewer",
					"category": "subtest1"
				},
				{
					"name": "子目录2，category会自动追加父级到前",
					"type": "viewer",
					"category": "subtest2"
				}
			]
		}
	],
	"aboutMe": "项目目录中AboutMe的vue文件相对site/src的路径"
}
```