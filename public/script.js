// Initialize JustGage meters
const temperatureGauge = new JustGage({
    id: 'temperature-gauge',
    value: 0,
    min: 20,
    max: 45,
    title: 'Temperature',
    label: '°C',
    decimals: 2,
    gaugeWidthScale: 0.6,
    customSectors: {
        percents: true,
        ranges: [
            { from: 20, to: 35, color: '#28a745' },
            { from: 35, to: 38, color: '#fd7e14' },
            { from: 38, to: 45, color: '#dc3545' }
        ]
    },
    counter: true
});

const heartRateGauge = new JustGage({
    id: 'heart-rate-gauge',
    value: 0,
    min: 0,
    max: 200,
    title: 'Heart Rate',
    label: 'BPM',
    decimals: 0,
    gaugeWidthScale: 0.6,
    customSectors: {
        percents: true,
        ranges: [
            { from: 0, to: 60, color: '#dc3545' },
            { from: 60, to: 100, color: '#28a745' },
            { from: 100, to: 200, color: '#fd7e14' }
        ]
    },
    counter: true
});

const spo2Gauge = new JustGage({
    id: 'spo2-gauge',
    value: 0,
    min: 0,
    max: 100,
    title: 'SpO2',
    label: '%',
    decimals: 0,
    gaugeWidthScale: 0.6,
    customSectors: {
        percents: true,
        ranges: [
            { from: 0, to: 90, color: '#dc3545' },
            { from: 90, to: 95, color: '#fd7e14' },
            { from: 95, to: 100, color: '#28a745' }
        ]
    },
    counter: true
});

// Initialize Leaflet map with a default location
let map, marker;
const defaultLatLng = [40.7128, -74.0060]; // New York as default
try {
    map = L.map('map', {
        center: defaultLatLng,
        zoom: 13,
        zoomControl: true
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    marker = L.marker(defaultLatLng).addTo(map);
    marker.bindPopup('Default Location: New York').openPopup();
    console.log('Leaflet map initialized successfully');
} catch (error) {
    console.error('Failed to initialize Leaflet map:', error);
    document.getElementById('map-error').style.display = 'block';
}

// WebSocket connection
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}`);

ws.onopen = () => {
    console.log('WebSocket connected');
};

ws.onmessage = async (event) => {
    let message;
    if (event.data instanceof Blob) {
        message = await event.data.text();
    } else {
        message = event.data;
    }

    try {
        const data = JSON.parse(message);
        console.log('Received data:', data);

        // Update gauges
        if (data.temperature !== undefined) {
            temperatureGauge.refresh(data.temperature);
        }
        if (data.heartRate !== undefined) {
            heartRateGauge.refresh(data.heartRate);
        }
        if (data.spo2 !== undefined) {
            spo2Gauge.refresh(data.spo2);
        }

        // Update fall detection
        const fallStatus = document.getElementById('fall-status');
        if (data.fallDetected !== undefined) {
            if (data.fallDetected) {
                fallStatus.textContent = 'Fall Detected!';
                fallStatus.className = 'alert alert-danger text-center mb-0';
            } else {
                fallStatus.textContent = 'No Fall Detected';
                fallStatus.className = 'alert alert-success text-center mb-0';
            }
        }

        // Update map with GPS data
        if (data.latitude !== undefined && data.longitude !== undefined) {
            const latlng = [data.latitude, data.longitude];
            if (marker) {
                marker.setLatLng(latlng);
                marker.bindPopup(`Current Location: Lat ${data.latitude}, Lon ${data.longitude}`).openPopup();
                map.setView(latlng, 13);
                console.log('Map updated to:', latlng);
            } else {
                console.error('Marker not initialized; map may have failed to load');
            }
        } else {
            console.log('No valid GPS data received in this message');
        }
    } catch (error) {
        console.error('Failed to parse JSON:', error, 'Raw message:', message);
    }
};

ws.onclose = () => {
    console.log('WebSocket disconnected');
    document.getElementById('fall-status').textContent = 'WebSocket Disconnected';
    document.getElementById('fall-status').className = 'alert alert-warning text-center mb-0';
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    document.getElementById('fall-status').textContent = 'WebSocket Error';
    document.getElementById('fall-status').className = 'alert alert-danger text-center mb-0';
};