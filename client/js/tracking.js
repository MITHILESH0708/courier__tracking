let map, courierMarker, pickupMarker, dropMarker;
let socket;
let currentTrackingId = null;

// Initialize Leaflet Map
const initMap = () => {
    if (!map) {
        map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    }
};

// Fetch order and setup map/sockets
const trackOrder = async () => {
    const inputId = document.getElementById('tracking-input').value.trim();
    if (!inputId) return alert('Enter Tracking ID');

    try {
        const order = await apiCall(`/orders/track/${inputId}`);
        currentTrackingId = order.trackingId;
        
        document.getElementById('order-details').style.display = 'block';
        document.getElementById('ui-status').textContent = order.status.replace(/_/g, ' ');
        document.getElementById('ui-status').className = `badge ${order.status}`;
        document.getElementById('ui-courier').textContent = order.courier ? order.courier.name : 'Unassigned';
        if (order.estimatedDelivery) document.getElementById('ui-eta').textContent = new Date(order.estimatedDelivery).toLocaleString();
        
        updateTimeline(order.statusHistory);
        initMap();

        // Clear existing markers
        if(pickupMarker) map.removeLayer(pickupMarker);
        if(dropMarker) map.removeLayer(dropMarker);
        if(courierMarker) map.removeLayer(courierMarker);

        // Place Pickup/Drop markers
        pickupMarker = L.marker([order.pickup.lat, order.pickup.lng]).bindPopup('Pickup').addTo(map);
        dropMarker = L.marker([order.drop.lat, order.drop.lng]).bindPopup('Dropoff').addTo(map);

        // Place Courier marker if location exists
        if (order.currentLocation && order.currentLocation.lat) {
            courierMarker = L.circleMarker([order.currentLocation.lat, order.currentLocation.lng], {color: 'blue'}).addTo(map).bindPopup('Courier');
            map.fitBounds([
                [order.pickup.lat, order.pickup.lng],
                [order.drop.lat, order.drop.lng],
                [order.currentLocation.lat, order.currentLocation.lng]
            ]);
        } else {
            map.fitBounds([
                [order.pickup.lat, order.pickup.lng],
                [order.drop.lat, order.drop.lng]
            ]);
        }

        // Setup Socket
        if(!socket) socket = io();
        socket.emit('track:join', currentTrackingId);

        // Listen for live location
        socket.on('location:update', (data) => {
            if (courierMarker) {
                courierMarker.setLatLng([data.lat, data.lng]);
            } else {
                courierMarker = L.circleMarker([data.lat, data.lng], {color: 'blue'}).addTo(map);
            }
            if (data.eta) document.getElementById('ui-eta').textContent = new Date(data.eta).toLocaleString();
        });

        // Listen for status
        socket.on('status:update', (data) => {
            document.getElementById('ui-status').textContent = data.status.replace(/_/g, ' ');
            document.getElementById('ui-status').className = `badge ${data.status}`;
            updateTimeline(data.history);
        });

    } catch (err) {
        alert(err.message);
    }
};

const updateTimeline = (history) => {
    const tl = document.getElementById('ui-timeline');
    tl.innerHTML = '';
    history.forEach(h => {
        const li = document.createElement('li');
        li.textContent = `${h.status.replace(/_/g, ' ').toUpperCase()} - ${new Date(h.time).toLocaleTimeString()}`;
        tl.appendChild(li);
    });
};