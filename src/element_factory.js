class ElementFactory {
    constructor(handlers, stateManager, eventManager, logger = GlobalLogger) {
        this.handlers = handlers;
        this.stateManager = stateManager;
        this.eventManager = eventManager;
        this.logger = logger;
    }

    createElement(schema, controllerName) {
        if (!schema.type) {
            this.logger.warn('Схема элемента не содержит типа:', schema);
            return null;
        }

        let element;
        switch (schema.type) {
            // --- НОВОЕ: Типы для items ---
            case 'tabs':
                element = new TabsContainerElement(schema, controllerName, this, this.eventManager, this.logger);
                break;
            case 'graphics':
                element = new GraphicsContainerElement(schema, controllerName, this, this.eventManager, this.logger);
                break;
            // case 'custom_panel': // <-- Можно добавить позже
            //     element = new CustomPanelElement(schema, controllerName, this, this.eventManager, this.logger);
            //     break;
            // ---
            case 'tab':
                element = new TabElement(schema, controllerName, this.handlers, this, this.eventManager, this.logger);
                break;
            case 'group':
                element = new GroupElement(schema, controllerName, this.handlers, this, this.eventManager, this.logger);
                break;
            case 'parameter':
                element = this._createParameterElement(schema, controllerName);
                break;
            case 'command':
                element = new CommandElement(schema, controllerName, this.handlers, this.eventManager, this.logger);
                break;
            default:
                this.logger.warn(`Неизвестный тип элемента в схеме: ${schema.type}`);
                return null;
        }

        if (element) {
            this.stateManager.registerElement(element.id, element);
        }
        return element;
    }

    _createParameterElement(schema, controllerName) {
        switch (schema.frontend_type) {
            case 'readonly':
                return new ReadonlyParameterElement(schema, controllerName, this.handlers, this.eventManager, this.logger);
            case 'number':
                return new NumberParameterElement(schema, controllerName, this.handlers, this.eventManager, this.logger);
            case 'flags':
                return new FlagsParameterElement(schema, controllerName, this.handlers, this.eventManager, this.logger);
            case 'slider':
                return new SliderParameterElement(schema, controllerName, this.handlers, this.eventManager, this.logger);
            case 'select':
                return new SelectParameterElement(schema, controllerName, this.handlers, this.eventManager, this.logger);
            case 'radio':
                return new RadioParameterElement(schema, controllerName, this.handlers, this.eventManager, this.logger);
            default:
                this.logger.warn(`Неизвестный frontend_type для параметра: ${schema.frontend_type}`);
                return null;
        }
    }
}