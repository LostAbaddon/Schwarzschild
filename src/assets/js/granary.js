// 资源管理
window.Granary = {
	async get (type, category) {
		var res = await axios.get('/api/sources.json');
		console.log(res);
		await wait(1000);
	}
};