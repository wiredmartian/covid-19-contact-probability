import Vue from 'vue'
import App from './App.vue'
import router from './router'
import 'materialize-css/dist/js/materialize.min'
import 'materialize-css/dist/css/materialize.min.css'
import axios, {AxiosRequestConfig} from 'axios'

axios.interceptors.request.use((config: AxiosRequestConfig) => {
  config.headers['x-rapidapi-key'] = '341690027dmshc5b9c417182bfb5p183c71jsn5831362ef9a5';
  config.baseURL = 'https://covid-193.p.rapidapi.com';
  return config;
}, error => {
  return Promise.reject(error);
});

Vue.prototype.$http = axios;
Vue.config.productionTip = false;

new Vue({
  router,
  render: h => h(App)
}).$mount('#app');
