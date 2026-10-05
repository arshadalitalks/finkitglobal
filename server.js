const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

// Home route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Backend Route: Contact Form / Lead Email Handler
app.post('/send-email', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).send('<h2>Error: All fields are required.</h2><a href="/">Go Back</a>');
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `New Lead from FinKit Global: ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #0f172a;">New Inquiry Received</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Message:</strong></p>
                    <blockquote style="background: #f1f5f9; padding: 15px; border-left: 4px solid #2563eb;">${message}</blockquote>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        
        res.send(`
            <div style="text-align:center; padding:60px; font-family:sans-serif;">
                <h2 style="color:#16a34a; font-size: 28px;">Thank You, ${name}!</h2>
                <p style="color:#475569; font-size: 18px;">Your request has been received. Our team will contact you shortly.</p>
                <a href="/" style="display:inline-block; margin-top:20px; padding:12px 24px; background:#2563eb; color:white; text-decoration:none; border-radius:6px; font-weight:bold;">Back to Website</a>
            </div>
        `);
    } catch (error) {
        console.error('Email send error:', error);
        res.status(500).send('<h2>Server Error: Could not send email. Please check credentials.</h2><a href="/">Go Back</a>');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
