import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: API,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Wedding APIs
export const createWedding = async (data) => {
    const response = await api.post('/weddings', data);
    return response.data;
};

export const getWeddings = async () => {
    const response = await api.get('/weddings');
    return response.data;
};

export const getWedding = async (id) => {
    const response = await api.get(`/weddings/${id}`);
    return response.data;
};

export const updateWedding = async (id, data) => {
    const response = await api.put(`/weddings/${id}`, data);
    return response.data;
};

export const deleteWedding = async (id) => {
    const response = await api.delete(`/weddings/${id}`);
    return response.data;
};

// Event APIs
export const createEvent = async (data) => {
    const response = await api.post('/events', data);
    return response.data;
};

export const getEvents = async (weddingId) => {
    const response = await api.get(`/weddings/${weddingId}/events`);
    return response.data;
};

export const updateEvent = async (id, data) => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
};

export const deleteEvent = async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
};

// Expense APIs
export const createExpense = async (data) => {
    const response = await api.post('/expenses', data);
    return response.data;
};

export const getExpenses = async (weddingId) => {
    const response = await api.get(`/weddings/${weddingId}/expenses`);
    return response.data;
};

export const getEventExpenses = async (eventId) => {
    const response = await api.get(`/events/${eventId}/expenses`);
    return response.data;
};

export const deleteExpense = async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
};

// Task APIs
export const createTask = async (data) => {
    const response = await api.post('/tasks', data);
    return response.data;
};

export const getTasks = async (weddingId) => {
    const response = await api.get(`/weddings/${weddingId}/tasks`);
    return response.data;
};

export const updateTask = async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
};

export const updateTaskFull = async (id, data) => {
    const response = await api.put(`/tasks/${id}/full`, data);
    return response.data;
};

export const updateTaskStatus = async (id, status) => {
    const response = await api.patch(`/tasks/${id}/status?status=${status}`);
    return response.data;
};

export const deleteTask = async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
};

// Person APIs
export const createPerson = async (data) => {
    const response = await api.post('/people', data);
    return response.data;
};

export const getPeople = async (weddingId) => {
    const response = await api.get(`/weddings/${weddingId}/people`);
    return response.data;
};

export const deletePerson = async (id) => {
    const response = await api.delete(`/people/${id}`);
    return response.data;
};

// Stats API
export const getWeddingStats = async (weddingId) => {
    const response = await api.get(`/weddings/${weddingId}/stats`);
    return response.data;
};

export default api;
