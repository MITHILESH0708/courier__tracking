checkAuth('courier');
let socket = io();
let simInterval;

const STATUS_STEPS = [
    { value: 'placed', label: 'Placed' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' }
];

// Load assigned orders
const loadOrders = async () => {
    const orders = await apiCall('/orders/my');
    const tbody = document.querySelector('#orders-table tbody');
    tbody.innerHTML = '';

    orders.forEach(order => {
        const currentIndex = STATUS_STEPS.findIndex(s => s.value === order.status);
        const isDelivered = order.status === 'delivered';

        // Show current status as selected, but only enable the immediate next step (currentIndex + 1)
        const optionsHtml = STATUS_STEPS.map((step, index) => {
            const isSelected = index === currentIndex ? 'selected' : '';
            const isDisabled = index !== currentIndex + 1 ? 'disabled' : '';
            return `<option value="${step.value}" ${isSelected} ${isDisabled}>${step.label}</option>`;
        }).join('');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${order.trackingId}</td>
            <td>${order.pickup.address}</td>
            <td>${order.drop.address}</td>
            <td>
                <select id="status-${order._id}" ${isDelivered ? 'disabled' : ''}>
                    ${optionsHtml}
                </select>
            </td>
            <td>
                <button onclick="updateStatus('${order._id}')" ${isDelivered ? 'disabled' : ''}>Update Status</button>
                <button class="btn-secondary" onclick="simMove('${order._id}', '${order.status}', ${order.pickup.lat}, ${order.pickup.lng}, ${order.drop.lat}, ${order.drop.lng})">Simulate GPS</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

// Update order status API
const updateStatus = async (id) => {
    const selectEl = document.getElementById(`status-${id}`);
    if (selectEl.selectedOptions[0].disabled) {
        alert('Please select the next status step in order before clicking Update Status.');
        return;
    }

    const status = selectEl.value;
    try {
        await apiCall(`/orders/${id}/status`, 'PUT', { status });
        alert('Status updated');
        loadOrders(); // Refresh the dropdown so the next step unlocks
    } catch(err) { alert(err.message); }
};

// Parse JWT safely to get courier ID
const getCourierId = () => {
    const token = localStorage.getItem('token');
    return JSON.parse(atob(token.split('.')[1])).id;
};

// Simulate moving from pickup towards drop
const simMove = (orderId, status, pLat, pLng, dLat, dLng) => {
    if (status === 'placed') {
        alert('Please update the order status to "Picked Up" first before simulating GPS movement.');
        return;
    }
    if (status === 'delivered') {
        alert('This order has already been delivered.');
        return;
    }

    if (simInterval) clearInterval(simInterval);
    alert('Started simulated movement towards destination. Keep this Courier tab open while watching the Tracking tab!');

    let currentLat = pLat;
    let currentLng = pLng;
    const courierId = getCourierId();

    simInterval = setInterval(() => {
        // Move 15% closer every tick across both latitude and longitude
        currentLat += (dLat - currentLat) * 0.15;
        currentLng += (dLng - currentLng) * 0.15;

        // Check total 2D distance (both lat AND lng)
        const distanceRemaining = Math.hypot(dLat - currentLat, dLng - currentLng);

        if (distanceRemaining < 0.001) {
            currentLat = dLat;
            currentLng = dLng;
            socket.emit('courier:location', {
                orderId, courierId, lat: currentLat, lng: currentLng
            });
            clearInterval(simInterval);
            alert('Arrived at destination!');
            return;
        }

        socket.emit('courier:location', {
            orderId, courierId, lat: currentLat, lng: currentLng
        });
    }, 2000); // Updates every 2 seconds for smooth live tracking
};

window.onload = loadOrders;