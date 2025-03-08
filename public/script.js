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
            { from: 20, to: 35, color: '#00cc00' },
            { from: 35, to: 38, color: '#ff9900' },
            { from: 38, to: 45, color: '#ff0000' }
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
            { from: 0, to: 60, color: '#ff0000' },
            { from: 60, to: 100, color: '#00cc00' },
            { from: 100, to: 200, color: '#ff9900' }
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
            { from: 0, to: 90, color: '#ff0000' },
            { from: 90, to: 95, color: '#ff9900' },
            { from: 95, to: 100, color: '#00cc00' }
        ]
    },
    counter: true
});

// Initialize Leaflet map
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
let marker = L.marker([0, 0]).addTo(map);

// WebSocket connection
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}`);

ws.onopen = () => {
    console.log('WebSocket connected');
};

ws.onmessage = async (event) => {
    let message;
    // Check if event.data is a Blob and convert it to text
    if (event.data instanceof Blob) {
        message = await event.data.text(); // Convert Blob to text
    } else {
        message = event.data; // Assume it’s already a string
    }

    try {
        const data = JSON.parse(message); // Parse the text as JSON
        console.log('Parsed data:', data); // Log for debugging

        // Update gauges if data exists
        if (data.temperature !== undefined) {
            temperatureGauge.refresh(data.temperature);
        }
        if (data.heartRate !== undefined) {
            heartRateGauge.refresh(data.heartRate);
        }
        if (data.spo2 !== undefined) {
            spo2Gauge.refresh(data.spo2);
        }

        // Update fall detection status
        const fallStatus = document.getElementById('fall-status');
        if (data.fallDetected !== undefined) {
            if (data.fallDetected) {
                fallStatus.textContent = 'Fall Detected!';
                fallStatus.className = 'alert alert-danger';
            } else {
                fallStatus.textContent = 'No Fall Detected';
                fallStatus.className = 'alert alert-success';
            }
        }

        // Update map if GPS data is valid
        if (data.latitude !== undefined && data.longitude !== undefined) {
            const latlng = [data.latitude, data.longitude];
            marker.setLatLng(latlng);
            map.setView(latlng, 13);
        }
    } catch (error) {
        console.error('Failed to parse JSON:', error, 'Raw message:', message);
    }
};

ws.onclose = () => {
    console.log('WebSocket disconnected');
    document.getElementById('fall-status').textContent = 'WebSocket Disconnected';
    document.getElementById('fall-status').className = 'alert alert-warning';
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    document.getElementById('fall-status').textContent = 'WebSocket Error';
    document.getElementById('fall-status').className = 'alert alert-danger';
};