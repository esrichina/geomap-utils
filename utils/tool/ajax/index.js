import axios from 'axios';

let notificationFn = null;
const defaultNotification = message => {
  console.log(message);
};

const showMsg(message) {
  (notificationFn || defaultNotification)(message);
}

// configure defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;
axios.defaults.timeout = 10000;

axios.interceptors.response.use(
  response => {
    return response;
  },
  err => {
    return Promise.reject(err);
  }
);

export const CancelToken = axios.CancelToken;
export const notification = {
  use(func) {
    notificationFn = func;
  },
};
export function fetch(url, params = {}) {
  return new Promise(resolve => {
    axios
      .get(url, {
        params,
      })
      .then(response => {
        resolve({ data: response.data });
      })
      .catch(err => {
        showMsg(err);
        resolve({ err });
      });
  });
}

export function post(url, data) {
  return new Promise(resolve => {
    axios
      .post(url, {
        data,
      })
      .then(response => {
        resolve({ data: response.data });
      })
      .catch(err => {
        showMsg(err);
        resolve({ err });
      });
  });
}

export default axios;
