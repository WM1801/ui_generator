class UIStateManager {
    constructor(eventManager, logger = GlobalLogger) {
        this.elements = new Map();
        this.eventManager = eventManager;
        this.logger = logger;
        this.subscribeToEvents();
    }

    subscribeToEvents() {
        this.eventManager.subscribe('PARAMETER_VALUE_CHANGED', (data) => {
            this.logger.debug('Event: PARAMETER_VALUE_CHANGED', data);
        });

        this.eventManager.subscribe('ELEMENT_VISIBILITY_CHANGED', (data) => {
            this.logger.debug('Event: ELEMENT_VISIBILITY_CHANGED', data);
            this.updateElementVisibility(data.elementId, data.isVisible);
        });

        this.eventManager.subscribe('COMMAND_CLICKED', (data) => {
            this.logger.debug('Event: COMMAND_CLICKED', data);
        });
        this.eventManager.subscribe('COMMAND_TOGGLED', (data) => {
            this.logger.debug('Event: COMMAND_TOGGLED', data);
        });
    }

    registerElement(id, element) {
        if (this.elements.has(id)) {
            this.logger.warn(`Элемент с id '${id}' уже зарегистрирован. Перезапись.`);
        }
        this.elements.set(id, element);
    }

    updateElementValue(id, value) {
        const element = this.elements.get(id);
        if (element && typeof element.updateValue === 'function') {
            element.updateValue(value);
        } else {
            this.logger.warn(`Попытка обновить значение неизвестного или несовместимого параметра: ${id}`);
        }
    }

    //Обновление нескольких параметров ---
    updateMultipleElementValues(paramsObject) {
        for (const [paramId, value] of Object.entries(paramsObject)) {
            this.updateElementValue(paramId, value); // Используем существующую логику
        }
    }

    updateElementVisibility(id, isVisible) {
        const element = this.elements.get(id);
        if (element) {
            element.visibility = isVisible;
            element.update();
        } else {
            this.logger.warn(`Попытка обновить видимость неизвестного элемента: ${id}`);
        }
    }

    applySchemaVisibility(schema) {
        const traverse = (obj) => {
            if (obj.hasOwnProperty('id') && obj.hasOwnProperty('visibility')) {
                this.updateElementVisibility(obj.id, obj.visibility);
            }
            if (Array.isArray(obj.tabs)) obj.tabs.forEach(traverse);
            if (Array.isArray(obj.groups)) obj.groups.forEach(traverse);
            if (Array.isArray(obj.items)) obj.items.forEach(traverse);
        };
        traverse(schema);
    }

    /**
     * Получает значение параметра по его ID.
     * @param {string} paramId - ID параметра.
     * @returns {any|undefined} Значение параметра или undefined, если элемент не найден или не поддерживает getValue.
     */
    getParameterValue(paramId) {
        const element = this.elements.get(paramId);
        if (element && typeof element.getValue === 'function') {
            return element.getValue();
        } else {
            // Проверим, является ли элемент параметром, но без метода getValue
            if (element && element.hasOwnProperty('type') && element.type === 'parameter') {
                 this.logger.warn(`Элемент параметра '${paramId}' не поддерживает метод getValue.`);
            } else if (!element) {
                 this.logger.warn(`Попытка получить значение неизвестного элемента: ${paramId}`);
            }
            return undefined;
        }
    }

    clearElements() {
        this.elements.clear();
    }
}