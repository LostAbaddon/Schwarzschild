const Path = require('path');
const FS = require('fs/promises');
const VueService = require('@vue/cli-service');

require("jLAss");
// require("../jLAss");
loadjLAssModule('fs');
loadjLAssModule('commandline');

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
	// 将模组内容替换为项目内容
	var cfgFile = Path.join(OutPutPath, "vue.config.js");
	var cfg;
	try {
		cfg = await FS.readFile(cfgFile);
		cfg = cfg.toString();
		cfg = cfg.replace(/\[:Title:\]/gi, Schwarzschild.config.title + (cmd === 'serve' ? ' (demo)' : ''));
	} catch {
		cfg = {
			pages: {
				index: {
					entry: "src/main.js",
					title: Schwarzschild.config.title + (cmd === 'serve' ? ' (demo)' : '')
				}
			}
		};
		cfg = 'module.exports = ' + JSON.stringify(cfg, '\t', '\t') + ';';

	}
	await FS.writeFile(cfgFile, cfg, 'utf-8');

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
Schwarzschild.prepare = async (force=false, clear=false) => {
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
			await FS.copyFile(file, target);
			console.log('复制模组文件: ' + file);
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
		var need_copy = true;
		if (!force) {
			let info1 = await FS.stat(file);
			let info2 = await FS.stat(target);
			let time1 = Math.max(info1.mtimeMs, info1.ctimeMs);
			let time2 = Math.max(info2.mtimeMs, info2.ctimeMs);
			if (time1 === time2) need_copy = false;
		}
		if (need_copy) {
			await FS.copyFile(file, target);
			console.log('复制客制文件: ' + file);
		}
	}));
};
Schwarzschild.demo = async (force=false, clear=false) => {
	await Schwarzschild.prepare(force);
	await runVUE('serve');
};
Schwarzschild.publish = async (publishPath, commitMsg) => {
	publishPath = publishPath || Schwarzschild.config.publish;
	if (commitMsg === true) commitMsg = 'Update: ' + getTimeString(new Date());

	await Schwarzschild.prepare(true, true);
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