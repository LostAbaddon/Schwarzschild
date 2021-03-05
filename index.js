const Path = require('path');
const FS = require('fs/promises');
const VueService = require('@vue/cli-service');

require("jLAss");
loadjLAssModule('fs');
loadjLAssModule('commandline');

const RecordPerFile = 100;
const execSync = require('child_process').execSync;
const CLP = _('CL.CLP');
const setStyle = _('CL.SetStyle');
const preparePath = _("Utils").preparePath;
const FolderForbiddens = ['node_modules', 'dist', 'server', '.git', '.gitignore', '.browserslistrc'];

const SitePath = Path.join(process.cwd(), 'site');
const OutPutPath = Path.join(process.cwd(), 'output');
const BuildPath = Path.join(OutPutPath, 'dist');
const APIPath = Path.join(process.cwd(), 'api');
const getTimeString = _('Utils').getTimeString;

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
const realizeHomePage = async (isDemo) => {
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
				try {
					await FS.copyFile(filepath, target);
					html = html.replace(
						/<script type="text\/javascript" src="<%= BASE_URL %>js\/patch\.js"><\/script>/i,
						'<script type="text/javascript" src="<%= BASE_URL %>js/patch.js"></script><script type="text/javascript" src="<%= BASE_URL %>js/' + filename + '"></script>'
					);
				} catch {}
			}
		}

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
		cfg = cfg.replace("DataGranary: '/api/granary'", "DataGranary: '/api/" + Schwarzschild.config.database + "'");
		await FS.writeFile(Path.join(OutPutPath, "/src/assets/js/granary.js"), cfg, 'utf-8');
		console.log('granary.js文件配置成功');
	} catch (err) {
		console.error(err);
	}
};
const assemblejLAss = async (isDemo) => {
	if (!Schwarzschild.config.jLAss) return;
	Schwarzschild.config.jLAss = ['extends'];
	var jpath = Path.join(__dirname, 'node_modules/jLAss/src');

	// 准备目录
	var outputPath = Path.join(OutPutPath, 'src/assets/jLAss');
	var sourcePath = Path.join(OutPutPath, 'src');
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
			imports[index] = 'import "' + f[1].replace(sourcePath, '.').replace(/\\/g, '/') + '"';
			return;
		}
		var content = await FS.readFile(f[0]);
		content = content.toString();
		content = content.replace(/require\(.+\)/g, '{};');
		try {
			await FS.writeFile(f[1], content, 'utf-8');
			imports[index] = 'import "' + f[1].replace(sourcePath, '.').replace(/\\/g, '/') + '"';
			console.log('复制jLAss文件: ' + f[0]);
		}
		catch (err) {
			console.error('写入jLAss文件(' + f[1] + ')失败: ', err.toString());
		}
	}));
	console.log('jLAss 插件准备完毕');

	// 复制 MarkUp 文件
	await FS.copyFolder(Path.join(__dirname, 'node_modules/Asimov'), Path.join(OutPutPath, 'public/Asimov'));
	console.log('Asimov 线程内模块准备完毕');

	// 添加引用
	var content = await FS.readFile(Path.join(__dirname, 'src/main.js'));
	content = content.toString().replace(/":TITLE:"/gi, JSON.stringify(Schwarzschild.config.title + (isDemo ? ' (demo)' : '')));
	content = content.replace(/":OWNER:"/gi, JSON.stringify(Schwarzschild.config.owner || Schwarzschild.pkg.author.name));
	if (!!Schwarzschild.config.likeCoin) {
		content = content.replace(/":LIKECOIN:"/gi, JSON.stringify(Schwarzschild.config.likeCoin));
	}
	else {
		content = content.replace(/":LIKECOIN:"/gi, 'null');
	}
	content = imports.join('\n') + '\n\n' + content;
	await FS.writeFile(Path.join(OutPutPath, 'src/main.js'), content, 'utf-8');
};
const assembleAPI = async (isDemo, publishPath) => {
	var source = Path.join(process.cwd(), 'api');
	var target;
	if (!!publishPath) target = Path.join(publishPath, 'api');
	else target = Path.join(OutPutPath, 'public/api');
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
		if (!name.match(/^(\w+\-\w+|index)\.\w+\.(js|css|js\.map)$/i)) return;
		return true;
	});
	await FS.deleteFiles(map);
};
const removeJSMapFiles = async (targetPath) => {
	var map = await FS.getFolderMap(targetPath, FolderForbiddens);
	map = FS.convertFileMap(map).files;
	map = map.filter(f => {
		var name = Path.basename(f);
		if (!name.match(/^(\w+\-\w+|index)\.\w+\.js\.map$/i)) return;
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

	.add('publish >> 打包网站')
	.setParam('[path] >> 指定发布路径')
	.addOption('--onlyapi -o >> 只复制API文件')
	.addOption('--removeMaps -r >> 删除JS-Map')
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
		else if (cmd.name === 'publish') Schwarzschild.publish(cmd.value.path, cmd.value.msg, cmd.value.onlyapi, cmd.value.removeMaps);
		else if (cmd.name === 'append') Schwarzschild.appendFile(
			cmd.value.file, cmd.value.category,
			cmd.value.title, cmd.value.author, cmd.value.publishAt,
			cmd.value.overwrite, cmd.value.rename, cmd.value.keep);
	})
	.launch();
};
Schwarzschild.prepare = async (force=false, clear=false, onlyapi=false, isDemo=true) => {
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
		realizeHomePage(isDemo),
		realizeGranaryConfig(isDemo),
		realizeCustomPages(isDemo),
		realizeMiddleGround(isDemo),
		realizeSiteTitle(isDemo),
		realizeSiteMenu(isDemo),
		realizeAboutSite(isDemo),
		realizeTailBar(isDemo),
		realizeManifest(isDemo),
	];
	await Promise.all(tasks);
};
Schwarzschild.demo = async (force=false, clear=false, onlyapi=false) => {
	await Schwarzschild.prepare(force, clear, onlyapi, true);
	await runVUE('serve');
};
Schwarzschild.publish = async (publishPath, commitMsg, onlyapi=false, removeMaps=false) => {
	publishPath = publishPath || Schwarzschild.config.publish;
	if (commitMsg === true) commitMsg = 'Update: ' + getTimeString(new Date());

	if (onlyapi) {
		await Promise.all([assembleAPI(false, publishPath), assembleImages(false, publishPath)]);
		console.log(setStyle(setStyle('已将API文件发布到指定位置：' + publishPath, 'bold'), 'green'));
	}
	else {
		await Promise.all([
			(async () => {
				await Schwarzschild.prepare(true, true, onlyapi, false);
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
Schwarzschild.appendFile = async (filename, category, title, author, timestamp, overwrite=false, rename=false, keep=false) => {
	if (!filename) {
		console.error('缺少文章路径！');
		return;
	}
	if (!category) {
		console.error('缺少文章类别！');
		return;
	}

	// 准备目标路径
	var categoryPath = Path.join(APIPath, Schwarzschild.config.database);
	category = category.split(/[\\\/]+/).filter(c => c.length > 0);
	var target = Path.basename(filename);
	var fullFolderPath = Path.join(categoryPath, ...category);
	var fullFilePath = Path.join(fullFolderPath, target);

	// 判断是否已有文件
	var exists = await FS.hasFile(fullFilePath);
	if (exists && !overwrite) {
		if (rename) {
			let ext = Path.extname(filename);
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
	var content, description, text = [];
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
	content = content.split(/[\n\r]+/);
	content.some(line => {
		var m = line.match(/^(标题|title)[：:] *(.+)/i);
		if (!!m) {
			if (!hasTT) {
				title = m[2];
				hasTT = true;
			}
			return hasTT && hasAU && hasDT && !!description;
		}

		m = line.match(/^(作者|author)[：:] *(.+)/i);
		if (!!m) {
			if (!hasAU) {
				author = m[2];
				hasAU = true;
			}
			return hasTT && hasAU && hasDT && !!description;
		}

		m = line.match(/^(更新|date)[：:] *(.+)/i);
		if (!!m) {
			if (!hasDT) {
				try {
					let t = new Date(m[2]);
					timestamp = t;
					hasAU = true;
				} catch {}
			}
			return hasTT && hasAU && hasDT && !!description;
		}

		m = line.match(/^(简介|description)[：:] *(.+)/i);
		if (!!m) {
			if (!description) {
				description = m[2];
			}
			return hasTT && hasAU && hasDT && !!description;
		}

		m = line.match(/^(关键词|keyword)[：:] *(.+)/i);
		if (!!m) {
			return hasTT && hasAU && hasDT && !!description;
		}

		text.push(line);
	});
	// 自动生成摘要
	if (!description) {
		text = text.map(t => t.replace(/\(.*\)/g, '')).join('');
		text = text.match(/([^\x00-\xff]|[a-zA-Z0-9]| )+/g);
		text = text.join(' ');
		text = text.replace(/ +/g, ' ');
		if (text.length > 150) text = text.substring(0, 148) + "……";
		description = text;
	}
	author = author || Schwarzschild.config.owner;
	timestamp = timestamp || new Date();

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
	var granaryFile = Path.join(APIPath, 'sources.json');
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
	granaryRecord.update = now;

	// 更新分记录
	var recordFile, records;
	while (true) {
		recordFile = Path.join(APIPath, Schwarzschild.config.owner + '-' + myRecord.pages + '.json');
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
		var path = item.sort + '/' + item.filename;
		articlesList[path] = item;
	});
	articlesList[category.join('/') + '/' + target] = {
		"type": "article",
		"sort": category.join('/'),
		title, author, description,
		"publish": timestamp.getTime(),
		"filename": target
	};
	records.articles = Object.values(articlesList);
	records.articles.sort((itemA, itemB) => itemB.publish - itemA.publish);

	// 保存
	await Promise.all([
		FS.writeFile(recordFile, JSON.stringify(records)),
		FS.writeFile(granaryFile, JSON.stringify(granaryRecord))
	]);
	console.log('记录已更新！');
};

module.exports = Schwarzschild;