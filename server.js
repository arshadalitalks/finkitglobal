const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Memory storage for leads
let leads = [];

// Serve Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// API endpoint for Admin Dashboard to fetch leads
app.get('/api/leads', (req, res) => {
    res.json(leads);
});

// Handle Contact Form Submission
app.post('/send-email', async (req, res) => {
    const { name, email, message } = req.body;

    const newLead = {
        id: Date.now(),
        name: name || 'N/A',
        email: email || 'N/A',
        message: message || 'N/A',
        date: new Date().toLocaleString(),
        status: 'New'
    };

    // Lead ko array me top par save karein
    leads.unshift(newLead);
    console.log('New Lead Received:', newLead);

    // Agar email config hai toh email bhejein, varna crash na hone dein
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
            console.log('Email send failed, but lead saved:', err.message);
        }
    }

    // Response send karein
    res.send(`
        <script>
            alert('Inquiry submitted successfully!');
            window.location.href = '/';
        </script>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
