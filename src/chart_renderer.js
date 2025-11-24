// chart_renderer.js
class ChartRenderer {
    constructor(graphicSchema, controllerName, logger = GlobalLogger) {
        this.id = graphicSchema.id;
        this.title = graphicSchema.title;
        // Убираем this.visibilityTitle, управляем через Chart.js
        // this.visibilityTitle = graphicSchema.visibility_title !== false;
        this.controllerName = controllerName;
        this.logger = logger;
        this.domElement = null;
        this.canvasElement = null;
        this.chartInstance = null;
        this.config = this._getDefaultConfig();
        // Применяем frontend_props
        if (graphicSchema.frontend_props) {
            this._applyFrontendProps(graphicSchema.frontend_props);
        }
        // Устанавливаем начальное состояние заголовка из схемы
        this.config.options.plugins.title.display = graphicSchema.visibility_title !== false;
        this.config.options.plugins.title.text = this.title;
        //ResizeObserver ---
        this.resizeObserver = null;
    }

    _applyFrontendProps(frontendProps) {
        if (frontendProps.type) {
            this.config.type = frontendProps.type;
        }
        if (frontendProps.options) {
            // Глубокое объединение предпочтительно
            this.config.options = { ...this.config.options, ...frontendProps.options };
        }
        if (frontendProps.data && frontendProps.data.datasets) {
            this.config.data.datasets = frontendProps.data.datasets;
        }
    }

    _getDefaultConfig() {
        return {
            type: 'line',
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
                        display: true, // По умолчанию включено, перезапишется в конструкторе
                        text: ''       // По умолчанию пусто, перезапишется в конструкторе
                    }
                }
            }
        };
    }

    render() {
        const containerDiv = document.createElement('div');
        containerDiv.className = 'chart-container';
        containerDiv.id = `chart-container-${this.controllerName}-${this.id}`;
        this.domElement = containerDiv;

        // Canvas для графика
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.id = `chart-canvas-${this.controllerName}-${this.id}`;
        containerDiv.appendChild(this.canvasElement);

        if (typeof Chart !== 'undefined') {
            this.chartInstance = new Chart(this.canvasElement, this.config);
            this.logger.info(`Chart.js экземпляр создан для графика ${this.id}`);
            this._setupResizeObserver();
        } else {
            this.logger.warn('Chart.js не найден. График не будет отрисован с Chart.js.');
        }

        return containerDiv;
    }

    // --- Настройка ResizeObserver ---
    _setupResizeObserver() {
        if (typeof ResizeObserver !== 'undefined' && this.domElement && this.chartInstance) {
            this.resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    // entry.target - это domElement (chart-container)
                    // entry.contentRect - его новые размеры
                    // console.log('ResizeObserver: chart-container размеры изменились', entry.contentRect);
                    // Вызываем resize у Chart.js
                    if (this.chartInstance) {
                        // console.log('ResizeObserver: вызов chartInstance.resize() для', this.id);
                        this.chartInstance.resize();
                    }
                }
            });
            this.resizeObserver.observe(this.domElement); // Наблюдаем за chart-container
        } else {
            this.logger.warn('ResizeObserver не поддерживается или chartInstance не создан.');
        }
    }

    updateData(labels, data) {
        if (this.chartInstance) {
            this.chartInstance.data.labels = labels;
            if (this.chartInstance.data.datasets && this.chartInstance.data.datasets[0]) {
                this.chartInstance.data.datasets[0].data = data;
            }
            this.chartInstance.update();
        }
    }

    updateTitleVisibility(isVisible) {
        // Обновляем опции Chart.js
        if (this.chartInstance) {
             this.chartInstance.options.plugins.title.display = isVisible;
             // Текст можно оставить как есть или обновить, если нужно
             // this.chartInstance.options.plugins.title.text = isVisible ? this.title : '';
             this.chartInstance.update();
        }
        // Больше не нужно обновлять DOM, так как h2 не создаётся
    }

    destroy() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
        this.domElement = null;
        this.canvasElement = null;
    }
}