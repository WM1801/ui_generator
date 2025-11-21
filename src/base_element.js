// base_element.js
class UIElement {
    constructor(schema, controllerName, handlers, eventManager, logger = GlobalLogger) {
        this.id = schema.id || schema.param_id || schema.command_id;
        this.displayName = schema.display_name || schema.title || this.id;
        this.visibility = schema.visibility !== false;
        this.enabled = schema.enabled !== false;
        this.controllerName = controllerName;
        this.handlers = handlers;
        this.eventManager = eventManager;
        this.logger = logger;
        this.domElement = null;
        this.children = [];
        this.eventSubscriptions = [];
        this.eventListeners = [];
    }

    render() {
        throw new Error("Метод render() должен быть реализован в подклассе.");
    }

    updateVisibility() {
        if (this.domElement) {
            this.domElement.style.display = this.visibility ? '' : 'none';
        }
    }

    updateEnabledState() {
        if (this.domElement && this.domElement.hasOwnProperty('disabled')) {
            this.domElement.disabled = !this.enabled;
        }
        if (this.domElement.tagName === 'FIELDSET') {
             this.domElement.disabled = !this.enabled;
        }
    }

    update() {
        this.updateVisibility();
        this.updateEnabledState();
    }

    subscribeToEvent(eventName, callback) {
        this.eventManager.subscribe(eventName, callback);
        this.eventSubscriptions.push([eventName, callback]);
    }

    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }

    destroy() {
        this.logger.debug(`Уничтожение элемента: ${this.id}`);

        if (this.domElement && this.domElement.parentNode) {
            this.domElement.parentNode.removeChild(this.domElement);
        }

        this.eventSubscriptions.forEach(([eventName, callback]) => {
            this.eventManager.unsubscribe(eventName, callback);
        });
        this.eventSubscriptions = [];

        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];

        this.children.forEach(child => child.destroy());
        this.children = [];

        this.domElement = null;
    }
}