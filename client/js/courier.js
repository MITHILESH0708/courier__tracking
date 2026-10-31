checkAuth('courier');
let socket = io();
let simInterval;

// Load assigned orders
const loadOrders = async () => {
    const orders = await apiCall('/orders/my');
    const tbody = document.querySelector('#orders-table tbody');
    tbody.innerHTML = '';
    
    orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${order.trackingId}</td>
            <td>${order.pickup.address}</td>
            <td>${order.drop.address}</td>
            <td>
                <select id="status-${order._id}">
                    <option value="placed" ${order.status=='placed'?'selected':''}>Placed</option>
                    <option value="picked_up" ${order.status=='picked_up'?'selected':''}>Picked Up</option>
                    <option value="in_transit" ${order.status=='in_transit'?'selected':''}>In Transit</option>
                    <option value="out_for_delivery" ${order.status=='out_for_delivery'?'selected':''}>Out for Delivery</option>
                    <option value="delivered" ${order.status=='delivered'?'selected':''}>Delivered</option>
                </select>
            </td>
            <td>
                <button onclick="updateStatus('${order._id}')">Update Status</button>
                <button class="btn-secondary" onclick="simMove('${order._id}', ${order.pickup.lat}, ${order.pickup.lng}, ${order.drop.lat}, ${order.drop.lng})">Simulate Move</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

// Update order status API
const updateStatus = async (id) => {
    const status = document.getElementById(`status-${id}`).value;
    try {
        await apiCall(`/orders/${id}/status`, 'PUT', { status });
        alert('Status updated');
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