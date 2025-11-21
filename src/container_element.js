// container_element.js
class TabElement extends UIElement {
    constructor(schema, controllerName, handlers, factory, eventManager, logger = GlobalLogger) {
        super(schema, controllerName, handlers, eventManager, logger);
        this.factory = factory;
        this.children = schema.groups.map(groupSchema =>
            this.factory.createElement({ ...groupSchema, type: 'group' }, controllerName)
        ).filter(el => el !== null);
    }

    render() {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = this.displayName;
        button.dataset.tabId = this.id;
        button.id = `tab-btn-${this.controllerName}-${this.id}`;
        this.domElement = button;

        const contentDiv = document.createElement('div');
        contentDiv.id = `tab-${this.controllerName}-${this.id}`;
        contentDiv.classList.add('tab-content');

        this.children.forEach(child => {
            const childDom = child.render();
            if (childDom) contentDiv.appendChild(childDom);
        });

        return { button, content: contentDiv };
    }

    destroy() {
        super.destroy();
    }
}

class GroupElement extends UIElement {
    constructor(schema, controllerName, handlers, factory, eventManager, logger = GlobalLogger) {
        super(schema, controllerName, handlers, eventManager, logger);
        this.factory = factory;
        this.children = schema.items.map(itemSchema =>
            this.factory.createElement(itemSchema, controllerName)
        ).filter(el => el !== null);
    }

    render() {
        const fieldset = document.createElement('fieldset');
        fieldset.className = 'group';
        fieldset.id = `${this.controllerName}-${this.id}`;

        const legend = document.createElement('legend');
        legend.textContent = this.displayName;
        fieldset.appendChild(legend);

        const groupContent = document.createElement('div');
        groupContent.className = 'group-content';

        this.children.forEach(child => {
            const childDom = child.render();
            if (childDom) groupContent.appendChild(childDom);
        });

        fieldset.appendChild(groupContent);
        this.domElement = fieldset;
        return this.domElement;
    }

    destroy() {
        super.destroy();
    }
}

class TabsContainerElement extends UIElement {
    constructor(schema, controllerName, factory, eventManager, logger = GlobalLogger) {
        super(schema, controllerName, null, eventManager, logger); // handlers не нужны для контейнера
        this.factory = factory;
        // Схема tabs теперь внутри schema.tabs
        this.children = schema.tabs.map(tabSchema =>
            this.factory.createElement({ ...tabSchema, type: 'tab' }, controllerName)
        ).filter(el => el !== null);
    }

    render() {
        const containerDiv = document.createElement('div');
        containerDiv.className = 'tabs-container-wrapper'; // Новый класс для стиля
        containerDiv.id = `tabs-container-wrapper-${this.controllerName}-${this.id}`;

        const tabsListContainer = document.createElement('div');
        tabsListContainer.className = 'tabs-list-container';
        const tabsListUl = document.createElement('ul');
        tabsListUl.className = 'tabs-list';
        tabsListUl.id = `tabs-list-${this.controllerName}-${this.id}`;
        tabsListContainer.appendChild(tabsListUl);

        const tabsContentContainer = document.createElement('div');
        tabsContentContainer.className = 'tabs-content';
        tabsContentContainer.id = `tabs-content-${this.controllerName}-${this.id}`;

        this.children.forEach(tabElement => {
            const { button, content } = tabElement.render();

            if (tabElement.visibility) {
                tabsListUl.appendChild(button);
                tabsContentContainer.appendChild(content);
            }
        });

        containerDiv.appendChild(tabsListContainer);
        containerDiv.appendChild(tabsContentContainer);

        this.domElement = containerDiv;
        return this.domElement;
    }

    destroy() {
        // Уничтожает дочерние вкладки
        this.children.forEach(child => child.destroy());
        this.children = [];
        super.destroy(); // Вызывает destroy родителя
    }
}

class GraphicsContainerElement extends UIElement {
    constructor(schema, controllerName, factory, eventManager, logger = GlobalLogger) {
        super(schema, controllerName, null, eventManager, logger); // handlers не нужны
        this.factory = factory; // Хотя factory не используется напрямую, ChartRenderer создаётся отдельно
        this.graphicsSchema = schema.graphics; // Сохраняем схему графиков
        this.chartRenderers = []; // Массив ChartRenderer
    }

    render() {
        const containerDiv = document.createElement('div');
        containerDiv.className = 'graphics-container-wrapper'; // Новый класс
        containerDiv.id = `graphics-container-wrapper-${this.controllerName}-${this.id}`;

        // Создаём ChartRenderer для каждого элемента в graphicsSchema
        if (this.graphicsSchema && Array.isArray(this.graphicsSchema)) {
            this.graphicsSchema.forEach(graphicSchema => {
                const chartRenderer = new ChartRenderer(graphicSchema, this.controllerName, this.logger);
                const chartDomElement = chartRenderer.render();
                containerDiv.appendChild(chartDomElement);
                this.chartRenderers.push(chartRenderer);
            });
        }

        this.domElement = containerDiv;
        return this.domElement;
    }

    // Методы для обновления графиков можно добавить сюда или оставить в UIGenerator
    // Пример:
    updateGraphData(graphId, labels, data) {
        const renderer = this.chartRenderers.find(r => r.id === graphId);
        if (renderer) {
            renderer.updateData(labels, data);
        }
    }

    updateGraphTitleVisibility(graphId, isVisible) {
        const renderer = this.chartRenderers.find(r => r.id === graphId);
        if (renderer) {
            renderer.updateTitleVisibility(isVisible);
        }
    }

    destroy() {
        // Уничтожает ChartRenderer'ы
        this.chartRenderers.forEach(renderer => renderer.destroy());
        this.chartRenderers = [];
        super.destroy();
    }
}