checkAuth('admin');
let adminMap;
let courierMarkers = {};
let couriersList = [];
let socket = io();

const initAdminMap = () => {
    adminMap = L.map('admin-map').setView([51.505, -0.09], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(adminMap);
};

// Fetch couriers for dropdowns
const loadCouriers = async () => {
    couriersList = await apiCall('/users/couriers');
};

// Fetch and display all orders
const loadOrders = async () => {
    const orders = await apiCall('/orders');
    const tbody = document.querySelector('#all-orders-table tbody');
    tbody.innerHTML = '';
    
    orders.forEach(order => {
        const tr = document.createElement('tr');
        
        let courierSelect = `<select id="assign-${order._id}">
            <option value="">Unassigned</option>
            ${couriersList.map(c => `<option value="${c._id}" ${order.courier && order.courier._id === c._id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>`;

        tr.innerHTML = `
            <td>${order.trackingId}</td>
            <td><span class="badge ${order.status}">${order.status.replace(/_/g, ' ')}</span></td>
            <td>${courierSelect}</td>
            <td><button onclick="assignCourier('${order._id}')">Save</button></td>
        `;
        tbody.appendChild(tr);
    });
};

const assignCourier = async (orderId) => {
    const courierId = document.getElementById(`assign-${orderId}`).value;
    try {
        await apiCall(`/orders/${orderId}/assign`, 'PUT', { courierId });
        alert('Courier assigned');
    } catch(err) { alert(err.message); }
};

document.getElementById('create-order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        senderName: document.getElementById('s-name').value,
        receiverName: document.getElementById('r-name').value,
        pickup: {
            address: document.getElementById('p-addr').value,
            lat: parseFloat(document.getElementById('p-lat').value),
            lng: parseFloat(document.getElementById('p-lng').value)
        },
        drop: {
            address: document.getElementById('d-addr').value,
            lat: parseFloat(document.getElementById('d-lat').value),
            lng: parseFloat(document.getElementById('d-lng').value)
        }
    };
    try {
        await apiCall('/orders', 'POST', payload);
        alert('Order created');
        e.target.reset();
        loadOrders();
    } catch(err) { alert(err.message); }
});

// Admin live sockets
socket.emit('admin:join');
socket.on('admin:location_update', (data) => {
    const { courierId, lat, lng } = data;
    if (courierMarkers[courierId]) {
        courierMarkers[courierId].setLatLng([lat, lng]);
    } else {
        courierMarkers[courierId] = L.marker([lat, lng]).bindPopup('Courier Online').addTo(adminMap);
    }
});

window.onload = async () => {
    initAdminMap();
    await loadCouriers();
    await loadOrders();
};