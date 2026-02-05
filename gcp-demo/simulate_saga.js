const inquirer = require('inquirer');
const fetch = require('node-fetch'); // Ensure fetch is available if old Node, else native.
// Actually standard 'http' is safer if no dependencies, but 'inquirer' implies node_modules exists.
// I'll assume standard fetch or polyfill not needed for modern node (18+).

// Helper for color
const red = (msg) => `\x1b[31m${msg}\x1b[0m`;
const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
const yellow = (msg) => `\x1b[33m${msg}\x1b[0m`;

const BASE_URL = 'http://localhost:8080';

async function callStep(stepName, endpoint, data) {
    process.stdout.write(`${stepName} ... `);
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await response.json();
        if (!response.ok) {
            console.log(red('FAILED'));
            throw new Error(json.error || response.statusText);
        }
        console.log(green('OK'));
        return json;
    } catch (error) {
        throw error;
    }
}

async function runSaga(scenario) {
    const bookingId = 'bk_' + Math.floor(Math.random() * 10000);
    console.log(`\n🏥 Starting Booking SAGA for ID: ${bookingId} [${scenario}]\n`);

    let serviceIds = ['srv_checkup'];
    let discountCode = 'HEALTH10';
    let amount = 200;

    if (scenario === 'Slot Unavailable') serviceIds = ['srv_full'];
    if (scenario === 'Payment Failed') amount = 6000;
    
    // --- STEP 1: INVENTORY ---
    try {
        await callStep('[1] Inventory Reserve', '/inventory/reserve', { bookingId, serviceIds });
    } catch (e) {
        console.log(red(`   ❌ Workflow Error: ${e.message}`));
        return;
    }

    // --- STEP 2: DISCOUNT ---
    let discountAmount = 0;
    try {
        const res = await callStep('[2] Apply Discount', '/discount/apply', { bookingId, code: discountCode });
        discountAmount = res.discountAmount;
    } catch (e) {
        console.log(red(`   ❌ Workflow Error: ${e.message}`));
        // Compensate Inventory
        await callStep('   ↩️ Compensating Inventory', '/inventory/compensate', { bookingId });
        return;
    }

    // --- STEP 3: PAYMENT ---
    try {
        await callStep(`[3] Process Payment ($${amount})`, '/payment/process', { bookingId, amount: amount - discountAmount });
    } catch (e) {
        console.log(red(`   ❌ Payment Error: ${e.message}`));
        console.log(yellow(`   ⚠️ Triggering SAGA COMPENSATION...`));
        
        // COMPENSATE INVENTORY
        await callStep('   ↩️ Compensating Inventory', '/inventory/compensate', { bookingId });
        
        console.log(red(`   ⏹ Booking Failed (Clean State)`));
        return;
    }

    // --- STEP 4: NOTIFY ---
    await callStep('[4] Notify Patient', '/notification/send', { bookingId, message: 'Confirmed' });

    // --- STEP 5: CONFIRM ---
    await callStep('[5] Finalize Booking', '/booking/confirm', { bookingId });

    console.log(green(`\n✅ Booking Complete!`));
}

async function main() {
    console.log("==========================================");
    console.log("   GCP WORKFLOWS: MICROSERVICES SAGA DEMO");
    console.log("==========================================");

    while (true) {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Choose a scenario:',
                choices: [
                    'Success Path',
                    'Slot Unavailable (Inventory Fail)',
                    'Payment Failed (Compensation Trigger)',
                    'Exit'
                ]
            }
        ]);

        if (action === 'Exit') process.exit(0);
        await runSaga(action);
        console.log("");
    }
}

main();
