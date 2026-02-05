const chalk = require('chalk');

class Logger {
    constructor(serviceName) {
        this.serviceName = serviceName;
    }

    info(message, meta = {}) {
        this._log('INFO', message, meta, chalk.blue);
    }

    warn(message, meta = {}) {
        this._log('WARN', message, meta, chalk.yellow);
    }

    error(message, meta = {}) {
        this._log('ERROR', message, meta, chalk.red);
    }

    success(message, meta = {}) {
        this._log('SUCCESS', message, meta, chalk.green);
    }

    _log(level, message, meta, colorFn) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        console.log(
            `${chalk.gray(`[${timestamp}]`)} ${colorFn(`[${level}]`)} ${chalk.bold(`[${this.serviceName}]`)} ${message} ${chalk.gray(metaStr)}`
        );
    }
}

module.exports = Logger;
