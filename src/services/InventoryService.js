const Logger = require('../core/Logger');
const eventBus = require('../core/EventBus');

class InventoryService {
    constructor() {
        this.logger = new Logger('InventoryService');
        this.services = {
            'srv_1': { name: 'General Checkup', price: 500 },
            'srv_2': { name: 'X-Ray', price: 1200 },
            'srv_3': { name: 'Blood Test', price: 300 }
        };
        // Simulated reservation DB: bookingId -> list of services
        this.reservations = new Map();

        this.initializeListeners();
    }

    initializeListeners() {
        eventBus.subscribe('BOOKING_INITIATED', this.handleBookingInitiated.bind(this));
        eventBus.subscribe('COMPENSATE_INVENTORY', this.handleCompensation.bind(this));
    }

    async handleBookingInitiated(payload) {
        const { bookingId, serviceIds } = payload;
        this.logger.info(`Received booking request`, { bookingId, services: serviceIds });

        // specific negative case simulation: if serviceId 'srv_999' is passed, fail it.
        if (serviceIds.includes('srv_999')) {
            this.logger.error(`Service not found`, { bookingId });
            eventBus.publish('INVENTORY_FAILED', { bookingId, reason: 'Service not found' });
            return;
        }

        // Validate services
        const validServices = serviceIds.every(id => this.services[id]);
        if (!validServices) {
            this.logger.error(`Invalid services detected`, { bookingId });
            eventBus.publish('INVENTORY_FAILED', { bookingId, reason: 'Invalid Service ID' });
            return;
        }

        // Reserve
        this.reservations.set(bookingId, serviceIds);

        // Calculate Base Price
        const basePrice = serviceIds.reduce((sum, id) => sum + this.services[id].price, 0);

        this.logger.success(`Slots reserved.`, { bookingId, basePrice });

        eventBus.publish('INVENTORY_RESERVED', {
            bookingId,
            serviceIds,
            basePrice,
            user: payload.user // Pass user context forward
        });
    }

    async handleCompensation(payload) {
        const { bookingId, reason } = payload;
        this.logger.warn(`Compensating transaction. Releasing slots.`, { bookingId, reason });

        if (this.reservations.has(bookingId)) {
            this.reservations.delete(bookingId);
            this.logger.success(`Compensation successful. Slots released.`, { bookingId });
            eventBus.publish('INVENTORY_RELEASED', { bookingId });
        } else {
            this.logger.warn(`No active reservation found to compensate`, { bookingId });
        }
    }
}

module.exports = InventoryService;
