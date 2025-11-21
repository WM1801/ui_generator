class DataConnector {
    constructor(eventManager, logger = GlobalLogger) {
        this.eventManager = eventManager;
        this.logger = logger;
        this.ws = null;
        this.reconnectInterval = 5000;
    }

    connect(url) {
        this.logger.info(`Подключение к ${url}...`);
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            this.logger.info('WebSocket соединение установлено.');
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.logger.debug('Получено сообщение:', data);
                this.handleMessage(data);
            } catch (error) {
                this.logger.error('Ошибка при разборе сообщения:', error);
            }
        };

        this.ws.onclose = () => {
            this.logger.warn('WebSocket соединение закрыто. Попытка переподключения...');
            setTimeout(() => this.connect(url), this.reconnectInterval);
        };

        this.ws.onerror = (error) => {
            this.logger.error('Ошибка WebSocket:', error);
        };
    }

    handleMessage(data) {
        if (data.type === 'PARAMETER_UPDATE') {
            this.eventManager.publish('PARAMETER_VALUE_CHANGED', {
                paramId: data.param_id,
                value: data.value,
                controllerName: data.controller_name
            });
        } else if (data.type === 'SCHEMA_UPDATE') {
            this.eventManager.publish('SCHEMA_UPDATE_RECEIVED', { schema: data.schema });
        } else if (data.type === 'VISIBILITY_UPDATE') {
             this.eventManager.publish('ELEMENT_VISIBILITY_CHANGED', {
                 elementId: data.element_id,
                 isVisible: data.visible
             });
        }
    }

    sendCommand(commandId, controllerName) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: 'COMMAND',
                command_id: commandId,
                controller_name: controllerName
            });
            this.ws.send(message);
            this.logger.info(`Команда отправлена: ${commandId}`);
        } else {
            this.logger.error('Невозможно отправить команду: соединение закрыто.');
        }
    }

    sendParameterChange(paramId, value, controllerName) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: 'PARAMETER_CHANGE',
                param_id: paramId,
                value: value,
                controller_name: controllerName
            });
            this.ws.send(message);
            this.logger.info(`Изменение параметра отправлено: ${paramId} = ${value}`);
        } else {
            this.logger.error('Невозможно отправить изменение параметра: соединение закрыто.');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}