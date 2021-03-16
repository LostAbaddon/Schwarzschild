import './assets/js/core.js';
import './assets/js/cacheCenter.js';
import './assets/js/lrucache.js';
import './assets/js/cacheDB.js';
import './assets/js/granary.js';
import './assets/js/markup.js';
import './assets/js/markup-footnote.js';
import './assets/js/imageWall.js';

import { createApp, inject } from 'vue'
import axios from 'axios';

import App from './App.vue';
import router from './router';

import Loading from '@/components/loading.vue';
import Notification from '@/components/notification.vue';
import NavBar from '@/components/navbar.vue';
import NavMenuBar from '@/components/navmenubar.vue';
import NavMenuItem from '@/components/navmenuitem.vue';
import TailBar from '@/components/tail.vue';
import KeyManager from '@/components/keyManager.vue';
import ImageShowcase from '@/components/imageShowcase.vue';
import Crumb from '@/components/crumb.vue';
import Column from '@/components/column.vue';

require('./assets/css/theme.css');
require('./assets/css/mobile.css');
require('./assets/css/main.css');
require('./assets/css/404.css');
require('./assets/css/navbar.css');
require('./assets/css/tail.css');
require('./assets/css/crumb.css');
require('./assets/css/column.css');
require('./assets/css/keyManager.css');
require('./assets/css/markup.css');
require('./assets/css/article.css');

global.axios = axios;

if (Devices.isMobile) document.body.classList.add('mobile');
else document.body.classList.add('notmobile');

(async () => {
	if (await LifeCycle.emit.loaded()) {
		await InitAsimov();

		const app = createApp(App);
		app.config.globalProperties.SiteName = ":TITLE:";
		app.config.globalProperties.SiteOwner = ":OWNER:";
		app.config.globalProperties.LikeCoin = ":LIKECOIN:";

		app.use(Notification);
		app.component('Loading', Loading);
		app.component('NavBar', NavBar);
		app.component('NavMenuBar', NavMenuBar);
		app.component('NavMenuItem', NavMenuItem);
		app.component('TailBar', TailBar);
		app.component('KeyManager', KeyManager);
		app.component('ImageShowcase', ImageShowcase);
		app.component('Crumb', Crumb);
		app.component('Column', Column);

		if (await LifeCycle.emit.ready(app)) {
			app.use(router).mount('#app');
			router.app = app;

			await LifeCycle.emit.initialized(app);

			let updateTarget = sessionStorage.getItem('sourceUpdated');
			if (!!updateTarget) {
				sessionStorage.removeItem('sourceUpdated');
				notify({
					title: "网站有新数据",
					message: updateTarget + " 已更新\n刷新可浏览新内容",
					duration: 3000,
					type: "success"
				});
			}
		}
	}
}) ();