const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const LEADS_FILE = path.join(__dirname, 'leads.json');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Helper: Read Leads from File
function getLeads() {
    try {
        if (!fs.existsSync(LEADS_FILE)) {
            fs.writeFileSync(LEADS_FILE, JSON.stringify([]));
        }
        const data = fs.readFileSync(LEADS_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (e) {
        return [];
    }
}

// Helper: Save Leads to File
function saveLeads(leads) {
    try {
        fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
    } catch (e) {
        console.error('Error saving leads:', e);
    }
}

// Routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/api/leads', (req, res) => {
    res.json(getLeads());
});

app.post('/send-email', async (req, res) => {
    const { name, email, message } = req.body;

    const newLead = {
        id: Date.now(),
        name: name || 'N/A',
        email: email || 'N/A',
        message: message || 'N/A',
        date: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
        status: 'New'
    };

    const leads = getLeads();
    leads.unshift(newLead);
    saveLeads(leads);

    // Send Email if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: `New Lead: ${name}`,
                text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
            });
        } catch (err) {
            console.log('Email delivery failed, lead saved locally:', err.message);
        }
    }

    res.json({ success: true, message: 'Lead saved successfully!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
