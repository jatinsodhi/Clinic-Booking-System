const axios = require('axios'); // User might not have axios installed, I should check.
// If axios is not in package.json, I'll use native fetch (available in Node 18+)
// Node.js version check? The user likely has a recent version.
// package.json has "express", "inquirer".
// I'll use "fetch" which is global in Node 18+. To be safe, I'll use http module or assume fetch.
// Actually, I can use the existing 'inquirer' to make a CLI.

const inquirer = require('inquirer');

const BASE_URL = 'http://localhost:8080';

async function callService(endpoint, data) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.error || response.statusText);
        }
        return json;
    } catch (error) {
        throw error;
    }
}

async function runWorkflow(scenario) {
    const orderId = 'ord_' + Math.floor(Math.random() * 1000);
    console.log(`\n--- Starting Workflow for Order ${orderId} [Scenario: ${scenario}] ---`);

    let item = 'checkup';
    let amount = 100;

    if (scenario === 'Inventory Fail') item = 'outofstock';
    if (scenario === 'Payment Fail') amount = 5000; // Limit is 1000

    // STEP 1: Reserve Inventory
    try {
        console.log(`[Step 1] Calling Inventory Service (Reserve)...`);
        const inv = await callService('/inventory/reserve', { orderId, item, quantity: 1 });
        console.log(`✅ Inventory Reserved:`, inv);
    } catch (e) {
        console.error(`❌ Inventory Failed: ${e.message}`);
        console.log(`⏹ Workflow Ended (Failure in Step 1)`);
        return;
    }

    // STEP 2: Process Payment
    try {
        console.log(`[Step 2] Calling Payment Service (Process $${amount})...`);
        const pay = await callService('/payment/process', { orderId, amount });
        console.log(`✅ Payment Successful:`, pay);
    } catch (e) {
        console.error(`❌ Payment Failed: ${e.message}`);
        console.log(`⚠️ Initiating Compensation (Saga Pattern)...`);

        // COMPENSATION
        try {
            console.log(`[Compensation] Calling Inventory Service (Release)...`);
            await callService('/inventory/compensate', { orderId });
            console.log(`✅ Compensation Complete: Inventory Released.`);
        } catch (compError) {
            console.error(`❌ CRITICAL: Compensation Failed`, compError);
        }
        console.log(`⏹ Workflow Ended (Compensated Failure)`);
        return;
    }

    // STEP 3: Notify
    try {
        console.log(`[Step 3] Calling Notification Service...`);
        await callService('/notification/send', { orderId, message: 'Order Confirmed' });
        console.log(`✅ Notification Sent.`);
    } catch (e) {
        // Non-critical failure might just log
        console.error(`⚠️ Notification Failed: ${e.message}`);
    }

    // STEP 4: Confirm
    await callService('/booking/confirm', { orderId });
    console.log(`🎉 Workflow Completed Successfully!`);
}

async function main() {
    console.log("GCP Workflows & Microservices Demo Simulator");

    while (true) {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Select a Scenario to Simulate:',
                choices: [
                    'Happy Path (Success)',
                    'Inventory Fail (Out of Stock)',
                    'Payment Fail (Compensate Inventory)',
                    'Exit'
                ]
            }
        ]);

        if (action === 'Exit') process.exit(0);

        await runWorkflow(action);
        console.log("\n--------------------------------------------------\n");
    }
}

main();
