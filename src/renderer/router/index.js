import Vue from 'vue';
import Router from 'vue-router';
// import { autoUpdater } from 'electron-updater';

import Home from '@/components/Home';
import Modal from '@/components/modal/SelectProject';

Vue.use(Router);

Vue.component('select-project', Modal);

// autoUpdater.checkForUpdatesAndNotify();

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: Home,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
