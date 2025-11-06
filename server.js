// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ Enable CORS for your form domains
app.use(cors({
  origin: [
    'http://127.0.0.1:5500',            // Local testing
    'http://localhost:5500',            // Local alternate
    'https://cc.fusionsystems.co.ke'    // Live embedded site
  ],
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Zendesk custom field IDs
const CUSTOM_FIELDS = {
  number: 30811600163090,
  gender: 30811657814034,
  disposition1: 30811872818834,
  disposition2: 30811949680530,
  disposition3: 30812114770194,
  disposition4: 30812171988882
};

// ✅ Zendesk ticket form ID
const FORM_ID = 23385393833372;

app.post('/create-ticket', async (req, res) => {
  console.log('📥 Received request body:', req.body);

  const { number, gender, disposition1, disposition2, disposition3, disposition4 } = req.body;

  if (!number || !gender || !disposition1) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const ticketData = {
    ticket: {
      subject: `SHABIKI Support - ${disposition1}`,
      comment: {
        body: `New ticket submitted via web form.\n\nCustomer Number: ${number}\nGender: ${gender}\nDisposition 1: ${disposition1}\nDisposition 2: ${disposition2 || 'N/A'}\nDisposition 3: ${disposition3 || 'N/A'}\nDisposition 4: ${disposition4 || 'N/A'}`
      },
      requester: {
        name: `Customer ${number}`,
        email: `customer-${number}@shabiki.support`
      },
      form_id: FORM_ID,
      tags: ['shabiki', 'webform'],
      priority: 'normal',
      custom_fields: [
        { id: CUSTOM_FIELDS.number, value: number },
        { id: CUSTOM_FIELDS.gender, value: gender },
        { id: CUSTOM_FIELDS.disposition1, value: disposition1 },
        { id: CUSTOM_FIELDS.disposition2, value: disposition2 || 'N/A' },
        { id: CUSTOM_FIELDS.disposition3, value: disposition3 || 'N/A' },
        { id: CUSTOM_FIELDS.disposition4, value: disposition4 || 'N/A' }
      ]
    }
  };

  try {
    const zendeskUrl = `https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets.json`;
    const auth = Buffer.from(`${process.env.ZENDESK_EMAIL}/token:${process.env.ZENDESK_API_TOKEN}`).toString('base64');

    const response = await axios.post(zendeskUrl, ticketData, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Ticket created with ID: ${response.data.ticket.id}`);
    res.status(201).json({ success: true, ticketId: response.data.ticket.id });

  } catch (error) {
    console.error('❌ Zendesk API error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || error.message;
    res.status(status).json({ success: false, error: message });
  }
});

const PORT = process.env.PORT || 3800;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
