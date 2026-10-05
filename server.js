const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'leads.json');

// Helper to read leads
function getLeads() {
    if (!fs.existsSync(DATA_FILE)) {
        // Initial sample leads for demo
        const initialLeads = [
            {
                id: '1',
                name: 'Vikram Mehta',
                email: 'vikram@fintechasia.com',
                message: 'Looking for turnkey BrokerOS & CRM integration for our FX brokerage.',
                status: 'New',
                date: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            {
                id: '2',
                name: 'Sarah Jenkins',
                email: 's.jenkins@globalprop.io',
                message: 'Interested in FinKit Risk Technology and exposure monitoring tools.',
                status: 'In Progress',
                date: new Date(Date.now() - 3600000 * 24).toISOString()
            },
            {
                id: '3',
                name: 'Rahul Sharma',
                email: 'rahul@capitalprime.in',
                message: 'Need custom API development for our algorithmic trading desk.',
                status: 'Closed',
                date: new Date(Date.now() - 3600000 * 48).toISOString()
            }
        ];
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialLeads, null, 2));
        return initialLeads;
    }
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (e) {
        return [];
    }
}

// Helper to save leads
function saveLeads(leads) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2));
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Serve Website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve Admin Dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Admin API: Fetch all leads
app.get('/api/leads', (req, res) => {
    res.json(getLeads());
});

// Admin API: Update lead status
app.post('/api/leads/status', (req, res) => {
    const { id, status } = req.body;
    let leads = getLeads();
    leads = leads.map(lead => lead.id === id ? { ...lead, status } : lead);
    saveLeads(leads);
    res.json({ success: true, leads });
});

// Admin API: Delete lead
app.delete('/api/leads/:id', (req, res) => {
    const { id } = req.params;
    let leads = getLeads();
    leads = leads.filter(lead => lead.id !== id);
    saveLeads(leads);
    res.json({ success: true, leads });
});

// Public Form Handler (Saves Lead + Sends Email)
app.post('/send-email', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).send('<h2>Error: All fields are required.</h2><a href="/">Go Back</a>');
    }

    // Save lead locally
    const leads = getLeads();
    const newLead = {
        id: Date.now().toString(),
        name,
        email,
        message,
        status: 'New',
        date: new Date().toISOString()
    };
    leads.unshift(newLead);
    saveLeads(leads);

    // Attempt email dispatch via Nodemailer if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: `New FinKit Global Lead: ${name}`,
                html: `<h3>New Contact Inquiry</h3><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Message:</b> ${message}</p>`
            });
        } catch (error) {
            console.error('Email dispatch warning:', error.message);
        }
    }

    res.send(`
        <div style="text-align:center; padding:60px; font-family:sans-serif;">
            <h2 style="color:#16a34a; font-size:28px;">Thank You, ${name}!</h2>
            <p style="color:#475569; font-size:18px;">Your inquiry has been received. Our team will get back to you shortly.</p>
            <a href="/" style="display:inline-block; margin-top:20px; padding:12px 24px; background:#2563eb; color:white; text-decoration:none; border-radius:6px; font-weight:bold;">Back to Website</a>
        </div>
    `);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
