class EventManager {
    constructor(logger = GlobalLogger) {
        this.listeners = {};
        this.logger = logger;
    }

    subscribe(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
        this.logger.debug(`Подписка на событие: ${eventName}`);
    }

    unsubscribe(eventName, callback) {
        if (this.listeners[eventName]) {
            this.listeners[eventName] = this.listeners[eventName].filter(listener => listener !== callback);
            this.logger.debug(`Отписка от события: ${eventName}`);
        }
    }

    publish(eventName, data) {
        if (this.listeners[eventName]) {
            console.log(eventName); 
            if(eventName == "PARAMETER_VALUE_CHANGED"){
                console.log('event, c:' + data.controllerName + " p:" + data.paramId + " d:" +data.value);
            }
            else {
                console.log('command, c:' + data.controllerName + " cc:" + data.commandId + " s:" +data.state);
            }
                this.logger.debug(`Публикация события: ${eventName}`, data);
            this.listeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.logger.error(`Ошибка в обработчике события '${eventName}':`, error);
                }
            });
        }
    }
}