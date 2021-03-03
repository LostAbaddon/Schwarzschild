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
const channel = new BroadcastChannel('page-changed');
channel.addEventListener('message', msg => {
	if (!currCrumb) return;
	currCrumb.update();
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
			if (path === this.$route.path) channel.postMessage(target);
		},
		update () {
			var path = null, type = '';
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
				if (!!this.$route.query && !!this.$route.query.f) {
					path = decodeURIComponent(this.$route.query.f).split('/');
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