const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path');
const eventBus = require('./core/EventBus');

// Initialize Services
// We re-use the same structure as main.js but wrapped in server
const BookingService = require('./services/BookingService');
const InventoryService = require('./services/InventoryService');
const DiscountService = require('./services/DiscountService');
const PaymentService = require('./services/PaymentService');
const NotificationService = require('./services/NotificationService');

const inventoryService = new InventoryService();
const discountService = new DiscountService(100);
const paymentService = new PaymentService();
const notificationService = new NotificationService();
const bookingService = new BookingService();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

const EVENTS_TO_STREAM = [
    'BOOKING_INITIATED',
    'INVENTORY_RESERVED',
    'INVENTORY_FAILED',
    'INVENTORY_RELEASED',
    'DISCOUNT_APPLIED',
    'DISCOUNT_REJECTED',
    'DISCOUNT_RELEASED',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'BOOKING_CONFIRMED',
    'BOOKING_FAILED',
    'COMPENSATE_INVENTORY',
    'COMPENSATE_DISCOUNT',
    'NOTIFICATION_SENT'
];

EVENTS_TO_STREAM.forEach(topic => {
    eventBus.subscribe(topic, (payload) => {
        // Emit to all connected clients
        io.emit('system-event', {
            topic,
            payload,
            timestamp: new Date().toISOString()
        });
    });
});

// -----------------------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------------------
app.post('/api/book', (req, res) => {
    const { name, gender, dob, selectedServices } = req.body;

    if (!name || !selectedServices || selectedServices.length === 0) {
        return res.status(400).json({ error: 'Invalid Input' });
    }

    const user = { name, gender, dob };
    const bookingId = bookingService.createBooking(user, selectedServices);

    res.json({
        message: 'Booking request initiated. check live terminal for updates.',
        bookingId
    });
});

app.post('/api/reset-quota', (req, res) => {
    discountService.discountsGivenToday = 0;
    res.json({ message: 'Quota reset to 0 used.' });
});

app.post('/api/test/fail-next-payment', (req, res) => {
    eventBus.publish('TEST_FORCE_PAYMENT_FAIL', {});
    res.json({ message: 'Next payment will fail.' });
});

app.get('/api/quota', (req, res) => {
    res.json({
        used: discountService.discountsGivenToday,
        limit: discountService.DAILY_QUOTA
    });
});

app.post('/api/test/fill-quota', (req, res) => {
    discountService.discountsGivenToday = discountService.DAILY_QUOTA;
    res.json({ message: 'Quota filled to max.' });
});


// Serve Static Frontend (later)
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Fallback for SPA
app.get(/.*/, (req, res) => {
    if (req.accepts('html')) {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.io active`);
});
