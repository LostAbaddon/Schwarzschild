<template>
	<div class="crumb" v-if="show">
		<span class="hint">位置：</span>
		<template v-for="(item, index) in path">
			<span @click="jump(item.path, item.query)">{{item.name}}</span><i class="fas fa-angle-right" />
		</template>
	</div>
</template>

<script>
var currCrumb = null;
PageBroadcast.on('page-changed', () => {
	setTimeout(() => {
		if (!currCrumb) return;
		currCrumb.update();
	}, 100);
});

export default {
	name: 'Crumb',
	data () {
		return {
			show: true,
			path: []
		}
	},
	props: {
		target: String
	},
	methods: {
		jump (path, query) {
			query = Proxy.toObject(query);
			var target = {path, query};
			this.$router.push(target);
			if (path === this.$route.path) PageBroadcast.emit('page-changed', target);
		},
		update () {
			var path = null, type = '', isLocal = !!this.$route.query.l;
			if (this.$route.path === '/') {
				path = null;
			}
			else if (this.$route.path === '/category') {
				if (!!this.$route.query && !!this.$route.query.c) {
					path = decodeURIComponent(this.$route.query.c).split(',').filter(c => c.length > 0);
					type = 'viewer';
				}
			}
			else if (this.$route.path === '/view') {
				let filename = this.$route.query.f || this.$route.query.l;
				if (!!this.$route.query && !!filename) {
					path = decodeURIComponent(filename).split('/');
					path.pop();
					path = path.filter(c => c.length > 0);
					type = 'view';
				}
			}
			else {
				let fullpath = this.target || this.$route.path;
				path = fullpath.split('/').filter(c => c.length > 0);
				type = 'view';
			}
			if (!path) {
				this.show = false;
				return;
			}

			this.show = true;
			this.path.splice(0, this.path.length);
			if (type === 'viewer' || type === 'page') path.pop();

			if (isLocal && path.length === 0) {
				path.push('tools', 'localLibrary');
			}
			this.path.push(...(getPathNameList(path)));
		}
	},
	mounted () {
		this.update();
		currCrumb = this;
	},
	unmounted () {
		currCrumb = null;
	}
}
</script>