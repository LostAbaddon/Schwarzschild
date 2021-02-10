# Schwarzschild

-	Version: 0.1.0
-	Author: [LostAbaddon](lostabaddon@gmail.com)

静态网站构建器，可用于 GitHub Pages 等处。

基于自建 JS 库（[jLAss](https://github.com/LostAbaddon/jLAss)）和 VUE，可将 VUE 构建的页面发布到指定本地目录，或直接推送到相关 REPO。

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

## 项目目录

-	config.json:	项目配置文件
-	site:	替换 Schwarzschild 的文件，数据文件也可以放在里面
-	components:	项目组件，可自动插入到 Schwarzschild 的 vue 文件中

### config.json

```
{
	"title": "项目名，将用在页面 title 上",
	"publish": "项目发布路径",
	"jLAss": [ "math", "datastore", "threads" ], // true表示引用最基础服务，Array则在基础服务至上追加子功能组
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
	]
}
```