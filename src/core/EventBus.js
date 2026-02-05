const Logger = require('./Logger');
const { v4: uuidv4 } = require('uuid');

class EventBus {
    constructor() {
        this.listeners = new Map();
        this.logger = new Logger('EventBus');
    }

    subscribe(topic, callback) {
        if (!this.listeners.has(topic)) {
            this.listeners.set(topic, []);
        }
        this.listeners.get(topic).push(callback);
        this.logger.info(`New subscriber for topic: ${topic}`);
    }

    async publish(topic, payload) {
        const traceId = payload.traceId || uuidv4();
        const enhancedPayload = { ...payload, traceId };

        this.logger.info(`Publishing event: ${topic}`, { traceId });

        const callbacks = this.listeners.get(topic) || [];

        // Simulate network latency for distributed system feel
        const latency = Math.floor(Math.random() * 400) + 100; // 100-500ms

        setTimeout(() => {
            callbacks.forEach(async (cb) => {
                try {
                    await cb(enhancedPayload);
                } catch (err) {
                    this.logger.error(`Error in listener for ${topic}`, { error: err.message, traceId });
                }
            });
        }, latency);
    }
}

module.exports = new EventBus();
