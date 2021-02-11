import Vue from 'vue'
import App from './App.vue'
import router from './router'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import NavBar from '@/components/navbar.vue'
import NavMenuBar from '@/components/navmenubar.vue'
import NavMenuItem from '@/components/navmenuitem.vue'
import TailBar from '@/components/tail.vue'

require('./assets/css/main.css');
require('./assets/css/navbar.css');
require('./assets/css/tail.css');

library.add(fas);
library.add(fab);
library.add(far);
Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.component('NavBar', NavBar);
Vue.component('NavMenuBar', NavMenuBar);
Vue.component('NavMenuItem', NavMenuItem);
Vue.component('TailBar', TailBar);

Vue.config.productionTip = false

new Vue({
	router,
	render: function (h) { return h(App) }
}).$mount('#app')
