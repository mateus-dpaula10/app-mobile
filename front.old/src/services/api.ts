import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.0.79:8000/api'
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('@token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;