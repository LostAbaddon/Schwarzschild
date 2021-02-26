((root, ua, nav) => {
	root.Devices = {};

	Devices.isAndroid = !!ua.match(/Android/i);
	Devices.isiPhone = !!ua.match(/iPhone/i);
	Devices.isiPad = !!ua.match(/iPad/i);
	Devices.isiPod = !!ua.match(/iPod/i);
	Devices.isiOS = Devices.isiPhone || Devices.isiPad || Devices.isiPod;
	Devices.isBlackBerry = !!ua.match(/BlackBerry/i);
	Devices.isIE = nav.pointerEnabled || nav.msPointerEnabled;
	Devices.isSafari = (ua.indexOf('safari') >= 0 && ua.indexOf('chrome') < 0 && ua.indexOf('android') < 0);
	Devices.isOpera = !!ua.match(/Opera/i) && !ua.match(/Opera Mini/i);
	Devices.isOperaMini = !!ua.match(/Opera Mini/i);
	Devices.isWinPhone = !!ua.match(/IEMobile/i) || !!ua.match(/WPDesktop/i);
	Devices.isWebOS = !!ua.match(/webOS/i);
	Devices.isUiWebView = !!ua.match(/AppleWebKit/i);
	Devices.isMobile = Devices.isAndroid || Devices.isiOS || Devices.isBlackBerry || Devices.isWinPhone || Devices.isWebOS;

	if (Devices.isMobile) document.body.classList.add('mobile');
}) (window, window.navigator.userAgent, window.navigator);

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

Vue.prototype.SiteName = ":TITLE:";
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
			showtitle: mu.classList.contains('showtitle'),
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