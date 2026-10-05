const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const LEADS_FILE = path.join(__dirname, 'leads.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

function getLeads() {
    try {
        if (!fs.existsSync(LEADS_FILE)) {
            fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2));
        }
        const data = fs.readFileSync(LEADS_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        return [];
    }
}

function saveLeads(leads) {
    try {
        fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
    } catch (err) {
        console.error('Error saving leads:', err);
    }
}

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/api/leads', (req, res) => {
    res.json(getLeads());
});

app.post('/send-email', (req, res) => {
    try {
        const { name, email, message } = req.body;

        const newLead = {
            id: Date.now(),
            name: name || 'N/A',
            email: email || 'N/A',
            message: message || 'N/A',
            date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            status: 'New'
        };

        const leads = getLeads();
        leads.unshift(newLead);
        saveLeads(leads);

        console.log('✅ Naya Lead Saved:', newLead);

        return res.status(200).json({ success: true, message: 'Lead added successfully!' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
