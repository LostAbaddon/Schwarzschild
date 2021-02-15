import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Category from '../views/Category.vue'

Vue.use(VueRouter)

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
		path: '/entertain/rushgo',
		name: 'RushGo',
		component: Category
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
]

const router = new VueRouter({
	mode: 'hash',
	base: process.env.BASE_URL,
	routes
});

export default router