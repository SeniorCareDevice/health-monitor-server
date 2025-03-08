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
            { from: 20, to: 35, color: '#28a745' }, // Green
            { from: 35, to: 38, color: '#fd7e14' }, // Orange
            { from: 38, to: 45, color: '#dc3545' }  // Red
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
            { from: 0, to: 60, color: '#dc3545' },  // Red
            { from: 60, to: 100, color: '#28a745' }, // Green
            { from: 100, to: 200, color: '#fd7e14' } // Orange
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
            { from: 0, to: 90, color: '#dc3545' },  // Red
            { from: 90, to: 95, color: '#fd7e14' }, // Orange
            { from: 95, to: 100, color: '#28a745' } // Green
        ]
    },
    counter: true
});

// Initialize Leaflet map
const map = L.map('map', {
    center: [0, 0],
    zoom: 2,
    zoomControl: true
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
let marker = null; // Marker starts as null

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
            if (!marker) {
                marker = L.marker(latlng).addTo(map);
                marker.bindPopup('Current Location').openPopup();
            } else {
                marker.setLatLng(latlng);
            }
            map.setView(latlng, 13);
            console.log('Map updated to:', latlng);
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