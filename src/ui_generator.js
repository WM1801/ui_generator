class UIGenerator {
    constructor(controllerId, schema, elementHandlers, logger = GlobalLogger) {
        this.schema = schema;
        //this.controllerName = schema.controller.name;
        this.controllerName = controllerId;
        this.handlers = elementHandlers;
        this.logger = logger;

        const validation = SchemaValidator.validate(schema);
        if (!validation.valid) {
            this.logger.error('Ошибка валидации схемы:', validation.errors);
        }

        this.eventManager = new EventManager(this.logger);
        this.stateManager = new UIStateManager(this.eventManager, this.logger);
        this.elementFactory = new ElementFactory(this.handlers, this.stateManager, this.eventManager, this.logger);

        this.tabs = [];
        this.rootElement = null;

        //Карта для хранения элементов items ---
        this.itemsMap = new Map(); // id -> UIElement instance (TabsContainerElement, GraphicsContainerElement, etc.)

        this.eventManager.subscribe('SCHEMA_UPDATE_RECEIVED', (data) => {
            this.logger.info('Получено обновление схемы, обновление UI...');
            this.applySchemaVisibility(data.schema);
        });

        this.eventManager.subscribe('COMMAND_CLICKED', (data) => {
            if (this.dataConnector) {
                this.dataConnector.sendCommand(data.commandId, data.controllerName);
            }
        });

        this.eventManager.subscribe('PARAMETER_VALUE_CHANGED', (data) => {
            if (this.dataConnector) {
                this.dataConnector.sendParameterChange(data.paramId, data.value, data.controllerName);
            }
        });
    }

    /**
     * Получает отображаемое имя контроллера из схемы.
     * @returns {string}
     */
    getControllerDisplayName() {
        return this.schema.controller.display_name;
    }

    /**
     * Устанавливает новое отображаемое имя контроллера в схеме и обновляет его в DOM (если UI уже сгенерирован).
     * @param {string} newDisplayName - Новое отображаемое имя.
     */
    setControllerDisplayName(newDisplayName) {
        if (typeof newDisplayName === 'string' && newDisplayName.trim() !== '') {
            // Обновляем схему
            this.schema.controller.display_name = newDisplayName;
            // Обновляем внутреннюю переменную
            this.displayName = newDisplayName;

            // Обновляем DOM, если rootElement существует
            if (this.rootElement) {
                const titleElement = this.rootElement.querySelector('h1');
                if (titleElement) {
                    titleElement.textContent = newDisplayName; // Обновляем текст заголовка
                    // ID заголовка не меняется, он зависит от controllerName
                }
            }
            this.logger.info(`Отображаемое имя контроллера изменено на: ${newDisplayName}`);
        } else {
            this.logger.warn(`setControllerDisplayName: Новое отображаемое имя должно быть непустой строкой. Получено: ${newDisplayName}`);
        }
    }

    setDataConnector(dataConnector) {
        this.dataConnector = dataConnector;
    }

    generateUI(targetElementId) {
        if (this.rootElement && this.rootElement.parentNode) {
            this.destroyUI();
        }

        const targetElement = document.getElementById(targetElementId);
        if (!targetElement) {
            this.logger.error(`Target element with ID '${targetElementId}' not found for controller ${this.controllerName}.`);
            return;
        }

        const controllerDiv = document.createElement('div');
        controllerDiv.className = 'controller-container';
        controllerDiv.setAttribute('data-controller-id', this.controllerName);
        this.rootElement = controllerDiv;

        // --- Заголовок ---
        const titleH1 = document.createElement('h1');
        titleH1.id = `controller-title-${this.controllerName}`;
        titleH1.textContent = this.schema.controller.display_name;

        const controllerVisibilityHead = this.schema.controller.visibility_head !== false;
        if (!controllerVisibilityHead) {
            titleH1.style.display = 'none';
        }
        controllerDiv.appendChild(titleH1);

        // --- Основной контейнер с layout ---
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-container';

        const layout = this.schema.controller.layout || 'row';
        if (layout === 'column') {
            mainContainer.style.flexDirection = 'column';
        } else {
            mainContainer.style.flexDirection = 'row';
        }

        // --- Рендерим items ---
        if (this.schema.controller.items && Array.isArray(this.schema.controller.items)) {
            this.schema.controller.items.forEach(itemSchema => {
                const itemElement = this.elementFactory.createElement(itemSchema, this.controllerName);
                if (itemElement) {
                    const itemDomElement = itemElement.render();
                    if (itemSchema.visibility === false) {
                        itemDomElement.style.display = 'none';
                    }
                    mainContainer.appendChild(itemDomElement);
                    // --- СОХРАНЯЕМ ССЫЛКУ НА ЭЛЕМЕНТ ---
                    this.itemsMap.set(itemElement.id, itemElement);
                    // ---
                }
            });
        }

        controllerDiv.appendChild(mainContainer);

        targetElement.appendChild(controllerDiv);

        this._setupTabSwitching();
    }

    //Настройка ResizeObserver для mainContainer ---
    _setupMainContainerResizeObserver(mainContainerElement) {
        if (typeof ResizeObserver !== 'undefined' && mainContainerElement) {
            this.mainContainerResizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    if (entry.target === mainContainerElement) {
                        // console.log('ResizeObserver: mainContainer размеры изменились', entry.contentRect);
                        // Вызываем resize у всех ChartRenderer'ов
                        this._resizeAllCharts();
                    }
                }
            });
            this.mainContainerResizeObserver.observe(mainContainerElement);
            this.logger.info('ResizeObserver установлен для mainContainer.');
        } else {
            this.logger.warn('ResizeObserver не поддерживается или mainContainer не найден.');
        }
    }

    //Обновление размера всех графиков ---
    _resizeAllCharts() {
        // Проходим по всем элементам items
        for (let [id, itemElement] of this.itemsMap) {
            if (itemElement instanceof GraphicsContainerElement) {
                // Проходим по всем ChartRenderer'ам внутри GraphicsContainerElement
                itemElement.chartRenderers.forEach(renderer => {
                    if (renderer.chartInstance) {
                        // console.log('Вызов chartInstance.resize() для графика:', renderer.id);
                        renderer.chartInstance.resize();
                    }
                });
            }
        }
    }


    /**
     * Управляет видимостью заголовка контроллера (h1).
     * @param {boolean} isVisible - true для отображения, false для скрытия.
     */
    setControllerHeaderVisibility(isVisible) {
        if (this.rootElement) {
            const headerElement = this.rootElement.querySelector('h1');
            if (headerElement) {
                headerElement.style.display = isVisible ? '' : 'none';
            } else {
                this.logger.warn(`Элемент заголовка не найден при попытке изменить видимость.`);
            }
        } else {
            this.logger.warn(`rootElement не существует при попытке изменить видимость заголовка.`);
        }
    }

    updateItemVisibility(itemID, isVisible) {
        const itemElement = this.itemsMap.get(itemID);
        if (itemElement && itemElement.domElement) {
            itemElement.domElement.style.display = isVisible ? '' : 'none';
        } else {
            this.logger.warn(`Элемент с ID '${itemID}' не найден для изменения видимости.`);
        }
   }


    // --- Управление графиками через itemsMap ---
    // --- УДАЛЁН ИЛИ ОБНОВЛЁН: updateGraphData ---
    // updateGraphData(graphId, labels, data) {
    //     // Этот метод предполагал обновление *всех* данных графика по старой логике
    //     // и вызывал renderer.updateData, которого больше нет.
    //     // Удалим его или изменим, чтобы он использовал updateLineData.
    //     // Предположим, что labels и data - это точки для одной из линий.
    //     // Тогда нужно знать, *какую* линию обновлять.
    //     // Лучше использовать updateLineData(graphId, lineId, newData).
    //     this.logger.warn('updateGraphData устарел. Используйте updateLineData для обновления конкретных линий.');
    // }
    // ---
    // Или, если вы хотите оставить его для *одной* линии, например, 'prakt', и передавать массив точек:
    updateGraphData(graphId, newData) {
        this.logger.warn('updateGraphData устарел. Используйте updateLineData(graphId, lineId, newData).');
        // Предположим, что newData - это массив точек для линии 'prakt'
        // и что 'prakt' - это идентификатор линии данных реального времени.
        this.updateLineData(graphId, 'prakt', newData);
    }

    // ---  updateLineData ---
    updateLineData(graphId, lineId, newData) {
        // Найдём GraphicsContainerElement, содержащий нужный ChartRenderer
        for (let [id, itemElement] of this.itemsMap) {
            if (itemElement instanceof GraphicsContainerElement) {
                // Проверим, содержит ли он график с нужным graphId
                // Предположим, GraphicsContainerElement хранит свои ChartRenderer'ы в Map
                // или имеет метод для поиска по id
                // itemElement.updateLineData(graphId, lineId, newData); // <-- Вызов метода у GraphicsContainerElement
                itemElement.updateLineData(graphId, lineId, newData);
                return; // Нашли и вызвали, выходим
            }
        }
        this.logger.warn(`updateLineData: График с id '${graphId}' не найден.`);
    }

    updateGraphTitleVisibility(graphId, isVisible) {
        let found = false;
        for (let [id, itemElement] of this.itemsMap) {
           if (itemElement instanceof GraphicsContainerElement) {
               itemElement.updateGraphTitleVisibility(graphId, isVisible);
               found = true;
               // break; // Убрано, чтобы обновить *все* GraphicsContainerElement'ы с графиком graphId
           }
       }
       if (!found) {
            this.logger.warn(`updateGraphTitleVisibility: График с id '${graphId}' не найден ни в одном GraphicsContainerElement.`);
       }
   }

   //Управление линиями графика ---
    updateLineData(graphId, lineId, newData) {
        // Найдём GraphicsContainerElement, содержащий график
        for (let [id, itemElement] of this.itemsMap) {
            if (itemElement instanceof GraphicsContainerElement) {
                itemElement.updateLineData(graphId, lineId, newData);
                // break; // Если графики уникальны, можно прервать
            }
        }
    }

    updateFormulaParams(graphId, formulaId, newParams) {
        for (let [id, itemElement] of this.itemsMap) {
            if (itemElement instanceof GraphicsContainerElement) {
                itemElement.updateFormulaParams(graphId, formulaId, newParams);
                // break;
            }
        }
    }

    updateLineVisibility(graphId, lineId, isVisible) {
        for (let [id, itemElement] of this.itemsMap) {
            if (itemElement instanceof GraphicsContainerElement) {
                itemElement.updateLineVisibility(graphId, lineId, isVisible);
                // break;
            }
        }
    }

    /**
     * Управляет видимостью левой колонки (вкладки) и flex-свойствами обеих колонок.
     * @param {boolean} isVisible - true для отображения, false для скрытия.
     */
    setControllerTabsVisibility(isVisible) {
        if (this.rootElement) {
            const leftColumnElement = this.rootElement.querySelector('.left-column');
            const rightColumnElement = this.rootElement.querySelector('.right-column');
            const mainContainerElement = this.rootElement.querySelector('.main-container'); // Нужен для управления flex
            
            if (leftColumnElement) {
                if (isVisible) {
                    leftColumnElement.style.display = ''; // Показываем
                    leftColumnElement.style.flex = '1'; // Возвращаем flex: 1
                   
                } else {
                    leftColumnElement.style.display = 'none'; // Скрываем
                    console.log
                    // leftColumnElement.style.flex = '0 0 0'; // Убираем из flex расчётов, но display: none важнее
                }
                
            }

            // Управляем flex свойством правой колонки в зависимости от состояния левой
            if (rightColumnElement) {
                 if (isVisible) { // Если левые вкладки видны
                     rightColumnElement.style.flex = '1'; // Правая занимает оставшееся пространство (обычно 60%)
                 } else { // Если левые вкладки скрыты
                     rightColumnElement.style.flex = '1 1 100%'; // Правая занимает всё доступное пространство
                 }
            }
            

             // Также можно управлять flex для mainContainer, но обычно достаточно дочерних элементов
             // if (mainContainerElement) {
             //     // Логика для mainContainer при необходимости
             // }

        } else {
            this.logger.warn(`rootElement не существует при попытке изменить видимость вкладок.`);
        }
    }

    /**
     * Управляет видимостью правой колонки (график) и flex-свойствами обеих колонок.
     * @param {boolean} isVisible - true для отображения, false для скрытия.
     */
    setControllerGraphVisibility(isVisible) {
        if (this.rootElement) {
            const leftColumnElement = this.rootElement.querySelector('.left-column');
            const rightColumnElement = this.rootElement.querySelector('.right-column');

            if (rightColumnElement) {
                if (isVisible) {
                    rightColumnElement.style.display = '';
                    rightColumnElement.style.flex = '1';
                } else {
                    rightColumnElement.style.display = 'none';
                    // rightColumnElement.style.flex = '0 0 0';
                }
            }

            // Управляем flex свойством левой колонки в зависимости от состояния правой
             if (leftColumnElement) {
                 if (isVisible) { // Если график виден
                     leftColumnElement.style.flex = '1'; // Левая занимает оставшееся пространство (обычно 40%)
                 } else { // Если график скрыт
                     leftColumnElement.style.flex = '1 1 100%'; // Левая занимает всё доступное пространство
                 }
             }
        } else {
            this.logger.warn(`rootElement не существует при попытке изменить видимость графика.`);
        }
    }


    /**
     * Показывает первую видимую вкладку после генерации.
     */
    _showFirstTab() {
        if (this.tabs.length > 0) {
            const firstVisibleTab = this.tabs.find(tab => tab.visibility);
            if (firstVisibleTab) {
                // Находим DOM-элементы кнопки и содержимого первой видимой вкладки
                const buttonId = `tab-btn-${this.controllerName}-${firstVisibleTab.id}`;
                const contentId = `tab-${this.controllerName}-${firstVisibleTab.id}`;
                const buttonElement = document.getElementById(buttonId);
                const contentElement = document.getElementById(contentId);

                if (buttonElement && contentElement) {
                    buttonElement.classList.add('active');
                    contentElement.classList.add('active');
                }
            }
        }
    }

    /**
     * Устанавливает обработчики кликов для кнопок вкладок.
     */
    //Поиск вкладок для переключения ---
    _setupTabSwitching() {
        // Ищем все возможные контейнеры вкладок внутри mainContainer
        const tabsContainers = this.rootElement.querySelectorAll('.tabs-container-wrapper');
        tabsContainers.forEach(container => {
            const tabsListElement = container.querySelector('.tabs-list');
            const tabsContentElement = container.querySelector('.tabs-content');

            if (tabsListElement && tabsContentElement) {
                const tabButtons = tabsListElement.querySelectorAll('button');
                const tabContents = tabsContentElement.querySelectorAll('.tab-content');

                tabButtons.forEach((button, index) => {
                    button.addEventListener('click', () => {
                        tabButtons.forEach(btn => btn.classList.remove('active'));
                        tabContents.forEach(content => content.classList.remove('active'));

                        button.classList.add('active');
                        const tabId = button.dataset.tabId;
                        const correspondingContent = container.querySelector(`#tab-${this.controllerName}-${tabId}`);
                        if (correspondingContent) {
                            correspondingContent.classList.add('active');
                        }
                    });
                });

                // Показываем первую вкладку по умолчанию
                if (tabButtons.length > 0 && tabContents.length > 0) {
                    tabButtons[0].classList.add('active');
                    tabContents[0].classList.add('active');
                }
            }
        });
    }


    destroyUI() {
        this.logger.info(`Уничтожение UI для контроллера ${this.controllerName}`);
        if (this.rootElement && this.rootElement.parentNode) {
            // Уничтожаем элементы items через itemsMap
            this.itemsMap.forEach(item => item.destroy());
            this.itemsMap.clear(); // Очищаем карту

            // Удаляем корневой элемент
            this.rootElement.parentNode.removeChild(this.rootElement);
            this.rootElement = null;
        }
        this.stateManager.clearElements();
    }

    updateParameter(paramId, value) {
        this.stateManager.updateElementValue(paramId, value);
    }

    // Обновление нескольких параметров ---
    updateMultipleParameters(paramsObject) {
        this.stateManager.updateMultipleElementValues(paramsObject);
    }

    updateElementVisibility(elementId, isVisible) {
        this.eventManager.publish('ELEMENT_VISIBILITY_CHANGED', { elementId, isVisible });
    }

    applySchemaVisibility(newSchema) {
        this.stateManager.applySchemaVisibility(newSchema);
    }

    getParameterValue(paramId) {
        return this.stateManager.getParameterValue(paramId);
    }

    getStateManager() {
        return this.stateManager;
    }

    getEventManager() {
        return this.eventManager;
    }

    
}