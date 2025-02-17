import axios from "axios";
const API_URL = 'https://ajay-verma.in';
// const API_URL = 'http://35.154.54.59/api';
const ENDPOINTS = {
    register: API_URL + '/register',
    login: API_URL + '/login',
    locationUpdate: API_URL + '/update-location',
};


export const register = async(data)=>{
    try{
        const response = await axios.post(ENDPOINTS.register, data);
        return [response.status, response?.data?.message];
    }
    catch(error){
        console.log('Error:', error);
        return [error.response?.status || 500, error.response?.data?.error || 'An error occurred.'];
    }
};

export const login = async(data)=>{
    try{
        const response = await axios.post(ENDPOINTS.login, data);
        return [response.status, response?.data];
    }
    catch(error){
        console.log('Error:', error);
        return [error.response?.status || 500, error.response?.data?.error || 'An error occurred.'];
    }
};

export const updateLocation = async(data)=>{
    try{
        const response = await axios.post(ENDPOINTS.locationUpdate, data);
        return response.status;
    }
    catch(error){
        console.log('Error:', error);
        return error.response?.status;
    }
};