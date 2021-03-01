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
-	fontawesome v5.15.2
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
-	append<br>
	添加文件并更新目录
	+	file：	必选，mu/md文件路径
	+	category：	必选，文章分类
	+	title：	可选，目录页显示的文章名
	+	author:	可选，目录页显示的作者名
	+	publishAt：	可选，目录页显示的文章发布时间
	+	overwrite：	可选，是否覆盖原有mu/md文件
	+	rename：	可选，如制定目录和文件名的文件已存在则将新文件自动重命名
	+	keep：	可选，决定是否保留原有文件

### MarkUp 用法

详细语法可以点[这里](https://github.com/LostAbaddon/Asimov/blob/main/demo.mu)查看。

Schwarzschild 会自动将页面中带有 markup 类名的容器中的内容解析出来。需注意的是，容器内是HTML内容，代码中的换行不是实际的换行，所以可以用 br 标签来换行，或将代码套在 pre 块中。

可在 class 中增加以下类名来启用 MarkUp 的宏功能：

-	toc: 自动生成文首目录
-	glossary: 自动生成文尾引用列表
-	resources: 	自动生成文尾资源列表

## 项目目录

-	config.json:					项目配置文件
-	site:							替换 Schwarzschild 的文件，数据文件也可以放在里面
-	api:							网站数据文件夹，其中包括文章列表、文章等所有动态数据
	+	source.json:				订阅源目录（append 命令自动生成）
	+	<username>-<index>.json:	订阅源文章列表，index为分页序数（append 命令自动生成）
	+	granary:					分类信息与分类文章目录，可在config中配置
		>	info.md:				分类介绍
		>	其它:					文章
-	image:	存放页面所用图片等静态文件的目录
-	pages:	自定义页面（vue）所在目录
-	output：	vue-cli打包目录，自动生成

### config.json

```
{
	"title": "项目名，将用在页面 title 上",
	"shortname": "WebApp 用的网站短名",
	"description": "WebApp 用的网站介绍",
	"owner": "网站站长",
	"GA": "GA ID，可不填，不填则不会启动GA跟踪服务",
	"publish": "项目发布路径",
	"jLAss": true, // true表示引用最基础服务，默认是 true
	"database": "api目录下数据文件存放的目录名",
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
	"themeList": [
		{
			"name": "主题名，会在菜单中显示",
			"type": "action",
			"category": "主题ID，与 theme.css 中 theme 字段适配"
		}
	],
	"aboutMe": "项目目录中AboutMe的vue文件相对site/src的路径"
}
```

## 示例项目

[本人网站](https://lostabaddon.github.io/)便是用本库所做，点击[这里](https://github.com/LostAbaddon/LASiteBuilder)查看[网站项目](https://github.com/LostAbaddon/LASiteBuilder)。

# TODO

-	整体
-	目录页
	1.	分页功能
	2.	分类功能
	3.	搜索功能
-	文章页
	1.	回复功能（indexedDB）
	2.	划词评论（indexedDB）
	3.	加密阅读
	4.	图片墙模式
-	工具页（Site中）
	1.	MarkUp 编辑器
	2.	计算器与绘图工具
	3.	俄罗斯方块
	4.	魔药课（2048变态版）
	5.	诡异弹球
	6.	五子棋
	8.	补完更多过去的文章
-	Asimov MarkUp 解析插件
	1.	增加来源以及同一份内容的外站页的解析功能
	2.	PPT 模式