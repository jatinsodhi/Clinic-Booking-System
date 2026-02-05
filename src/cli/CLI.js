const inquirer = require('inquirer');
const chalk = require('chalk');
const eventBus = require('../core/EventBus');

class CLI {
    constructor(bookingService) {
        this.bookingService = bookingService;
        this.servicesList = [
            { name: 'General Checkup (₹500)', value: 'srv_1' },
            { name: 'X-Ray (₹1200)', value: 'srv_2' },
            { name: 'Blood Test (₹300)', value: 'srv_3' },
            { name: 'INVALID SERVICE (Test Fail)', value: 'srv_999' }
        ];
    }

    startListener() {
        // Listen for final outcomes to reprint the menu or show final status
        eventBus.subscribe('BOOKING_CONFIRMED', (payload) => {
            console.log(chalk.green.bold(`\n\n🎉 BOOKING SUCCESSFUL!`));
            console.log(chalk.green(`Reference ID: ${payload.referenceId}`));
            console.log(chalk.green(`Final Price: ₹${payload.finalPrice}`));
            console.log(chalk.gray('--------------------------------------------------\n'));
            // this.promptUser(); 
        });

        eventBus.subscribe('BOOKING_FAILED', (payload) => {
            console.log(chalk.red.bold(`\n\n❌ BOOKING FAILED`));
            console.log(chalk.red(`Reason: ${payload.reason}`));
            console.log(chalk.gray('--------------------------------------------------\n'));
        });
    }

    async promptUser() {
        console.log(chalk.cyan.bold('\n--- 🏥 NEW BOOKING REQUEST ---'));

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Patient Name:',
                default: 'Jane Doe'
            },
            {
                type: 'list',
                name: 'gender',
                message: 'Gender:',
                choices: ['Female', 'Male', 'Other']
            },
            {
                type: 'input',
                name: 'dob',
                message: 'Date of Birth (YYYY-MM-DD):',
                default: new Date().toISOString().split('T')[0], // Default to today for easy testing of birthday rule
                validate: (input) => {
                    const regEx = /^\d{4}-\d{2}-\d{2}$/;
                    return regEx.test(input) || 'Please enter a valid date in YYYY-MM-DD format.';
                }
            },
            {
                type: 'checkbox',
                name: 'selectedServices',
                message: 'Select Services:',
                choices: this.servicesList,
                validate: (answer) => {
                    if (answer.length < 1) {
                        return 'You must choose at least one service.';
                    }
                    return true;
                }
            }
        ]);

        console.log(chalk.yellow('\nSubmitting request... Watch the logs below for real-time processing.\n'));

        this.bookingService.createBooking({
            name: answers.name,
            gender: answers.gender,
            dob: answers.dob
        }, answers.selectedServices);
    }
}

module.exports = CLI;
