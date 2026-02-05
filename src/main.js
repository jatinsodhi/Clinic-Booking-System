const BookingService = require('./services/BookingService');
const InventoryService = require('./services/InventoryService');
const DiscountService = require('./services/DiscountService');
const CLI = require('./cli/CLI');

// Instantiate Services
const inventoryService = new InventoryService();
const discountService = new DiscountService(100); // Default Quota 100
const bookingService = new BookingService();

// Start CLI
const cli = new CLI(bookingService);
cli.startListener();

console.log("System Initialized. Starting CLI...");

// Check if interactive
if (require.main === module) {
    cli.promptUser().catch(err => console.error(err));
}

module.exports = {
    bookingService,
    inventoryService,
    discountService,
    cli
};
