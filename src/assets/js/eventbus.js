const EventBus = {};

window.EventBus = {
	async pub (ch, msg) {
		if (!String.is(ch)) return false;
		var bus = EventBus[ch];
		if (!bus) return false;
		await Promise.all(bus.map(cb => cb(msg)));
		return true;
	},
	sub (ch, cb) {
		if (!String.is(ch)) return false;
		var bus = EventBus[ch];
		if (!bus) {
			bus = [];
			EventBus[ch] = bus;
		}
		bus.push(cb);
	}
};