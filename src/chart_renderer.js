// chart_renderer.js
// chart_renderer.js
class ChartRenderer {
    constructor(graphicSchema, controllerName, logger = GlobalLogger) {
        this.id = graphicSchema.id;
        this.title = graphicSchema.title;
        this.visibilityTitle = graphicSchema.visibility_title !== false; // По умолчанию true
        this.controllerName = controllerName;
        this.logger = logger;
        this.domElement = null; // Корневой элемент графика (div или canvas)
        this.canvasElement = null; // Сам canvas
        this.chartInstance = null; // Экземпляр Chart.js (если используется)
        this.config = this._getDefaultConfig(); // Базовая конфигурация
        // Применяем frontend_props из graphicSchema, если они есть
        if (graphicSchema.frontend_props) {
            this._applyFrontendProps(graphicSchema.frontend_props);
        }
    }

    /**
     * Применяет свойства из frontend_props к конфигурации.
     * @param {Object} frontendProps - Объект frontend_props из схемы.
     * @private
     */
    _applyFrontendProps(frontendProps) {
        // Пример: обновление типа графика, цветов, меток и т.д.
        if (frontendProps.type) {
            this.config.type = frontendProps.type;
        }
        if (frontendProps.options) {
            // Глубокое объединение или простое присваивание, в зависимости от нужд
            this.config.options = { ...this.config.options, ...frontendProps.options };
        }
        if (frontendProps.data && frontendProps.data.datasets) {
            // Обновление наборов данных
            this.config.data.datasets = frontendProps.data.datasets;
        }
        // ... другие свойства ...
    }

    /**
     * Возвращает базовую конфигурацию для Chart.js.
     * @private
     * @returns {Object}
     */
    _getDefaultConfig() {
        return {
            type: 'line', // Тип по умолчанию
            data: {
                labels: [],
                datasets: [{
                    label: `Dataset for ${this.id}`,
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                },
                plugins: {
                    title: {
                        display: this.visibilityTitle, // Используем visibility_title для заголовка Chart.js
                        text: this.title
                    }
                }
            }
        };
    }

    /**
     * Рендерит DOM-элементы графика.
     * @returns {HTMLElement} - Корневой элемент графика.
     */
    render() {
        const containerDiv = document.createElement('div');
        containerDiv.className = 'chart-container';
        containerDiv.id = `chart-container-${this.controllerName}-${this.id}`;
        this.domElement = containerDiv;

        // Заголовок графика (если нужен)
        if (this.title && this.visibilityTitle) {
            const titleH2 = document.createElement('h2');
            titleH2.textContent = this.title;
            titleH2.id = `chart-title-${this.controllerName}-${this.id}`;
            containerDiv.appendChild(titleH2);
        }

        // Canvas для графика
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.id = `chart-canvas-${this.controllerName}-${this.id}`;
        containerDiv.appendChild(this.canvasElement);

        // Инициализация Chart.js (предполагается, что Chart.js подключен)
        // if (typeof Chart !== 'undefined') {
        //     this.chartInstance = new Chart(this.canvasElement, this.config);
        // } else {
        //     this.logger.warn('Chart.js не найден. График не будет отрисован с Chart.js.');
        //     // Можно реализовать отрисовку на чистом canvas
        // }

        return containerDiv;
    }

    /**
     * Обновляет данные графика.
     * @param {Array} labels - Метки по оси X.
     * @param {Array} data - Массив значений.
     */
    updateData(labels, data) {
        if (this.chartInstance) {
            // Обновление данных Chart.js
            this.chartInstance.data.labels = labels;
            this.chartInstance.data.datasets[0].data = data;
            this.chartInstance.update();
        } else {
            // Обновление данных для кастомной отрисовки на canvas
            // this.redrawCanvas(labels, data);
        }
    }

    /**
     * Обновляет видимость заголовка графика.
     * @param {boolean} isVisible - Видимость заголовка.
     */
    updateTitleVisibility(isVisible) {
        this.visibilityTitle = isVisible;
        if (this.chartInstance) {
            // Обновление опций Chart.js
            this.chartInstance.options.plugins.title.display = isVisible;
            this.chartInstance.options.plugins.title.text = isVisible ? this.title : '';
            this.chartInstance.update();
        } else {
            // Обновление DOM для заголовка
            const titleElement = this.domElement.querySelector('h2');
            if (titleElement) {
                titleElement.style.display = isVisible ? '' : 'none';
            }
        }
    }

    /**
     * Уничтожает ресурсы графика (например, уничтожает экземпляр Chart.js).
     */
    destroy() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
        // Удаление DOM-элемента из родителя можно сделать снаружи, в UIGenerator
        this.domElement = null;
        this.canvasElement = null;
    }
}