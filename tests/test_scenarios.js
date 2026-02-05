const BookingService = require('../src/services/BookingService');
const InventoryService = require('../src/services/InventoryService');
const DiscountService = require('../src/services/DiscountService');
const eventBus = require('../src/core/EventBus');
const chalk = require('chalk');

// Helper to delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

console.log('EventBus Imported:', eventBus);
console.log('Listeners:', eventBus ? eventBus.listeners : 'UNDEFINED');


async function runTests() {
    console.log(chalk.bold.magenta('🚀 STARTING AUTOMATED TEST SCENARIOS 🚀\n'));

    // =========================================================================
    // TEST CASE 1: POSITIVE FLOW (Success)
    // =========================================================================
    console.log(chalk.bold.cyan('--- Test Case 1: Positive Flow (Happy Path) ---'));
    console.log(chalk.gray('Expected: Inventory Reserved -> Discount Applied -> Booking Confirmed\n'));

    // Reset Bus
    eventBus.listeners.clear();

    // Setup Services
    new BookingService();
    new InventoryService();
    new DiscountService(100); // Plenty of quota

    // Setup specific test listener
    let case1Success = false;
    eventBus.subscribe('BOOKING_CONFIRMED', () => { case1Success = true; });

    // Execute
    eventBus.publish('TEST_START', { msg: 'Case 1' }); // Just to wake up logger
    const user1 = { name: 'Alice', gender: 'Female', dob: new Date().toISOString() }; // Birthday!
    const services1 = ['srv_1', 'srv_2']; // Total 1700

    // We need to access the booking service instance to call createBooking. 
    // Since I just did `new BookingService()` without saving var, I can't call it. 
    // I need to save the instances.
    const bookingService1 = new BookingService(); // Wait, I created two instances now. 
    // The previous `new BookingService()` is garbage but its listeners are attached.
    // I should clear listeners AGAIN or just fit it correctly. 

    // LET'S RESTART Cleanly for each test function.
}

async function testCase1() {
    console.log(chalk.bold.cyan('\n-----------------------------------------------'));
    console.log(chalk.bold.cyan('TEST CASE 1: Positive Flow'));
    console.log(chalk.bold.cyan('-----------------------------------------------'));

    eventBus.listeners.clear();
    const inventory = new InventoryService();
    const discount = new DiscountService(100);
    const booking = new BookingService();

    return new Promise(resolve => {
        eventBus.subscribe('BOOKING_CONFIRMED', (payload) => {
            console.log(chalk.green(`✅ TEST PASSED: Booking Confirmed. Final Price: ${payload.finalPrice}`));
            resolve();
        });

        booking.createBooking(
            { name: 'Happy User', gender: 'Female', dob: '1990-01-01' },
            ['srv_1'] // 500
        );
    });
}

async function testCase2() {
    console.log(chalk.bold.cyan('\n-----------------------------------------------'));
    console.log(chalk.bold.cyan('TEST CASE 2: Negative Flow (Quota Exceeded -> Compensation)'));
    console.log(chalk.bold.cyan('-----------------------------------------------'));

    eventBus.listeners.clear();
    const inventory = new InventoryService();
    // FORCE QUOTA 0
    const discount = new DiscountService(0);
    const booking = new BookingService();

    return new Promise(resolve => {
        let compensated = false;
        let rejected = false;

        eventBus.subscribe('DISCOUNT_REJECTED', (p) => {
            console.log(chalk.yellow(`ℹ️ Discount Rejected as expected: ${p.reason}`));
            rejected = true;
        });

        eventBus.subscribe('INVENTORY_RELEASED', (p) => {
            console.log(chalk.green(`✅ COMPENSATED: Inventory Released for ${p.bookingId}`));
            compensated = true;
        });

        eventBus.subscribe('BOOKING_FAILED', (p) => {
            if (rejected && compensated) {
                console.log(chalk.green(`✅ TEST PASSED: Transaction comfortably failed and compensated.`));
                resolve();
            }
        });

        // Must be eligible for R1 (Female + Birthday) to trigger the Quota Check (R2)
        // If not eligible for R1, it just skips discount and confirms booking.
        booking.createBooking(
            { name: 'Late User', gender: 'Female', dob: new Date().toISOString() },
            ['srv_1']
        );
    });
}

async function testCase3() {
    console.log(chalk.bold.cyan('\n-----------------------------------------------'));
    console.log(chalk.bold.cyan('TEST CASE 3: Negative Flow (Invalid Service -> Inventory Fail)'));
    console.log(chalk.bold.cyan('-----------------------------------------------'));

    eventBus.listeners.clear();
    const inventory = new InventoryService();
    const discount = new DiscountService(100);
    const booking = new BookingService();

    return new Promise(resolve => {
        eventBus.subscribe('INVENTORY_FAILED', (p) => {
            console.log(chalk.green(`✅ TEST PASSED: Inventory Failed as expected. Reason: ${p.reason}`));
            resolve();
        });

        booking.createBooking(
            { name: 'Hacker', gender: 'Male', dob: '1990-01-01' },
            ['srv_999'] // Invalid
        );
    });
}

async function main() {
    await testCase1();
    await sleep(1000);
    await testCase2();
    await sleep(1000);
    await testCase3();
    console.log(chalk.bold.magenta('\n\n✨ ALL SCENARIOS COMPLETED ✨'));
    process.exit(0);
}


main().catch(error => {
    console.error(chalk.red.bold('FATAL ERROR IN TEST RUNNER:'));
    console.error(error);
});

