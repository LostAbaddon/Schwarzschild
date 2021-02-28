import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Category from '../views/Category.vue'
import Viewer from '../views/viewer.vue'

Vue.use(VueRouter);

const routes = [
	{
		path: '/',
		name: 'Home',
		component: Home
	},
	{
		path: '/category',
		name: 'Category',
		component: Category
	},
	{
		path: '/view',
		name: 'Viewer',
		component: Viewer
	},
	{
		path: '/about',
		name: 'AboutSite',
		component: function () {
			return import('../views/about/site.vue')
		}
	},
	{ aboutMe: 'aboutMe' },
	{
		path: '*',
		name: 'PageNotFound',
		component: function () {
			return import('../views/404.vue')
		}
	}
];

const router = new VueRouter({
	mode: 'hash',
	base: process.env.BASE_URL,
	routes
});
router.afterEach((to, from) => {
	if (to.name === 'Category') {
		let list = getPathNameList(to.query.c.split(','), false);
		if (!list) {
			document.title = Vue.prototype.SiteName;
		}
		else {
			document.title = Vue.prototype.SiteName + ' / ' + list.map(c => c.name).join(' / ');
		}
	}
	else {
		document.title = Vue.prototype.SiteName;
	}
	document.querySelector('#app').scrollTo(0, 0);
});

export default router;