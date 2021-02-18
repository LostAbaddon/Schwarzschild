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
const CategoryPath = Path.join(APIPath, 'granary');
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
const realizeManifest = async (isDemo=false) => {
	var webAppFile = Path.join(OutPutPath, "/public/webapp.json");
	var webApp;
	try {
		webApp = await FS.readFile(webAppFile);
		webApp = webApp.toString();
		webApp = webApp.replace(/\[:title:\]/gi, Schwarzschild.config.title);
		webApp = webApp.replace(/\[:shortname:\]/gi, Schwarzschild.config.shortname || Schwarzschild.config.title);
		webApp = webApp.replace(/\[:description:\]/gi, Schwarzschild.config.description || Schwarzschild.config.title);
	} catch {
		return;
	}
	await FS.writeFile(webAppFile, webApp, 'utf-8');
};
const realizeSiteTitle = async (isDemo=false) => {
	var cfgFile = Path.join(OutPutPath, "vue.config.js");
	var cfg;
	try {
		cfg = await FS.readFile(cfgFile);
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
	await FS.writeFile(cfgFile, cfg, 'utf-8');
};
const realizeSiteMenu = async (isDemo) => {
	var navMenuFile = Path.join(OutPutPath, "src/components/navbar.vue");
	var navMenu;
	try {
		navMenu = await FS.readFile(navMenuFile);
		navMenu = navMenu.toString();
		navMenu = navMenu.replace(/\["site-menu"\]/gi, JSON.stringify(Schwarzschild.config.siteMap, "\t", "\t"));
		navMenu = navMenu.replace(/\[:site-about-me:\]/gi, !!Schwarzschild.config.aboutMe ? 'aboutMe' : '');
		await FS.writeFile(navMenuFile, navMenu, 'utf-8');
	}
	catch (err) {
		console.error(err);
	}
};
const realizeRouter = async (isDemo) => {
	var routerFile = Path.join(OutPutPath, "src/router/index.js");
	var router;
	try {
		router = await FS.readFile(routerFile);
		router = router.toString();
		let vueFile = '../' + Schwarzschild.config.aboutMe;
		if (!vueFile.match(/\.vue$/i)) vueFile = vueFile + '.vue';
		if (!!Schwarzschild.config.aboutMe) {
			router = router.replace(/{ aboutMe: 'aboutMe' },/gi, "{path:'/aboutMe',name:'AboutMe',component:function(){return import('" + vueFile + "')}},");
		}
		else {
			router = router.replace(/{ aboutMe: 'aboutMe' },/gi, "");
		}
		await FS.writeFile(routerFile, router, 'utf-8');
	}
	catch (err) {
		console.error(err);
	}
};
const realizeAboutSite = async (isDemo) => {
	var aboutSiteFile = Path.join(OutPutPath, "src/views/about/site.vue");
	var aboutSite;
	try {
		aboutSite = await FS.readFile(aboutSiteFile);
		aboutSite = aboutSite.toString();
		aboutSite = aboutSite.replace(/\[:library:\]/gi, Schwarzschild.pkg.name);
		aboutSite = aboutSite.replace(/\[:libraryPage:\]/gi, Schwarzschild.pkg.homepage);
		aboutSite = aboutSite.replace(/\[:version:\]/gi, "v" + Schwarzschild.pkg.version);
		aboutSite = aboutSite.replace(/\[:author:\]/gi, Schwarzschild.pkg.author.name);
		aboutSite = aboutSite.replace(/\[:mail:\]/gi, Schwarzschild.pkg.author.email);
		await FS.writeFile(aboutSiteFile, aboutSite, 'utf-8');
	}
	catch (err) {
		console.error(err);
	}
};
const realizeTailBar = async (isDemo) => {
	var tailBarFile = Path.join(OutPutPath, "src/components/tail.vue");
	var tailBar;
	try {
		tailBar = await FS.readFile(tailBarFile);
		tailBar = tailBar.toString();
		tailBar = tailBar.replace(/\[:library:\]/gi, Schwarzschild.pkg.name);
		tailBar = tailBar.replace(/\[:libraryPage:\]/gi, Schwarzschild.pkg.homepage);
		tailBar = tailBar.replace(/\[:version:\]/gi, Schwarzschild.pkg.version);
		tailBar = tailBar.replace(/\[:owner:\]/gi, Schwarzschild.config.owner || Schwarzschild.pkg.author.name);
		tailBar = tailBar.replace(/\[:now-year:\]/gi, (new Date()).getYear() + 1900);
		await FS.writeFile(tailBarFile, tailBar, 'utf-8');
	}
	catch (err) {
		console.error(err);
	}
};
const assemblejLAss = async () => {
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

	// 复制 MarkUp 文件
	var muPath = Path.join(__dirname, 'node_modules/Asimov');
	var outputPathP = Path.join(OutPutPath, 'public/Asimov');
	var outputPathA = Path.join(OutPutPath, 'src/assets/Asimov');
	var map;
	[map] = await Promise.all([
		FS.getFolderMap(muPath),
		FS.createFolders([outputPathP]),
		FS.createFolders([outputPathA]),
	]);
	var markups = [];
	await Promise.all(map.files.map(async (f, i) => {
		var o;
		if (f.match(/\.js$/i)) {
			o = f.replace(muPath, outputPathA);
			if (await copyFile(f, o)) console.log('复制Asimov文件: ' + f);
			o = o.replace(outputPathA, '.\\assets\\Asimov');
			if (o.match(/markup\.js/i)) {
				imports.push('import "' + o.replace(/\\/g, '/') + '"');
			}
			else if (!o.match(/index\.js/i)) {
				markups.push('import "' + o.replace(/\\/g, '/') + '"');
			}
		}
		else {
			o = f.replace(muPath, outputPathP);
			if (await copyFile(f, o)) console.log('复制Asimov文件: ' + f);
		}
	}));
	markups.forEach(f => imports.push(f));

	// 添加引用
	var content = await FS.readFile(Path.join(__dirname, 'src/main.js'));
	content = imports.join('\n') + '\n\n' + content.toString();
	await FS.writeFile(Path.join(OutPutPath, 'src/main.js'), content, 'utf-8');
};
const assembleAPI = async (publishPath) => {
	var source = Path.join(process.cwd(), 'api');
	var target;
	if (!!publishPath) target = Path.join(publishPath, 'api');
	else target = Path.join(OutPutPath, 'public/api');
	await FS.copyFolder(source, target);
	console.log('数据文件复制完毕');
};
const assembleImages = async (publishPath) => {
	var source = Path.join(process.cwd(), 'image');
	var target;
	if (!!publishPath) target = Path.join(publishPath, 'image');
	else target = Path.join(OutPutPath, 'public/image');
	await FS.copyFolder(source, target);
	console.log('图片资源复制完毕');
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

		var cmd = param.mission;
		if (cmd.length > 0) cmd = cmd[0];
		else return;

		if (cmd.name === 'build') Schwarzschild.prepare(cmd.value.force, cmd.value.clear, cmd.value.onlyapi);
		else if (cmd.name === 'demo') Schwarzschild.demo(cmd.value.force, cmd.value.clear, cmd.value.onlyapi);
		else if (cmd.name === 'publish') Schwarzschild.publish(cmd.value.path, cmd.value.msg, cmd.value.onlyapi);
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
	if (onlyapi) tasks = [assembleAPI(), assembleImages()];
	else tasks = [
		assemblejLAss(),
		assembleAPI(),
		assembleImages(),
		realizeSiteTitle(isDemo),
		realizeSiteMenu(isDemo),
		realizeRouter(isDemo),
		realizeAboutSite(isDemo),
		realizeTailBar(isDemo),
		realizeManifest(),
	];
	await Promise.all(tasks);
};
Schwarzschild.demo = async (force=false, clear=false, onlyapi=false) => {
	await Schwarzschild.prepare(force, clear, onlyapi, true);
	await runVUE('serve');
};
Schwarzschild.publish = async (publishPath, commitMsg, onlyapi=false) => {
	publishPath = publishPath || Schwarzschild.config.publish;
	if (commitMsg === true) commitMsg = 'Update: ' + getTimeString(new Date());

	if (onlyapi) {
		await assembleAPI(publishPath);
		console.log(setStyle(setStyle('已将API文件发布到指定位置：' + publishPath, 'bold'), 'green'));
	}
	else {
		await Schwarzschild.prepare(true, true, onlyapi, false);
		await runVUE('build');
		await FS.copyFolder(BuildPath, publishPath);
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
	category = category.split(/[\\\/]+/).filter(c => c.length > 0);
	var target = Path.basename(filename);
	var fullFolderPath = Path.join(CategoryPath, ...category);
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
	records.articles.push({
		"type": "article",
		"sort": category.join('/'),
		title, author, description,
		"publish": timestamp.getTime(),
		"filename": target
	});

	// 保存
	await Promise.all([
		FS.writeFile(recordFile, JSON.stringify(records)),
		FS.writeFile(granaryFile, JSON.stringify(granaryRecord))
	]);
	console.log('记录已更新！');
};

module.exports = Schwarzschild;