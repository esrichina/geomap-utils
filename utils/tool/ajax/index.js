import axios from 'axios';

const CancelToken = axios.CancelToken;

// configure defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;
axios.defaults.timeout = 10000;
