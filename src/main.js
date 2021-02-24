import './assets/js/cacheCenter.js'
import './assets/js/lrucache.js'
import './assets/js/cacheDB.js'
import './assets/js/granary.js'
import './assets/js/markup-footnote.js'

import Vue from 'vue'
import Notifications from 'vue-notification'
import axios from 'axios';
import App from './App.vue'
import router from './router'
import Loading from '@/components/loading.vue'
import NavBar from '@/components/navbar.vue'
import NavMenuBar from '@/components/navmenubar.vue'
import NavMenuItem from '@/components/navmenuitem.vue'
import TailBar from '@/components/tail.vue'
import Crumb from '@/components/crumb.vue'
import Column from '@/components/column.vue'

require('./assets/css/theme.css');
require('./assets/css/main.css');
require('./assets/css/404.css');
require('./assets/css/navbar.css');
require('./assets/css/tail.css');
require('./assets/css/crumb.css');
require('./assets/css/column.css');
require('./assets/css/markup.css');
require('./assets/css/article.css');

global.axios = axios;
global.Vue = Vue;
Vue.use(Notifications);
Vue.component('Loading', Loading);
Vue.component('NavBar', NavBar);
Vue.component('NavMenuBar', NavMenuBar);
Vue.component('NavMenuItem', NavMenuItem);
Vue.component('TailBar', TailBar);
Vue.component('Crumb', Crumb);
Vue.component('Column', Column);

Vue.config.productionTip = false;

var FootNoteUnInited = true;
const mutationObserver = new MutationObserver(mutations => {
	var markups = document.querySelectorAll('.markup');
	[].forEach.call(markups, (mu) => {
		var content = mu.innerText;
		content = content.replace(/^\t+|\t+$/g, '\n');
		content = MarkUp.parse(content, {
			toc: mu.classList.contains('toc'),
			glossary: mu.classList.contains('glossary'),
			resources: mu.classList.contains('resources'),
			showtitle: false,
			showauthor: false,
			classname: 'markup-content',
		});
		mu.innerHTML = content;
		mu.classList.remove('markup');
	});
	if (FootNoteUnInited) {
		FootNoteUnInited = false;
		InitNotes(document.body.querySelector('#container'));
		MathJax.Hub.Config({
			extensions: ["tex2jax.js"],
			TeX: {
				extensions: ["AMSmath.js", "AMSsymbols.js"]
			},
			jax: ["input/TeX", "output/HTML-CSS"],
			tex2jax: {
				inlineMath: [["$","$"]]}
			}
		);
	}
	else {
		MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
	}
});
mutationObserver.observe(document.body, {
	childList: true,
	subtree: true,
});

global.changeThemeColor = (color) => {
	if (!color) return;
	localStorage.setItem('themeColor', color);
	document.body.setAttribute('theme', color);
};
changeThemeColor(localStorage.getItem('themeColor'));

new Vue({
	router,
	render: function (h) { return h(App) }
}).$mount('#app');