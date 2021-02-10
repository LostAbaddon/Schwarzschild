const Path = require('path');
const FS = require('fs/promises');
const VueService = require('@vue/cli-service');

require("jLAss");
loadjLAssModule('fs');
loadjLAssModule('commandline');

const jLAssPath = "node_modules/jLAss";
const execSync = require('child_process').execSync;
const CLP = _('CL.CLP');
const setStyle = _('CL.SetStyle');
const FolderForbiddens = ['node_modules', 'dist', 'server', '.git', '.gitignore', '.browserslistrc'];

const convertFileMap = map => {
	var result = { files: [], folders: [] };
	result.files.push(...map.files);
	var folders = Object.keys(map.subs);
	result.folders.push(...folders);
	folders.forEach(sub => {
		var subs = map.subs[sub];
		subs = convertFileMap(subs);
		result.files.push(...subs.files);
		result.folders.push(...subs.folders);
	});
	return result;
};

const SitePath = Path.join(process.cwd(), 'site');
const OutPutPath = Path.join(process.cwd(), 'output');
const BuildPath = Path.join(OutPutPath, 'dist');
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
const needCopyFile = async (source, target) => {
	var info1, info2, time1 = 0, time2 = 0, empty = false;
	try	{
		info1 = await FS.stat(source);
		time1 = Math.max(info1.mtimeMs, info1.ctimeMs);
	} catch {
		time1 = 0;
		empty = true;
	}
	try {
		info2 = await FS.stat(target);
		time2 = Math.max(info2.mtimeMs, info2.ctimeMs);
	} catch {
		time2 = 0;
	}
	if (empty) return false;
	if (time1 === time2) return false;
	return true;
};
const copyFile = async (source, target) => {
	if (await needCopyFile(source, target)) {
		await FS.copyFile(source, target);
		return true;
	}
	return false;
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
		await FS.writeFile(navMenuFile, navMenu, 'utf-8');
	}
	catch (err) {
		console.error(err);
	}
};
const assemblejLAss = async () => {
	if (!Schwarzschild.config.jLAss) return;
	Schwarzschild.config.jLAss = ['extends'];
	var jpath = Path.join(__dirname, jLAssPath, 'src');

	// 准备目录
	var outputPath = Path.join(OutPutPath, 'src/assets/jLAss');
	var sourcePath = Path.join(OutPutPath, 'src');
	if (!(await FS.hasFile(outputPath))) await FS.createFolders([outputPath]);
	var files = [
		[Path.join(jpath, 'index.js'), Path.join(outputPath, 'index.js')],
		[Path.join(jpath, 'namespace.js'), Path.join(outputPath, 'namespace.js')],
		[Path.join(jpath, 'utils/datetime.js'), Path.join(outputPath, 'utils/datetime.js')],
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
	var imports = [];
	await Promise.all(files.map(async f => {
		var index = imports.length;
		imports[index] = '';
		if (!(await needCopyFile(f[0], f[1]))) return;
		var content = await FS.readFile(f[0]);
		content = content.toString();
		content = content.replace(/require\(.+\)/g, '{};');
		try {
			await FS.writeFile(f[1], content, 'utf-8');
			imports[index] = 'import jlass' + (index + 1) + ' from "' + f[1].replace(sourcePath, '.').replace(/\\/g, '/') + '"';
			console.log('复制jLAss文件: ' + f[0]);
		}
		catch (err) {
			console.error('写入jLAss文件(' + f[1] + ')失败: ', err.toString());
		}
	}));

	// 添加引用
	var mainPath = Path.join(OutPutPath, 'src/main.js');
	var content = await FS.readFile(mainPath);
	content = imports.join('\n') + '\n' + content.toString();
	await FS.writeFile(mainPath, content, 'utf-8');
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
	.add('demo >> 启动网站测试服务')
	.addOption('--force -f >> 强制更新所有文件')
	.addOption('--clear -r >> 强制清除所有文件')
	.add('publish >> 打包网站')
	.setParam('[path] >> 指定发布路径')
	.addOption('--msg -m [msg] >> Git Commit 信息')
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

		if (cmd.name === 'build') Schwarzschild.prepare(cmd.value.force, cmd.value.clear);
		else if (cmd.name === 'demo') Schwarzschild.demo(cmd.value.force, cmd.value.clear);
		else if (cmd.name === 'publish') Schwarzschild.publish(cmd.value.path, cmd.value.msg);
	}).launch();
};
Schwarzschild.prepare = async (force=false, clear=false, isDemo=true) => {
	if (clear) await FS.deleteFolders(OutPutPath, true);

	var has = await FS.hasFile(OutPutPath), map, folders;
	if (!!force || !has) {
		map = await FS.getFolderMap(__dirname, FolderForbiddens);
		map = convertFileMap(map);
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
	map = convertFileMap(map);
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
	await Promise.all([
		assemblejLAss(),
		realizeSiteTitle(isDemo),
		realizeSiteMenu(isDemo)
	]);
};
Schwarzschild.demo = async (force=false, clear=false) => {
	await Schwarzschild.prepare(force, clear, true);
	await runVUE('serve');
};
Schwarzschild.publish = async (publishPath, commitMsg) => {
	publishPath = publishPath || Schwarzschild.config.publish;
	if (commitMsg === true) commitMsg = 'Update: ' + getTimeString(new Date());

	await Schwarzschild.prepare(true, true, false);
	await runVUE('build');

	var map = await FS.getFolderMap(BuildPath, FolderForbiddens);
	map = convertFileMap(map);
	map.folders = map.folders.map(f => f.replace(BuildPath, publishPath));
	var folders = [];
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
		var target = file.replace(BuildPath, publishPath);
		await FS.copyFile(file, target);
	}));

	console.log(setStyle(setStyle('已发布到指定位置：' + publishPath, 'bold'), 'green'));

	if (String.is(commitMsg)) gitAddAndCommit(publishPath, commitMsg);
};

module.exports = Schwarzschild;