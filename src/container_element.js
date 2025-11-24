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
        super(schema, controllerName, null, eventManager, logger);
        this.factory = factory;
        this.children = schema.tabs.map(tabSchema =>
            this.factory.createElement({ ...tabSchema, type: 'tab' }, controllerName)
        ).filter(el => el !== null);
        // --- Читаем width из схемы ---
        this.width = schema.width || 'auto'; // По умолчанию auto, если не задано
        // ---
    }

    render() {
        const containerDiv = document.createElement('div');
        containerDiv.className = 'tabs-container-wrapper';
        containerDiv.id = `tabs-container-wrapper-${this.controllerName}-${this.id}`;

        // --- Применяем ширину ---
        containerDiv.style.flexBasis = this.width;
        containerDiv.style.flexShrink = 0; // Не сжимать, если другие элементы требуют места
        // containerDiv.style.flexGrow = 0; // Не растягивать, если есть свободное место (если нужно фикс. ширину)
        // или использовать shorthand: containerDiv.style.flex = `0 0 ${this.width}`; // grow shrink basis
        // или если нужно, чтобы элемент мог расти, но имел начальный размер: containerDiv.style.flex = `1 0 ${this.width}`;
        // Для 50/50 или других фикс. пропорций: containerDiv.style.flex = `0 0 ${this.width}`;
        // ---
        // ... (остальной код render как есть) ...
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
        super(schema, controllerName, null, eventManager, logger);
        this.factory = factory;
        this.graphicsSchema = schema.graphics;
        this.chartRenderers = new Map();;
        // --- Читаем width из схемы ---
        this.width = schema.width || 'auto';
        // ---
    }

    render() {
        const containerDiv = document.createElement('div');
        containerDiv.className = 'graphics-container-wrapper';
        containerDiv.id = `graphics-container-wrapper-${this.controllerName}-${this.id}`;

        // --- Применяем ширину ---
        containerDiv.style.flexBasis = this.width;
        containerDiv.style.flexShrink = 0;
        containerDiv.style.flex = `0 0 30';//${this.width}`; // Альтернатива
        // ---

        if (this.graphicsSchema && Array.isArray(this.graphicsSchema)) {
            this.graphicsSchema.forEach(graphicSchema => {
                const chartRenderer = new ChartRenderer(graphicSchema, this.controllerName, this.logger);
                const chartDomElement = chartRenderer.render();
                containerDiv.appendChild(chartDomElement);
                this.chartRenderers.set(chartRenderer.id, chartRenderer); // <-- Сохраняем экземпляр
            });
        }

        this.domElement = containerDiv;
        return this.domElement;
    }

    updateLineData(graphId, lineId, newData) {
        const renderer = this.chartRenderers.get(graphId);
        if (renderer) {
            // Вызываем updateLineData у конкретного ChartRenderer
            renderer.updateLineData(lineId, newData);
        } else {
            this.logger.warn(`GraphicsContainerElement.updateLineData: ChartRenderer с id '${graphId}' не найден.`);
        }
    }
    updateFormulaParams(graphId, formulaId, newParams) {
        const renderer = this.chartRenderers.get(graphId);
        if (renderer) {
            renderer.updateFormulaParams(formulaId, newParams);
        } else {
           this.logger.warn(`GraphicsContainerElement.updateFormulaParams: ChartRenderer с id '${graphId}' не найден.`);
        }
   }

   updateLineVisibility(graphId, lineId, isVisible) {
    const renderer = this.chartRenderers.get(graphId);
    if (renderer) {
        renderer.updateLineVisibility(lineId, isVisible);
    } else {
        this.logger.warn(`GraphicsContainerElement.updateLineVisibility: ChartRenderer с id '${graphId}' не найден.`);
    }
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
        // Уничтожаем все ChartRenderer'ы
        this.chartRenderers.forEach(renderer => renderer.destroy());
        this.chartRenderers.clear();
        super.destroy();
    }
}