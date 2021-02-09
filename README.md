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

-	build<br>
	生成文件但不启动 demo 模式
-	demo<br>
	vue-cli 的 Serve 模式
-	publish<br>
	使用 vue-cli 来生成页面，并导出到指定目录<br>
	可设置 commit message 信息来自动 commit 更改信息