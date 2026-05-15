import http from 'http';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const token = jwt.sign({ id: 'dummy-id', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

const data = JSON.stringify({
    name: 'Endpoint Test Final',
    slug: 'endpoint-test-final',
    description: 'desc',
    banner_url: '',
    accent_color: '#000000',
    template_type: 'standard',
    start_date: '2026-12-25',
    end_date: '2026-12-31',
    is_active: true,
    countdown_enabled: false,
    type: 'campaign',
    button_text: 'Buy',
    button_link: ''
});

const req = http.request('http://localhost:5000/api/campaigns', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${token}`
    }
}, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', console.error);
req.write(data);
req.end();
