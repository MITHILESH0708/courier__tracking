// Generic fetch wrapper to handle JSON and Authorization
const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    
    // If a token exists in local storage, attach it to the request
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    
    // Attach body data if it's a POST or PUT request
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`/api${endpoint}`, options);
    const data = await response.json();
    
    // Throw an error if the backend returns a failure status
    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }
    return data;
};

// Check if user is logged in and has the correct role
const checkAuth = (roleRequired) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    // Redirect to login if not authenticated or wrong role
    if (!token || (roleRequired && role !== roleRequired)) {
        window.location.href = '/login.html';
    }
};

// Logout helper
const logout = () => {
    localStorage.clear();
    window.location.href = '/login.html';
};