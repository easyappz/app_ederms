import instance from './axios';

// Attach auth token to all requests when present
instance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        if (!config.headers) {
          config.headers = {};
        }
        config.headers.Authorization = `Token ${token}`;
      }
    } catch (e) {
      // ignore storage access errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional global 401 handler: remove token and redirect to login
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem('token');
      } catch (e) {
        // ignore
      }
      if (typeof window !== 'undefined') {
        const current = window.location?.pathname || '';
        if (current !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export {};
