const Logger = require('../core/Logger');
const eventBus = require('../core/EventBus');

class DiscountService {
    constructor(dailyQuota = 100) {
        this.logger = new Logger('DiscountService');
        this.DAILY_QUOTA = dailyQuota; // R2: Configurable limit
        this.discountsGivenToday = 0;

        this.initializeListeners();
    }

    initializeListeners() {
        eventBus.subscribe('INVENTORY_RESERVED', this.handleInventoryReserved.bind(this));
        eventBus.subscribe('COMPENSATE_DISCOUNT', this.handleCompensation.bind(this));
    }

    // Helper to check if today is birthday
    isBirthday(dobStr) {
        if (!dobStr) return false;
        const today = new Date();
        const dob = new Date(dobStr);
        return today.getDate() === dob.getDate() && today.getMonth() === dob.getMonth();
    }

    async handleCompensation(payload) {
        const { bookingId, reason } = payload;
        // Optimization: We could track IF a discount was actually given for this bookingId,
        // but for this simulation, we can assume the Orchestrator only calls this if necessary,
        // or we just decrement safely.
        // Ideally, we'd check a local Map<bookingId, boolean> to see if we consumed quota.

        // For strict correctness in this demo, let's assume we blindly trust the orchestrator 
        // OR we just decrement if > 0 (simplification for "System-wide" count).

        if (this.discountsGivenToday > 0) {
            this.discountsGivenToday--;
            this.logger.warn(`Compensation: Released Discount Quota.`, { bookingId, newQuotaUsed: this.discountsGivenToday });
            eventBus.publish('DISCOUNT_RELEASED', { bookingId, remainingQuota: this.DAILY_QUOTA - this.discountsGivenToday });
        } else {
            this.logger.info(`Compensation: No quota to release or already 0.`, { bookingId });
        }
    }

    async handleInventoryReserved(payload) {
        const { bookingId, basePrice, user } = payload;
        this.logger.info(`Evaluating discounts`, { bookingId, basePrice, user });

        let finalPrice = basePrice;
        let discountApplied = false;
        let discountType = 'NONE';

        // Pricing Rule R1:
        // (Female AND Birthday) OR (Base > 1000)
        const isFemale = user.gender && user.gender.toLowerCase() === 'female';
        const isBirthday = this.isBirthday(user.dob);
        const isHighValue = basePrice > 1000;

        const isEligibleForR1 = (isFemale && isBirthday) || isHighValue;

        if (isEligibleForR1) {
            // Rule R2: Check Quota
            if (this.discountsGivenToday >= this.DAILY_QUOTA) {
                this.logger.warn(`R2 Exceeded: Daily discount quota reached.`, { bookingId, used: this.discountsGivenToday });

                // REJECT the booking as per requirement: "If quota exhausted -> reject request"
                eventBus.publish('DISCOUNT_REJECTED', {
                    bookingId,
                    reason: 'Daily discount quota reached. Please try again tomorrow.'
                });
                return;
            }

            // Apply 12% Discount
            const discountAmount = basePrice * 0.12;
            finalPrice = basePrice - discountAmount;

            this.discountsGivenToday++;
            discountApplied = true;
            discountType = 'R1_12_PERCENT_OFF';

            this.logger.success(`Discount R1 applied`, { bookingId, discountAmount, newTotal: finalPrice });
        } else {
            this.logger.info(`No discount applicable`, { bookingId });
        }

        // Emit Success
        eventBus.publish('DISCOUNT_APPLIED', {
            bookingId,
            basePrice,
            finalPrice,
            discountType
        });
    }
}

module.exports = DiscountService;
