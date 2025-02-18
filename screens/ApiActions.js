import axios from "axios";


const API_URL = 'https://ajay-verma.in';

const ENDPOINTS = {
    register: API_URL + '/register',
    login: API_URL + '/login',
    locationUpdate: API_URL + '/update-location',
    locationHistory: API_URL + '/my-location?user_id=',
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

export const locationHistory = async(id)=>{
    try{
        const response = await axios.get(ENDPOINTS.locationHistory + id);
        return [response.status, response?.data?.data];
    }
    catch(error){
        console.log('Error:', error);
        return error.response?.status;
    }
};
