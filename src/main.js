import './assets/js/eventbus.js'
import './assets/js/markup-footnote.js'

import Vue from 'vue'
import App from './App.vue'
import router from './router'
import NavBar from '@/components/navbar.vue'
import NavMenuBar from '@/components/navmenubar.vue'
import NavMenuItem from '@/components/navmenuitem.vue'
import TailBar from '@/components/tail.vue'
import Crumb from '@/components/crumb.vue'

require('./assets/css/main.css');
require('./assets/css/navbar.css');
require('./assets/css/tail.css');
require('./assets/css/crumb.css');
require('./assets/css/markup.css');

Vue.component('NavBar', NavBar);
Vue.component('NavMenuBar', NavMenuBar);
Vue.component('NavMenuItem', NavMenuItem);
Vue.component('TailBar', TailBar);
Vue.component('Crumb', Crumb);

Vue.config.productionTip = false;

var FootNoteUnInited = true;
const mutationObserver = new MutationObserver(mutations => {
	var need_markup = false;
	mutations.forEach((item, index) => {
		if (
			item.target.id === 'container' &&
			[].some.call(item.addedNodes, node => !!node.classList && node.classList.contains('container'))
		) need_markup = true;
	});
	if (!need_markup) return;

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

new Vue({
	router,
	render: function (h) { return h(App) }
}).$mount('#app');