import axios from "axios";

// Set base URL directly to Django backend
axios.defaults.baseURL = 'http://localhost:8000';

// Set default headers for JSON
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.put['Content-Type'] = 'application/json';
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.patch['Content-Type'] = 'application/json';

function setJwt(jwt) {
    if (jwt == undefined) {
        delete axios.defaults.headers.common["Authorization"];
        return;
    }
    axios.defaults.headers.common["Authorization"] = `JWT ${jwt}`;
    console.log('JWT token set:', `JWT ${jwt.substring(0, 20)}...`);
}

// Add request interceptor to log requests
axios.interceptors.request.use(
    (config) => {
        console.log('Making request:', config.method?.toUpperCase(), config.url);
        console.log('Headers:', config.headers);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to log responses
axios.interceptors.response.use(
    (response) => {
        console.log('Response received:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.log('Request failed:', error.response?.status, error.config?.url);
        console.log('Error details:', error.response?.data);
        return Promise.reject(error);
    }
);

export default {
    get:axios.get,
    post:axios.post,
    put:axios.put,
    patch:axios.patch,
    delete:axios.delete,
    setJwt
};