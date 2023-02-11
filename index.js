const Path = require('path');
const FS = require('fs/promises');
const Crypto = require('crypto').webcrypto.subtle;
const VueService = require('@vue/cli-service');
const ESBuild = require('esbuild');

global.MarkUp = require('Asimov');
require('Asimov/extensions.js');

require("jLAss");
loadjLAssModule('fs');
loadjLAssModule('commandline');

const RecordPerFile = 500;
const DirPath = (__dirname.indexOf('node_modules') > 0) ? process.cwd() : __dirname;
const execSync = require('child_process').execSync;
const CLP = _('CL.CLP');
const setStyle = _('CL.SetStyle');
const preparePath = _("Utils").preparePath;
const FolderForbiddens = ['node_modules', 'dist', 'server', '.git', '.gitignore', '.browserslistrc'];

const SitePath = Path.join(process.cwd(), 'site');
const OutPutPath = Path.join(process.cwd(), 'output');
const BuildPath = Path.join(OutPutPath, 'dist');
const DataPath = Path.join(process.cwd(), 'data');
const getTimeString = _('Utils').getTimeString;
const getRandomValues = require('crypto').webcrypto.getRandomValues;

const vueServer = new VueService(OutPutPath);
const runVUE = async cmd => {
	cmd = [cmd];
	await vueServer.run(cmd[0], {
		_: cmd,
		modern: false,
		report: false,
		'report-json': false,
		'inline-vue': false,
		watch: false,
		open: false,
		copy: false,
		https: false,
		verbose: false
	}, cmd);
};

const gitAddAndCommit = (path, msg) => {
	try {
		execSync('git add --all', { cwd: path });
	}
	catch (err) {
		console.error(`Git Add failed: ${err}`);
		return;
	}

	try {
		execSync('git commit -m "' + msg + '"', { cwd: path });
	}
	catch (err) {
		console.error(`Git Commit failed: ${err}`);
		return;
	}
};
const copyFile = async (source, target) => {
	if (await FS.doesSourceFileNewerThanTargetFile(source, target)) {
		await FS.copyFile(source, target);
		return true;
	}
	return false;
};
const realizeHomePage = async (imports, isDemo) => {
	var html;
	try {
		html = await FS.readFile(Path.join(__dirname, "/public/index.html"));
		html = html.toString();
		if (!!Schwarzschild.config.GA) {
			html = html.replace('var gaid="";', 'var gaid="' + Schwarzschild.config.GA + '";');
		}
		html = html.replace(/\[:HomePageDescription:\]/gi, Schwarzschild.config.description || Schwarzschild.config.title);

		if (!!Schwarzschild.config.lifecycle) {
			let filepath = Path.join(process.cwd(), Schwarzschild.config.lifecycle);
			let has = await FS.hasFile(filepath);
			if (has) {
				let filename = Path.basename(Schwarzschild.config.lifecycle);
				let target = Path.join(OutPutPath, 'public/js', filename);
				imports.unshift('<script type="text/javascript" src="<%= BASE_URL %>js/' + filename + '"></script>');
				try {
					await FS.copyFile(filepath, target);
				} catch {}
			}
		}
		imports.unshift('<script type="text/javascript" src="<%= BASE_URL %>js/patch.js"></script>');
		html = html.replace(/<script type="text\/javascript" src="<%= BASE_URL %>js\/patch\.js"><\/script>/i, imports.join(''));

		await FS.writeFile(Path.join(OutPutPath, "/public/index.html"), html, 'utf-8');
		console.log('Index页配置成功');
	} catch (err) {
		console.error(err);
	}
};
const realizeCustomPages = async (isDemo=false) => {
	var pagesPath = Path.join(process.cwd(), 'pages');
	var targetPath = Path.join(OutPutPath, 'src/pages');
	var has = await FS.hasFile(pagesPath);
	if (!has) return;

	var map, pathList = [];
	[map, _] = await Promise.all([FS.getFolderMap(pagesPath), FS.copyFolder(pagesPath, targetPath)]);
	map = FS.convertFileMap(map);
	pathList = map.files.map(p => {
		var name = Path.basename(p).replace(/\.vue$/i, '');
		var path = p.replace(pagesPath, '../pages').replace(/\\/g, '/');
		var url = p.replace(pagesPath, '').replace(/\\/g, '/').replace(/\.vue$/i, '');
		console.log('复制自定义页面文件：', path);
		return '{"path":"' + url + '","name":"' + name + '","component":function(){return import("' + path + '")}}'
	});
	if (pathList.length > 0) pathList = pathList.join(',') + ',';
	else pathList = '';


	var router;
	try {
		router = await FS.readFile(Path.join(__dirname, "src/router/index.js"));
		router = router.toString();
		let vueFile = '../' + Schwarzschild.config.aboutMe;
		if (!vueFile.match(/\.vue$/i)) vueFile = vueFile + '.vue';
		if (!!Schwarzschild.config.aboutMe) {
			pathList = pathList + "{path:'/aboutMe',name:'AboutMe',component:function(){return import('" + vueFile + "')}},";
		}
		router = router.replace(/{ aboutMe: 'aboutMe' },/gi, pathList);
		await FS.writeFile(Path.join(OutPutPath, "src/router/index.js"), router, 'utf-8');
		console.log('关于页与自定义页配置完成');
	}
	catch (err) {
		console.error(err);
	}
};
const realizeManifest = async (isDemo=false) => {
	var webApp;
	try {
		webApp = await FS.readFile(Path.join(__dirname, "/public/webapp.json"));
		webApp = webApp.toString();
		webApp = webApp.replace(/\[:title:\]/gi, Schwarzschild.config.title);
		webApp = webApp.replace(/\[:shortname:\]/gi, Schwarzschild.config.shortname || Schwarzschild.config.title);
		webApp = webApp.replace(/\[:description:\]/gi, Schwarzschild.config.description || Schwarzschild.config.title);
		await FS.writeFile(Path.join(OutPutPath, "/public/webapp.json"), webApp, 'utf-8');
		console.log('WebApp配置文件配置成功');
	} catch (err) {
		console.error(err);
	}
};
const realizeMiddleGround = async () => {
	var middleGround;
	try {
		middleGround = await FS.readFile(Path.join(__dirname, "/public/priory.js"));
		middleGround = middleGround.toString();
		middleGround = '/* 更新于：' + getTimeString(new Date()) + ' */\n' + middleGround;
		await FS.writeFile(Path.join(OutPutPath, "/public/priory.js"), middleGround, 'utf-8');
		console.log('中台控制模块更新成功');
	} catch (err) {
		console.error(err);
	}
};
const realizeSiteTitle = async (isDemo=false) => {
	var cfg;
	try {
		cfg = await FS.readFile(Path.join(__dirname, "vue.config.js"));
		cfg = cfg.toString();
		cfg = cfg.replace(/\[:Title:\]/gi, Schwarzschild.config.title + (isDemo ? ' (demo)' : ''));
	} catch {
		cfg = {
			pages: {
				index: {
					entry: "src/main.js",
					title: Schwarzschild.config.title + (isDemo ? ' (demo)' : '')
				}
			}
		};
		cfg = 'module.exports = ' + JSON.stringify(cfg, '\t', '\t') + ';';
	}
	await FS.writeFile(Path.join(OutPutPath, "vue.config.js"), cfg, 'utf-8');
	console.log('vue.config.js文件配置成功');
};
const realizeSiteMenu = async (isDemo) => {
	var navMenu;
	try {
		navMenu = await FS.readFile(Path.join(__dirname, "src/components/navbar.vue"));
		navMenu = navMenu.toString();
		navMenu = navMenu.replace(/\["site-menu"\]/gi, JSON.stringify(Schwarzschild.config.siteMap, "\t", "\t"));
		navMenu = navMenu.replace(/\[:site-about-me:\]/gi, !!Schwarzschild.config.aboutMe ? 'aboutMe' : '');
		let themes = Schwarzschild.config.themeList || [
			{
				"name": "亮",
				"type": "action",
				"category": "light"
			}, {
				"name": "淡",
				"type": "action",
				"category": "normal"
			}, {
				"name": "黯",
				"type": "action",
				"category": "dark"
			}
		];
		navMenu = navMenu.replace(/\["theme-list"\]/gi, JSON.stringify(themes, "\t", "\t"));
		await FS.writeFile(Path.join(OutPutPath, "src/components/navbar.vue"), navMenu, 'utf-8');
		console.log('导航条配置成功');
	}
	catch (err) {
		console.error(err);
	}
};
const realizeAboutSite = async (isDemo) => {
	var aboutSite;
	try {
		aboutSite = await FS.readFile(Path.join(__dirname, "src/views/about/site.vue"));
		aboutSite = aboutSite.toString();
		aboutSite = aboutSite.replace(/\[:library:\]/gi, Schwarzschild.pkg.name);
		aboutSite = aboutSite.replace(/\[:libraryPage:\]/gi, Schwarzschild.pkg.homepage);
		aboutSite = aboutSite.replace(/\[:version:\]/gi, "v" + Schwarzschild.pkg.version);
		aboutSite = aboutSite.replace(/\[:author:\]/gi, Schwarzschild.pkg.author.name);
		aboutSite = aboutSite.replace(/\[:mail:\]/gi, Schwarzschild.pkg.author.email);
		await FS.writeFile(Path.join(OutPutPath, "src/views/about/site.vue"), aboutSite, 'utf-8');
		console.log('关于系统页配置成功');
	}
	catch (err) {
		console.error(err);
	}
};
const realizeTailBar = async (isDemo) => {
	var tailBar;
	try {
		tailBar = await FS.readFile(Path.join(__dirname, "src/components/tail.vue"));
		tailBar = tailBar.toString();
		tailBar = tailBar.replace(/\[:library:\]/gi, Schwarzschild.pkg.name);
		tailBar = tailBar.replace(/\[:libraryPage:\]/gi, Schwarzschild.pkg.homepage);
		tailBar = tailBar.replace(/\[:version:\]/gi, Schwarzschild.pkg.version);
		tailBar = tailBar.replace(/\[:owner:\]/gi, Schwarzschild.config.owner || Schwarzschild.pkg.author.name);
		tailBar = tailBar.replace(/\[:now-year:\]/gi, (new Date()).getYear() + 1900);
		await FS.writeFile(Path.join(OutPutPath, "src/components/tail.vue"), tailBar, 'utf-8');
		console.log('页尾条配置成功');
	}
	catch (err) {
		console.error(err);
	}
};
const realizeGranaryConfig = async (isDemo) => {
	var cfg;
	try {
		cfg = await FS.readFile(Path.join(__dirname, "/src/assets/js/granary.js"));
		cfg = cfg.toString();
		cfg = cfg.replace("DataGranary: '/data/granary'", "DataGranary: '/data/" + Schwarzschild.config.database + "'");
		await FS.writeFile(Path.join(OutPutPath, "/src/assets/js/granary.js"), cfg, 'utf-8');
		console.log('granary.js文件配置成功');
	} catch (err) {
		console.error(err);
	}
};
const realizeKeyManager = async (isDemo) => {
	var key = Schwarzschild.config.key;
	if (!!key) {
		try {
			key = await FS.readFile(key, 'utf-8');
		} catch {
			console.error('指定的Key文件（' + Schwarzschild.config.key + '）不存在或已损坏，将使用自带默认秘钥。');
			key = null;
		}
	}
	if (!key) {
		try {
			key = await FS.readFile(Path(__dirname, 'default.key'), 'utf-8');
		} catch {
			console.error('自带默认秘钥文件丢失或损坏，请重新生成 AES-256-GCM 秘钥文件！');
			return;
		}
	}

	var cfg;
	try {
		cfg = await FS.readFile(Path.join(__dirname, "/src/components/keyManager.vue"));
		cfg = cfg.toString();
		cfg = cfg.replace("[:DEFAULT-AES-KEY:]", key);
		await FS.writeFile(Path.join(OutPutPath, "/src/components/keyManager.vue"), cfg, 'utf-8');
		console.log('KeyManager 文件配置成功');
	} catch (err) {
		console.error(err);
	}
};
const assemblejLAss = async (isDemo) => {
	if (!Schwarzschild.config.jLAss) return;
	Schwarzschild.config.jLAss = ['extends'];
	var jpath = Path.join(DirPath, 'node_modules/jLAss/src');

	// 准备目录
	var outputPath = Path.join(OutPutPath, 'public/jLAss');
	var publicPath = Path.join(OutPutPath, 'public/');
	if (!(await FS.hasFile(outputPath))) await FS.createFolders([outputPath]);
	var files = [
		[Path.join(jpath, 'index.js'), Path.join(outputPath, 'index.js')],
		[Path.join(jpath, 'namespace.js'), Path.join(outputPath, 'namespace.js')],
	];
	var folders = [ [Path.join(outputPath, 'utils')] ];
	if (Array.is(Schwarzschild.config.jLAss)) {
		Schwarzschild.config.jLAss.forEach(f => {
			folders.push([Path.join(outputPath, f), Path.join(jpath, f)]);
		});
	}
	await Promise.all(folders.map(async f => {
		if (!(await FS.hasFile(f[0]))) await FS.createFolders([f[0]]);
		if (!f[1]) return;
		var map = await FS.getFolderMap(f[1]);
		map.files.forEach(path => {
			files.push([path, path.replace(f[1], f[0])]);
		});
	}));
	console.log('jLAss 准备完毕');

	// 复制文件
	files.push([Path.join(jpath, 'utils/datetime.js'), Path.join(outputPath, 'utils/datetime.js')]);
	var imports = [];
	await Promise.all(files.map(async f => {
		var index = imports.length;
		imports[index] = '';
		if (!(await FS.doesSourceFileNewerThanTargetFile(f[0], f[1]))) {
			imports[index] = '<script type="text/javascript" src="<%= BASE_URL %>' + f[1].replace(publicPath, '').replace(/\\/g, '/') + '"></script>';
			return;
		}
		var content = await FS.readFile(f[0]);
		content = content.toString();
		content = content.replace(/require\(.+\)/g, '{};');
		try {
			await FS.writeFile(f[1], content, 'utf-8');
			imports[index] = '<script type="text/javascript" src="<%= BASE_URL %>' + f[1].replace(publicPath, '').replace(/\\/g, '/') + '"></script>';
			console.log('复制jLAss文件: ' + f[0]);
		}
		catch (err) {
			console.error('写入jLAss文件(' + f[1] + ')失败: ', err.toString());
		}
	}));
	console.log('jLAss 插件准备完毕');

	// 复制 MarkUp 文件
	await FS.copyFolder(Path.join(DirPath, 'node_modules/Asimov'), Path.join(OutPutPath, 'public/Asimov'));
	console.log('Asimov 线程内模块准备完毕');

	// 添加引用
	await Promise.all([
		(async () => {
			var content = await FS.readFile(Path.join(__dirname, 'src/main.js'));
			content = content.toString().replace(/":TITLE:"/gi, JSON.stringify(Schwarzschild.config.title + (isDemo ? ' (demo)' : '')));
			content = content.replace(/":OWNER:"/gi, JSON.stringify(Schwarzschild.config.owner || Schwarzschild.pkg.author.name));
			content = content.replace(/"\[:MemoryMode:\]"/gi, Number.is(Schwarzschild.config.memory) ? Schwarzschild.config.memory : 3);
			if (!!Schwarzschild.config.likeCoin) {
				content = content.replace(/":LIKECOIN:"/gi, JSON.stringify(Schwarzschild.config.likeCoin));
			}
			else {
				content = content.replace(/":LIKECOIN:"/gi, 'null');
			}
			await FS.writeFile(Path.join(OutPutPath, 'src/main.js'), content, 'utf-8');
		}) (),
		realizeHomePage(imports, isDemo)
	]);
};
const assembleAPI = async (isDemo, publishPath) => {
	var source = Path.join(process.cwd(), 'data');
	var target;
	if (!!publishPath) target = Path.join(publishPath, 'data');
	else target = Path.join(OutPutPath, 'public/data');
	await FS.copyFolder(source, target);
	console.log('数据文件复制完毕');
};
const assembleImages = async (isDemo, publishPath) => {
	var source = Path.join(process.cwd(), 'image');
	var target;
	if (!!publishPath) target = Path.join(publishPath, 'image');
	else target = Path.join(OutPutPath, 'public/image');
	await FS.copyFolder(source, target);
	console.log('图片资源复制完毕');
};
const removeOldPublishFiles = async (targetPath) => {
	var map = await FS.getFolderMap(targetPath, FolderForbiddens);
	map = FS.convertFileMap(map).files;
	map = map.filter(f => {
		var name = Path.basename(f);
		if (!name.match(/^\w+([\-\.]\w+)+\.(js|css|js\.map)$/i)) return;
		return true;
	});
	await FS.deleteFiles(map);
};
const removeJSMapFiles = async (targetPath) => {
	var map = await FS.getFolderMap(targetPath, FolderForbiddens);
	map = FS.convertFileMap(map).files;
	map = map.filter(f => {
		var name = Path.basename(f);
		if (!name.match(/^(\w+([\-\.]\w+)+|index)\.js\.map$/i)) return;
		return true;
	});
	await FS.deleteFiles(map);
};
const updateSingleFile = async (filename, publishPath) => {
	var filepath = Path.join(process.cwd(), filename);
	if (FS.hasFile(filepath)) {
		try {
			await copyFile(filepath, Path.join(publishPath, filename));
		} catch {}
	}
};
const compressFile = async (filepath) => {
	console.log('Compressing: ' + filepath);
	var ext = Path.extname(filepath);
	var filename = filepath.split('.');
	filename.pop();
	filename.join('.');
	filename = filename + '.min' + ext;
	var config = {
		entryPoints: [filepath],
		outfile: filename,
		minify: true,
		target: "esnext"
	};
	// if (filepath.match(/\.css$/i)) config.loader2 = 'css';
	var result = await ESBuild.build(config);
	!!result.warnings && result.warnings.forEach(warn => console.warn(warn));
	!!result.errors && result.errors.forEach(error => console.error(error));
	console.log('Compress Done: ' + filename);

	await FS.deleteFiles([filepath]);
	await FS.copyFile(filename, filepath);
	await FS.deleteFiles([filename]);
	console.log('Update Compress over Origin success: ' + filepath);
};
const calculateLikehoodForArticle = async (filepath, record) => {
	var file;
	try {
		file = await FS.readFile(filepath);
		file = file.toString();
	}
	catch (err) {
		console.error(err);
		return;
	}

	file = MarkUp.fullPlainify(file);
	var desc = file.content;
	if (desc.length > 150) desc = desc.substr(0, 148) + '……';
	file = file.content.split(/[\n\,\.\?\!\(\)\[\]\{\}\\\/\<\>\-\+=_:'"，。？！（）【】、·—…：‘’“”《》]/);
	file = file.filter(line => {
		var match = line.match(/([\u4e00-\u9fa5]|[A-Za-z]{2,})+/);
		return !!match;
	});
	file = file.map(line => line.trim());

	var wordSpace = {};
	file.forEach(line => {
		var words = [];
		line.replace(/([\u4e00-\u9fa5]|[A-Za-z0-9]+)/gi, match => {
			// if (match.match(/^\d+$/)) return;
			if (!match.match(/[\u4e00-\u9fa5]/)) return;
			words.push(match);
		});
		var len = words.length;
		for (let l = 1; l <= len; l ++) {
			let r = len - l;
			for (let i = 0; i <= r; i ++) {
				let w = '';
				for (let j = i; j < i + l; j ++) {
					let char = words[j];
					if (char.match(/[A-Za-z0-9]+/)) char = ' ' + char + ' ';
					w = w + char;
				}
				w = w.replace(/ +/g, ' ').trim();
				wordSpace[w] = (wordSpace[w] || 0) + 1;
			}
		}
	});

	var max = 0, min = Infinity;
	for (let key in wordSpace) {
		let count = wordSpace[key];
		if (count > max) max = count;
		if (count < min) min = count;
	}
	max -= min;
	for (let key in wordSpace) {
		let count = wordSpace[key];
		let e = (count - min) / max;
		if (e <= 0 || e >= 1) {
			delete wordSpace[key];
		}
		else {
			wordSpace[key] = [0 - Math.log(e) * e, count];
		}
	}

	var list = Object.keys(wordSpace);
	list = list.map(w => [w, w.length]);
	list.sort((a, b) => b[1] - a[1]);
	list.forEach(item => {
		var [key, len] = item;
		var value = wordSpace[key];
		if (!value) return;
		value = value[1];
		if (value <= 0) return;
		for (let l = 1; l < len; l ++) {
			let r = len - l;
			for (let i = 0; i <= r; i ++) {
				let k = key.substr(i, l);
				let v = wordSpace[k];
				if (!v) continue;
				v[1] -= value;
				if (v[1] <= 0) delete wordSpace[k];
			}
		}
	});

	max = 0;
	min = Infinity;
	for (let key in wordSpace) {
		let count = wordSpace[key][1];
		if (count > max) max = count;
		if (count < min) min = count;
	}
	max -= min;
	var entropy = 0;
	for (let key in wordSpace) {
		let count = wordSpace[key][1];
		let e = (count - min) / max;
		if (e <= 0 || e >= 1) {
			delete wordSpace[key];
		}
		else {
			e = 0 - Math.log(e) * e;
			wordSpace[key] = [e * Math.log(key.length + 1), e, count];
			if (e > entropy) entropy = e;
		}
	}

	list = Object.keys(wordSpace);
	list = list.map(w => [w, ...wordSpace[w]]);
	list.sort((a, b) => b[1] - a[1]);
	list.splice(10);

	var total = 0;
	list.forEach(item => total += item[1]);
	list.forEach(item => item[1] /= total);

	const crypto = require('crypto').createHash;
	var likehood = Array.generate(256).map(i => [0, 0]);
	list.forEach(item => {
		const hash = crypto('sha256');
		hash.update(item[0]);
		var h = hash.digest('hex');
		h = h.split('');
		h = h.map(i => {
			i = parseInt(i, 16).toString(2).split('').map(i => i * 1);
			for (let j = i.length; j < 4; j ++) {
				i.unshift(0);
			}
			return i;
		});
		h = h.flat();
		h.forEach((d, i) => {
			likehood[i][d] += item[1];
		});
	});
	likehood = likehood.map(a => a[0] > a[1] ? 0 : 1);
	var vector = '';
	for (let i = 0; i < 64; i ++) {
		let j = likehood.splice(0, 4);
		j = parseInt(j.join(''), 2).toString(16);
		vector += j;
	}

	record.description = desc;
	record.likehood = vector;

	console.log('相似空间矢量计算完毕: ' + filepath);
	console.log('相似关键词:   ' + list.map(i => i[0]).join('\n              '));
	console.log('相似矢量哈希: ' + vector);
	console.log('------------------------------------------------------------------------------');
};
const calculateLikehood = async (filepath) => {
	var data;
	try {
		data = await FS.readFile(filepath);
		data = data.toString();
		data = JSON.parse(data);
	}
	catch (err) {
		console.error(err);
		return;
	}

	var list = data.articles;
	var tasks = [];
	list.forEach(item => {
		if (item.type !== 'article') return;
		var path = Path.join(DataPath, Schwarzschild.config.database, item.sort, item.filename);
		tasks.push(calculateLikehoodForArticle(path, item));
	});
	await Promise.all(tasks);

	await FS.writeFile(filepath, JSON.stringify(data));
};

global.Schwarzschild = {};
Schwarzschild.config = {};
Schwarzschild.pkg = require('./package.json');
Schwarzschild.launch = config => {
	if (!config) config = './config.json';
	if (String.is(config)) {
		let cfg;
		try {
			cfg = require(config);
		} catch {
			try {
				cfg = require(require('path').join(process.cwd(), config));
			} catch {
				cfg = null;
			}
		}
		config = cfg;
	}

	const clp = CLP({
		mode: 'process',
		title: Schwarzschild.pkg.name + " v" + Schwarzschild.pkg.version,
	}).describe(Schwarzschild.pkg.name + " v" + Schwarzschild.pkg.version)
	.addOption('--config <config> >> 指定配置文件')

	.add('build >> 生成文件')
	.addOption('--force -f >> 强制更新所有文件')
	.addOption('--clear -r >> 强制清除所有文件')
	.addOption('--onlyapi -o >> 只复制API文件')

	.add('demo >> 启动网站测试服务')
	.addOption('--force -f >> 强制更新所有文件')
	.addOption('--clear -r >> 强制清除所有文件')
	.addOption('--onlyapi -o >> 只复制API文件')

	.add('compress >> 打包Public目录下的JS文件')

	.add('publish >> 打包网站')
	.setParam('[path] >> 指定发布路径')
	.addOption('--onlyapi -o >> 只复制API文件')
	.addOption('--removeMaps -r >> 删除JS-Map')
	.addOption('--notcompress >> 不压缩Public的JS文件')
	.addOption('--msg -m [msg] >> Git Commit 信息')

	.add('append >> 添加文章')
	.addOption('--file -f <file> >> md文件路径')
	.addOption('--category -c <category> >> 文章分类')
	.addOption('--title -t <title> >> 设置文章标题')
	.addOption('--author -a <author> >> 设置文章作者')
	.addOption('--publishAt -p <publishAt> >> 设置发布时间')
	.addOption('--overwrite -o >> 可强制覆盖文件')
	.addOption('--rename -r >> 对同名文件自动重命名')
	.addOption('--keep -k >> 保留文件')
	.addOption('--encrypt [encrypt] >> 加密文件')
	.addOption('--password <password> >> 用作初始向量的自定义密码')

	.add('addred >> 添加跳转文章')
	.addOption('--origin -o <origin> >> 原文章目录')
	.addOption('--category -c <category> >> 目标文章目录')

	.add('update >> 更新记录时间')
	.setParam('[path] >> 指定文件路径')

	.add('generateKey >> 生成 AES-256-GCM Key文件')
	.setParam('<keyFile> >> Key文件保存路径')

	.add('reheat >> 重新生成文章相关度矢量')

	.on('command', (param, command) => {
		var cfg = param.config;
		if (!!cfg) {
			if (String.is(cfg)) {
				let c;
				try {
					c = require(cfg);
				} catch {
					try {
						c = require(require('path').join(process.cwd(), cfg));
					} catch {
						c = null;
					}
				}
				if (!!c) config = c;
			}
		}
		if (!!config) global.Schwarzschild.config = config;
		Schwarzschild.config.database = Schwarzschild.config.database || 'granary';

		var cmd = param.mission;
		if (cmd.length > 0) cmd = cmd[0];
		else return;

		if (cmd.name === 'build') Schwarzschild.prepare(cmd.value.force, cmd.value.clear, cmd.value.onlyapi);
		else if (cmd.name === 'demo') Schwarzschild.demo(cmd.value.force, cmd.value.clear, cmd.value.onlyapi);
		else if (cmd.name === 'publish') Schwarzschild.publish(cmd.value.path, cmd.value.msg, cmd.value.onlyapi, cmd.value.removeMaps, !cmd.value.notcompress);
		else if (cmd.name === 'append') Schwarzschild.appendFile(
			cmd.value.file, cmd.value.category,
			cmd.value.title, cmd.value.author, cmd.value.publishAt,
			cmd.value.overwrite, cmd.value.rename, cmd.value.keep,
			cmd.value.encrypt, cmd.value.password);
		else if (cmd.name === 'addred') Schwarzschild.appendRedirect(cmd.value.origin, cmd.value.category);
		else if (cmd.name === 'update') Schwarzschild.updateLogTime(cmd.value.path);
		else if (cmd.name === 'compress') Schwarzschild.compress();
		else if (cmd.name === 'generateKey') Schwarzschild.generateKeyFile(cmd.value.keyFile);
		else if (cmd.name === 'reheat') Schwarzschild.reheat();
	})
	.launch();
};
Schwarzschild.prepare = async (force=false, clear=false, onlyapi=false, isDemo=true, compress=false) => {
	if (clear) await FS.deleteFolders(OutPutPath, true);

	var has = await FS.hasFile(OutPutPath), map, folders;
	if (!!force || !has) {
		map = await FS.getFolderMap(__dirname, FolderForbiddens);
		map = FS.convertFileMap(map);
		map.folders = map.folders.map(f => f.replace(__dirname, OutPutPath));
		map.folders.unshift(OutPutPath);
		folders = [];
		map.folders.forEach(f => {
			var l = f.split(/[\\|\/]/).length;
			folders[l] = folders[l] || [];
			folders[l].push(f);
		});
		for (let subs of folders) {
			if (!subs || subs.length === 0) continue;
			await FS.createFolders(subs);
		}

		await Promise.all(map.files.map(async file => {
			var target = file.replace(__dirname, OutPutPath);
			if (await copyFile(file, target)) console.log('复制模组文件: ' + file);
		}));
	}

	map = await FS.getFolderMap(SitePath, FolderForbiddens);
	map = FS.convertFileMap(map);
	map.folders = map.folders.map(f => f.replace(SitePath, OutPutPath));
	folders = [];
	map.folders.forEach(f => {
		var l = f.split(/[\\|\/]/).length;
		folders[l] = folders[l] || [];
		folders[l].push(f);
	});
	for (let subs of folders) {
		if (!subs || subs.length === 0) continue;
		await FS.createFolders(subs);
	}

	await Promise.all(map.files.map(async file => {
		var target = file.replace(SitePath, OutPutPath);
		if (await copyFile(file, target)) console.log('复制客制文件: ' + file);
	}));

	// 将模组内容替换为项目内容
	var tasks;
	if (onlyapi) tasks = [assembleAPI(isDemo), assembleImages(isDemo)];
	else tasks = [
		assemblejLAss(isDemo),
		assembleAPI(isDemo),
		assembleImages(isDemo),
		realizeGranaryConfig(isDemo),
		realizeCustomPages(isDemo),
		realizeMiddleGround(isDemo),
		realizeSiteTitle(isDemo),
		realizeSiteMenu(isDemo),
		realizeAboutSite(isDemo),
		realizeTailBar(isDemo),
		realizeManifest(isDemo),
		realizeKeyManager(isDemo),
	];
	await Promise.all(tasks);
	if (compress) await Schwarzschild.compress();
};
Schwarzschild.demo = async (force=false, clear=false, onlyapi=false) => {
	await Schwarzschild.prepare(force, clear, onlyapi, true);
	await runVUE('serve');
};
Schwarzschild.publish = async (publishPath, commitMsg, onlyapi=false, removeMaps=false, compress=true) => {
	publishPath = publishPath || Schwarzschild.config.publish;
	if (commitMsg === true) commitMsg = 'Update: ' + getTimeString(new Date());

	if (onlyapi) {
		await Promise.all([assembleAPI(false, publishPath), assembleImages(false, publishPath)]);
		console.log(setStyle(setStyle('已将API文件发布到指定位置：' + publishPath, 'bold'), 'green'));
	}
	else {
		await Promise.all([
			(async () => {
				await Schwarzschild.prepare(true, true, onlyapi, false, compress);
				await runVUE('build');
			})(),
			removeOldPublishFiles(Path.join(publishPath, 'js')),
			removeOldPublishFiles(Path.join(publishPath, 'css'))
		]);
		await Promise.all([
			FS.copyFolder(BuildPath, publishPath),
			updateSingleFile('README.md', publishPath),
			updateSingleFile('LICENSE', publishPath)
		]);
		if (removeMaps) await removeJSMapFiles(Path.join(publishPath, 'js'));
		console.log(setStyle(setStyle('已发布到指定位置：' + publishPath, 'bold'), 'green'));
	}
	if (String.is(commitMsg)) gitAddAndCommit(publishPath, commitMsg);
};
Schwarzschild.generateKeyFile = async (filename) => {
	var key = await Crypto.generateKey({
		name: "AES-GCM",
		length: 256
	}, true, ["encrypt", "decrypt"]);
	key = await Crypto.exportKey("raw", key);
	await FS.writeFile(filename, Buffer.from(key).toString('base64'), 'utf-8');
};
Schwarzschild.appendFile = async (filename, category, title, author, timestamp, overwrite=false, rename=false, keep=false, encrypt=false, password) => {
	if (!filename) {
		console.error('缺少文章路径！');
		return;
	}
	if (!category) {
		console.error('缺少文章类别！');
		return;
	}

	// 准备目标路径
	var useEncrypt = !!encrypt;
	var categoryPath = Path.join(DataPath, Schwarzschild.config.database);
	category = category.split(/[\\\/]+/).filter(c => c.length > 0);
	var target = Path.basename(filename);
	if (useEncrypt) {
		if (target.match(/\.md$/i)) {
			target = target.replace(/\.md$/i, '.emd');
		}
		else if (target.match(/\.mu$/i)) {
			target = target.replace(/\.mu$/i, '.emu');
		}
		else {
			target = target + '.emd';
		}
	}
	var fullFolderPath = Path.join(categoryPath, ...category);
	var fullFilePath = Path.join(fullFolderPath, target);

	// 判断是否已有文件
	var exists = await FS.hasFile(fullFilePath);
	if (exists && !overwrite) {
		if (rename) {
			let ext = Path.extname(target);
			let bar = target.substr(0, target.length - ext.length);
			let i = 0;
			while (true) {
				let f = Path.join(fullFolderPath, bar + '-' + i + ext);
				exists = await FS.hasFile(f);
				if (!exists) {
					fullFilePath = f;
					break;
				}
				i ++;
			}
		}
		else {
			console.log('此文件已存在，请修改名称或类别后再添加。');
			return;
		}
	}

	// 创建目标路径
	try {
		await preparePath(fullFolderPath);
	}
	catch (err) {
		console.error('创建分类目录失败：' + err.toString());
		return;
	}

	var hasTT = String.is(title);
	var hasAU = String.is(author);
	var hasDT = timestamp instanceof Date;
	if (!hasDT && String.is(timestamp)) {
		try {
			let t = new Date(timestamp);
			hasDT = true;
			timestamp = t;
		} catch {}
	}

	// 如果必须信息都外部输入
	var content;
	try {
		content = await FS.readFile(filename);
		content = content.toString();
	}
	catch (err) {
		if (err.code === 'ENOENT') {
			console.error(setStyle('指定文件不存在！', 'red'));
		}
		else {
			console.error(err);
		}
		return;
	}
	content = MarkUp.fullPlainify(content);

	// 自动生成摘要
	title = title || content.title;
	var description = content.content;
	if (description > 150) description = description.substring(0, 148) + "……";
	author = author || content.meta.author || Schwarzschild.config.owner;
	if (!timestamp && (content.meta.update || content.meta.publish)) {
		timestamp = new Date(content.meta.update || content.meta.publish);
	}
	timestamp = timestamp || new Date();

	// 加密文件
	if (useEncrypt) {
		let key;
		if (String.is(encrypt)) {
			try {
				key = await FS.readFile(encrypt, 'utf-8');
				key = Buffer.from(key, 'base64');
			} catch {
				console.error('指定的秘钥文件（' + encrypt + '）不存在或已损坏，将使用自带默认秘钥。');
			}
		}
		else {
			try {
				key = await FS.readFile(Schwarzschild.config.key, 'utf-8');
				key = Buffer.from(key, 'base64');
			} catch {
				console.error('指定的秘钥文件（' + Schwarzschild.config.key + '）不存在或已损坏，将使用自带默认秘钥。');
			}
		}
		if (!key) {
			try {
				key = await FS.readFile(Path.join(__dirname, './default.key'), 'utf-8');
				key = Buffer.from(key, 'base64');
			} catch {
				console.error('自带默认秘钥文件丢失或损坏，请重新生成 AES-256-GCM 秘钥文件！');
				return;
			}
		}
		key = await Crypto.importKey("raw", key, "AES-GCM", true, ["encrypt", "decrypt"]);
		let content = await FS.readFile(filename, 'utf-8');
		let enc = new TextEncoder(), iv;
		if (!!password) {
			iv = enc.encode(password);
		}
		else {
			iv = getRandomValues(new Uint8Array(32));
			console.log('请记住 iv 密码（HEX 格式）：' + (Buffer.from(iv)).toString('base64'));
		}
		content = await Crypto.encrypt({ name: "AES-GCM", iv }, key, enc.encode(content));
		content = Buffer.from(content).toString('base64');
		let ecryptedFilename;
		if (filename.match(/\.md$/i)) {
			ecryptedFilename = filename.replace(/\.md$/i, '.emd');
		}
		else if (filename.match(/\.mu$/i)) {
			ecryptedFilename = filename.replace(/\.mu$/i, '.emu');
		}
		else {
			ecryptedFilename = filename + '.emd';
		}
		await FS.writeFile(ecryptedFilename, content, 'utf-8');
		if (!keep) await FS.deleteFiles([filename]);
		filename = ecryptedFilename;
	}

	// 复制文件
	try {
		await FS.copyFile(filename, fullFilePath);
		console.log('成功复制文件: ' + fullFilePath);
	}
	catch (err) {
		console.error('复制文件出错：' + err.toString());
		return;
	}
	if (!keep) {
		try {
			await FS.deleteFiles([filename]);
		}
		catch (err) {
			console.error('删除副本出错：' + err.toString());
		}
	}

	// 更新总记录
	var now = Date.now();
	var granaryFile = Path.join(DataPath, 'sources.json');
	var granaryRecord;
	try {
		granaryRecord = await FS.readFile(granaryFile);
		granaryRecord = JSON.parse(granaryRecord);
	}
	catch {
		granaryRecord = {
			update: 0,
			sources: []
		};
	}
	granaryRecord.sources = granaryRecord.sources || [];
	var myRecord = null;
	granaryRecord.sources.some(rec => {
		if (rec.owner !== Schwarzschild.config.owner) return;
		myRecord = rec;
	});
	if (!myRecord) {
		myRecord = {
			owner: Schwarzschild.config.owner,
			pages: 0,
			update: now
		};
		granaryRecord.sources.push(myRecord);
	}
	myRecord.pages = myRecord.pages || 0;
	myRecord.update = now;
	granaryRecord.update = now;

	// 更新分记录
	var recordFile, records;
	while (true) {
		recordFile = Path.join(DataPath, Schwarzschild.config.owner + '-' + myRecord.pages + '.json');
		try {
			records = await FS.readFile(recordFile);
			records = JSON.parse(records);
		}
		catch {
			records = {
				update: 0,
				articles: [],
				comments: []
			};
		}
		if (records.articles.length < RecordPerFile && records.comments.length < RecordPerFile) {
			break;
		}
		myRecord.pages ++;
	}
	records.update = now;
	var articlesList = {};
	records.articles.forEach(item => {
		var path;
		if (item.type === 'article') path = item.sort + '/' + item.filename;
		else if (item.type === 'redirect') path = item.sort + '=>' + item.target;
		else return;
		var old = articlesList[path];
		if (!old || item.publish > old.publish) articlesList[path] = item;
	});
	var item = {
		"type": "article",
		"sort": category.join('/'),
		title, author, description,
		"publish": timestamp.getTime(),
		"filename": target
	};
	await calculateLikehoodForArticle(fullFilePath, item);
	articlesList[category.join('/') + '/' + target] = item;
	records.articles = Object.values(articlesList);
	records.articles.sort((itemA, itemB) => itemB.publish - itemA.publish);

	// 保存
	await Promise.all([
		FS.writeFile(recordFile, JSON.stringify(records)),
		FS.writeFile(granaryFile, JSON.stringify(granaryRecord))
	]);
	console.log('记录已更新！');
};
Schwarzschild.appendRedirect = async (origin, category) => {
	if (!origin) {
		console.error('缺少原始文章分类！');
		return;
	}
	if (!category) {
		console.error('缺少目标文章分类！');
		return;
	}
	category = category.split(/[\\\/]+/).filter(c => c.length > 0).join('/');

	// 读取原始记录
	var granaryFile = Path.join(DataPath, 'sources.json'), granaryRecord;
	try {
		granaryRecord = await FS.readFile(granaryFile);
		granaryRecord = JSON.parse(granaryRecord);
	}
	catch {
		console.error('无目标记录！');
		return;
	}
	if (!granaryRecord.sources || granaryRecord.sources.length === 0) {
		console.error('无目标记录！');
		return;
	}
	var myRecord = null;
	granaryRecord.sources.some(conf => {
		if (conf.owner === Schwarzschild.config.owner) {
			myRecord = conf;
			return true;
		}
	});
	if (!myRecord) {
		console.error('无目标记录！');
		return;
	}

	var recordFile, records, originInfo = null;
	for (let i = 0; i <= myRecord.pages; i ++) {
		recordFile = Path.join(DataPath, Schwarzschild.config.owner + '-' + myRecord.pages + '.json');
		try {
			records = await FS.readFile(recordFile);
			records = JSON.parse(records);
		}
		catch {
			continue;
		}
		if (!records.articles || records.articles.length === 0) continue;
		records.articles.some(article => {
			if (article.type !== 'article') return;
			if (article.sort + '/' + article.filename !== origin) return;
			originInfo = article;
		});
	}
	if (!originInfo) {
		console.error('无目标记录！');
		return;
	}

	var now = Date.now();

	// 更新分记录
	while (true) {
		recordFile = Path.join(DataPath, Schwarzschild.config.owner + '-' + myRecord.pages + '.json');
		try {
			records = await FS.readFile(recordFile);
			records = JSON.parse(records);
		}
		catch {
			records = {
				update: 0,
				articles: [],
				comments: []
			};
		}
		if (records.articles.length < RecordPerFile && records.comments.length < RecordPerFile) {
			break;
		}
		myRecord.pages ++;
	}
	records.update = now;
	var articlesList = {};
	records.articles.forEach(item => {
		var path;
		if (item.type === 'article') path = item.sort + '/' + item.filename;
		else if (item.type === 'redirect') path = item.sort + '=>' + item.target;
		else return;
		var old = articlesList[path];
		if (!old || item.publish > old.publish) articlesList[path] = item;
	});
	articlesList[category + '=>' + origin] = {
		"type": "redirect",
		"sort": category,
		title: originInfo.title,
		author: originInfo.author,
		description: originInfo.description,
		"publish": now,
		"target": origin
	};
	records.articles = Object.values(articlesList);
	records.articles.sort((itemA, itemB) => itemB.publish - itemA.publish);

	// 更新总记录
	myRecord.update = now;
	granaryRecord.update = now;

	// 保存
	await Promise.all([
		FS.writeFile(recordFile, JSON.stringify(records)),
		FS.writeFile(granaryFile, JSON.stringify(granaryRecord))
	]);
	console.log('记录已更新！');
};
Schwarzschild.updateLogTime = async (filename) => {
	var tasks = [];
	var deepUpdate = !!filename;
	var timestamp = Date.now();
	if (deepUpdate) {
		filename = filename.replace(/\//g, '\\');
	}

	var mainLogFilePath = Path.join(DataPath, 'sources.json');
	var mainLogFile;
	try {
		mainLogFile = await FS.readFile(mainLogFilePath);
		mainLogFile = JSON.parse(mainLogFile);
	}
	catch {
		mainLogFile = {
			update: 0,
			sources: []
		};
	}
	mainLogFile.update = timestamp;

	mainLogFile.sources.forEach(sourceInfo => {
		sourceInfo.update = timestamp;
		let list = Array.generate(sourceInfo.pages + 1).map(async page => {
			var recordFilePath = Path.join(DataPath, sourceInfo.owner + '-' + page + '.json');
			var recordFile;
			try {
				recordFile = await FS.readFile(recordFilePath);
				recordFile = JSON.parse(recordFile);
			}
			catch {
				return;
			}

			recordFile.update = timestamp;

			if (deepUpdate) {
				let updateTask;
				recordFile.articles.some(item => {
					if (item.type !== 'article') return;
					var filepath = Path.join(item.sort, item.filename);
					if (filepath !== filename) return;
					item.publish ++;
					filepath = Path.join(DataPath, Schwarzschild.config.database, filepath);
					updateTask = [filepath, item];
					return true;
				});
				if (!!updateTask) await calculateLikehoodForArticle(...updateTask);
			}

			await FS.writeFile(recordFilePath, JSON.stringify(recordFile));
		});
		tasks.push(...list);
	});
	tasks.push(FS.writeFile(mainLogFilePath, JSON.stringify(mainLogFile)));

	await Promise.all(tasks);
	console.log('数据日志记录更新成功');
};
Schwarzschild.compress = async () => {
	var publicFolder = Path.join(OutPutPath, 'public/');
	var map = await FS.getFolderMap(publicFolder);
	map = FS.convertFileMap(map).files.filter(url => !url.match(/(mathjax|\.min\.)/i) && url.match(/\.(js)$/i));
	map = map.map(filepath => compressFile(filepath));
	await Promise.all(map);
};
Schwarzschild.reheat = async () => {
	var file = Path.join(DataPath, 'sources.json');
	var data = await FS.readFile(file);
	data = data.toString();
	data = JSON.parse(data);
	var tasks = [];
	data.sources.forEach(item => {
		Array.generate(item.pages + 1).forEach(i => {
			var path = Path.join(DataPath, item.owner + '-' + i + '.json');
			tasks.push(calculateLikehood(path));
		});
	});
	await Promise.all(tasks);
	console.log('所有文件的偏好矢量已计算完毕');
};

module.exports = Schwarzschild;