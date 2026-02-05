const express = require('express');
const app = express();
app.use(express.json());

// --- IN-MEMORY DATABASE ---
const reservations = new Map(); // bookingId -> services
const payments = new Map();     // bookingId -> amount

// --- INVENTORY SERVICE (Clinic Availability) ---
app.post('/inventory/reserve', (req, res) => {
    const { bookingId, serviceIds } = req.body;
    console.log(`[Inventory] Checking availability for ${serviceIds.join(', ')} (Booking: ${bookingId})`);

    // Simulate "Out of Stock" / "Slot Taken" for specific ID
    if (serviceIds.includes('srv_full')) {
        return res.status(409).json({ error: 'Slot unavailable for service: srv_full' });
    }

    reservations.set(bookingId, serviceIds);
    res.json({ status: 'reserved', bookingId, reservedServices: serviceIds });
});

app.post('/inventory/compensate', (req, res) => {
    const { bookingId } = req.body;
    console.log(`[Inventory] ↪️ COMPENSATING: Releasing slots for Booking ${bookingId}`);
    reservations.delete(bookingId);
    res.json({ status: 'released', bookingId });
});

// --- DISCOUNT SERVICE ---
app.post('/discount/apply', (req, res) => {
    const { bookingId, code } = req.body;
    console.log(`[Discount] Checking discount code '${code}' for Booking ${bookingId}`);

    if (code === 'INVALID') {
        return res.status(400).json({ error: 'Invalid Discount Code' });
    }

    const discountAmount = code === 'HEALTH10' ? 10 : 0;
    res.json({ status: 'applied', discountAmount });
});


// --- PAYMENT SERVICE ---
app.post('/payment/process', (req, res) => {
    const { bookingId, amount } = req.body;
    console.log(`[Payment] 💳 Charging $${amount} for Booking ${bookingId}`);

    // Simulate Payment Failure for specific amount
    if (amount >= 5000) {
        return res.status(402).json({ error: 'Insuffient Funds / Declined' });
    }

    payments.set(bookingId, { amount, status: 'paid' });
    res.json({ status: 'paid', transactionId: 'txn_' + Math.random().toString(36).substr(2, 9) });
});

// --- NOTIFICATION SERVICE ---
app.post('/notification/send', (req, res) => {
    const { bookingId, message } = req.body;
    console.log(`[Notification] 📧 Sending email for Booking ${bookingId}: "${message}"`);
    res.json({ status: 'sent', bookingId });
});

// --- BOOKING SERVICE (Orchestration Completion) ---
app.post('/booking/confirm', (req, res) => {
    const { bookingId } = req.body;
    console.log(`[Booking] ✅ Booking ${bookingId} CONFIRMED.`);
    res.json({ status: 'confirmed', bookingId });
});


const PORT = 8080;
app.listen(PORT, () => {
    console.log(`\n🏥 Clinic Microservices Demo running on port ${PORT}`);
    console.log(`Ready for GCP Workflow Simulation...\n`);
});
