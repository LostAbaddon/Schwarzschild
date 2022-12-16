# Schwarzschild

-	Version: 0.2.3
-	Author: [LostAbaddon](lostabaddon@gmail.com)

静态网站构建器，可用于 GitHub Pages 等处。

## 缓存

本网站会使用 Service Worker + CacheStorage 进行页面静态资源缓存。只有当页面中台（Service Worker）更新时才会更新页面静态资源。

同时，本网站会使用 IndexDB 将请求来的数据做缓存，用来缓存文章列表和访问过的文章数据，并用来作为本地文库，记录在线编辑的文章内容，并与服务器内容合并展示，即云-边架构（Cloud-Edge Architecture）。同时，对于本地文库与缓存云端内容，本网站支持复杂逻辑语法的全文检索。

## 依赖库

-	vue v3.0.7
	+	vue-axios v3.2.4
	+	vue-router v4.0.0
-	fontawesome v5.15.2
	+	free-solid
	+	free-regular
	+	free-brands
-	[MathJax v2.5.0](https://www.mathjax.org/mathjax-v2-5-now-available/)
-	[ESBuild v0.9.2](https://github.com/evanw/esbuild)
	超快速代码压缩工具，由 [evanw](https://github.com/evanw) 制作并开源（遵守 [MIT 开源协议](https://github.com/evanw/esbuild/blob/master/LICENSE.md)）。
	+	**注意：**
		ESBuild 安装后，在 NPMv7 上可能会存在问题而无法自动编译成功，此时须手动在 package-lock.json 中添加或修改“hasInstallScript”字段，其值为 true，而后运行脚本`npm run rebuildESBuild`。
-	[jLAss v1.0.3](https://github.com/LostAbaddon/jLAss): 自建 JS 库
-	[Asimov v1.1.1](https://github.com/LostAbaddon/Asimov): 自建的 MarkDown 解析器，支持更多语法（MarkUp）

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
-	compress<br>
	将output的public目录中的所有js文件都压缩
-	update<br>
	强制更新sources.json中的时间戳
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
	+	encrypt: 可选，后跟true表示使用config.json中指定的密钥文件，或跟特定密钥文件路径
	+	password： 可选，当使用encrypt参数后可用该参数指定iv码，否则将自动生成随机iv码并输出到CLI

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
	"lifecycle": "与生命周期相关的自定义函数所在 JS 文件路径",
	"aboutMe": "项目目录中AboutMe的vue文件相对site/src的路径",
	"memory": 3, // 记忆模式（1: 只有历史记录；2: 只有收藏夹；3: 都有）
	"likeCoin": "LikeCoin上的账户ID",
	"likeCoin": {
		"id": "LikeCoin上的账户ID",
		"forbidden": ["禁用LikeCoin的域名列表"]
	},
	"key": "加密文件（用于加密阅读）路径"
}
```

### 前端公共接口

这是一组预置的 HTML 端公共接口，可以提供一些便捷服务。

-	jLAss 库
-	Devices 组件：用来判断当前浏览器环境
-	js 函数
	+	loadJS：动态加载 JS
	+	loadCSS：动态加载 CSS

## 示例项目

[本人网站](https://lostabaddon.github.io/)便是用本库所做，点击[这里](https://github.com/LostAbaddon/LASiteBuilder)查看[网站项目](https://github.com/LostAbaddon/LASiteBuilder)。

# 注意事项

Vue 3 用的 WebPack 打包出来的代码在大部分浏览器上都可以正常运行，但在大部分 Safari 浏览器上会被认定为语法错误，所以需要加装 babel 插件来将 ES6 代码降级为 ES5。

大家可以自己进行配置，这里不默认做这步操作，因为我不喜欢做这种没营养的事……