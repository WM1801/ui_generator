class Logger {
    constructor(level = 'warn', prefix = '') {
        this.level = level;
        this.prefix = prefix;
        this.levelMap = {
            'error': 0,
            'warn': 1,
            'info': 2,
            'debug': 3
        };
    }

    _shouldLog(level) {
        return this.levelMap[level] <= this.levelMap[this.level];
    }

    _log(level, ...args) {
        if (this._shouldLog(level)) {
            const timestamp = new Date().toISOString();
            const messagePrefix = this.prefix ? `[${this.prefix}]` : '';
            console[level](`[${timestamp}] ${messagePrefix}`, ...args);
        }
    }

    error(...args) {
        this._log('error', ...args);
    }

    warn(...args) {
        this._log('warn', ...args);
    }

    info(...args) {
        this._log('info', ...args);
    }

    debug(...args) {
        this._log('debug', ...args);
    }
}

const GlobalLogger = new Logger('warn');