const BookingService = require('../src/services/BookingService');
const InventoryService = require('../src/services/InventoryService');
const DiscountService = require('../src/services/DiscountService');
const PaymentService = require('../src/services/PaymentService');
const eventBus = require('../src/core/EventBus');
const chalk = require('chalk');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log(chalk.bold.magenta('🚀 TEST CASE #2: Payment Failure & Compensation 🚀\n'));

    // Setup
    eventBus.listeners.clear();
    const inventory = new InventoryService();
    const discount = new DiscountService(100);
    const payment = new PaymentService();
    const booking = new BookingService();

    // 1. Force the Payment Service to FAIL the next request
    console.log('Publishing TEST_FORCE_PAYMENT_FAIL...');
    eventBus.publish('TEST_FORCE_PAYMENT_FAIL', {});
    await sleep(500); // Wait for the event to propagate

    await new Promise(resolve => {
        let discountReleased = false;
        let inventoryReleased = false;
        let paymentFailed = false;

        // Listen for the chain of bad events
        eventBus.subscribe('PAYMENT_FAILED', () => {
            console.log(chalk.red('Expected: PAYMENT_FAILED ❌'));
            paymentFailed = true;
        });

        eventBus.subscribe('DISCOUNT_RELEASED', () => {
            console.log(chalk.green('Compensation Step 1: Discount Quota Released ✅'));
            discountReleased = true;
        });

        eventBus.subscribe('INVENTORY_RELEASED', () => {
            console.log(chalk.green('Compensation Step 2: Inventory Released ✅'));
            inventoryReleased = true;
        });

        eventBus.subscribe('BOOKING_FAILED', async (p) => {
            console.log(chalk.red.bold('Booking Finalized as FAILED 🏁'));
            console.log(chalk.gray('Waiting for events to settle...'));
            await sleep(1000); // Allow other events to arrive

            if (paymentFailed && discountReleased && inventoryReleased) {
                console.log(chalk.bgGreen.bold('\n ✨ SUCCESS: Full Compensation Chain Verified! ✨ '));
                resolve();
            } else {
                console.log(chalk.bgRed('\n ⚠️ FAILURE: Compensation incomplete.'));
                if (!paymentFailed) console.log('Missing: PAYMENT_FAILED');
                if (!discountReleased) console.log('Missing: DISCOUNT_RELEASED');
                if (!inventoryReleased) console.log('Missing: INVENTORY_RELEASED');
                resolve(); // Resolve anyway to finish process
            }
        });

        // Trigger Scenario: "Female + Birthday" (Eligible for R1 discount)
        // We want to verify that the discount quota (consumed at step 3) is RELEASED at step 5
        booking.createBooking(
            { name: 'Unlucky User', gender: 'Female', dob: new Date().toISOString() },
            ['srv_1']
        );
    });

    process.exit(0);
}

main().catch(console.error);
