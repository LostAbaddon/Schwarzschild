import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Category from '../views/Category.vue';
import Viewer from '../views/viewer.vue';

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
		path: '/404',
		name: 'PageNotFound',
		component: function () {
			return import('../views/404.vue')
		}
	},
	{
		path: '/:pathMatch(.*)*',
		name: 'PageNotFound',
		component: function () {
			return import('../views/404.vue')
		}
	}
];

const router = createRouter({
	history: createWebHashHistory(),
	routes
});
router.afterEach((to, from) => {
	if (to.name === 'Category') {
		let list = getPathNameList(to.query.c.split(','), false);
		if (!list) {
			document.title = router.app.config.globalProperties.SiteName;
		}
		else {
			document.title = router.app.config.globalProperties.SiteName + ' / ' + list.map(c => c.name).join(' / ');
		}
	}
	else {
		document.title = router.app.config.globalProperties.SiteName;
	}
	document.querySelector('#app').scrollTo(0, 0);
});

export default router;