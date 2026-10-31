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
                <button class="btn-secondary" onclick="simMove('${order._id}', ${order.pickup.lat}, ${order.pickup.lng}, ${order.drop.lat}, ${order.drop.lng})">Simulate GPS</button>
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
const simMove = (orderId, pLat, pLng, dLat, dLng) => {
    if(simInterval) clearInterval(simInterval);
    alert('Started simulated movement towards destination.');

    let currentLat = pLat;
    let currentLng = pLng;
    const courierId = getCourierId();

    simInterval = setInterval(() => {
        // Move 10% closer every tick
        currentLat += (dLat - currentLat) * 0.1;
        currentLng += (dLng - currentLng) * 0.1;

        socket.emit('courier:location', {
            orderId, courierId, lat: currentLat, lng: currentLng
        });

        // Stop if very close
        if(Math.abs(dLat - currentLat) < 0.001) {
            clearInterval(simInterval);
            alert('Arrived at destination');
        }
    }, 5000); // 5 seconds
};

window.onload = loadOrders;