// chart_renderer.js
class ChartRenderer {
    constructor(graphicSchema, controllerName, logger = GlobalLogger) {
        this.id = graphicSchema.id;
        this.title = graphicSchema.title;
        this.controllerName = controllerName;
        this.logger = logger;
        this.domElement = null;
        this.canvasElement = null;
        this.chartInstance = null;
        this.resizeObserver = null;

        this.frontendProps = graphicSchema.frontend_props || {};
        this.xAxisLabel = this.frontendProps.x_axis_label || 'X';
        this.yAxisLabel = this.frontendProps.y_axis_label || 'Y';
        this.xRange = this.frontendProps.x_range || { min: -360, max: 360 };

        // ---  Чтение y_range из схемы (объект или строка "auto") ---
        this.yRangeSpec = this.frontendProps.y_range; // Сохраняем исходное значение
        this.linesDefinition = this.frontendProps.lines || [];

        this.lineData = new Map();
        this.practicalDataBuffer = new Map();
        this.config = this._getDefaultConfig();
        this._initializeLines();
    }

    _getDefaultConfig() {
        let yMin, yMax;
        if (this.yRangeSpec && typeof this.yRangeSpec === 'object' && this.yRangeSpec.min !== undefined && this.yRangeSpec.max !== undefined) {
            // Если y_range - объект с min и max, используем их
            yMin = this.yRangeSpec.min;
            yMax = this.yRangeSpec.max;
        } else if (this.yRangeSpec === 'auto' || this.yRangeSpec === null || this.yRangeSpec === undefined) {
            // Если y_range - "auto", null или undefined, используем авто-масштабирование
            yMin = undefined;
            yMax = undefined;
        } else {
            // Если формат y_range неожиданный, логируем предупреждение и используем auto
            this.logger.warn(`Неподдерживаемый формат y_range: ${JSON.stringify(this.yRangeSpec)}. Используется авто-масштабирование.`);
            yMin = undefined;
            yMax = undefined;
        }
        return {
            type: 'line',
            data: {
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        min: this.xRange.min,
                        max: this.xRange.max,
                        title: {
                            display: true,
                            text: this.xAxisLabel
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: this.yAxisLabel
                        },
                        // beginAtZero: false // Убрано
                        min: yMin, // Используем вычисленные значения
                        max: yMax  // Используем вычисленные значения
                    }
                },
                plugins: {
                    title: {
                        display: this.frontendProps.title !== false,
                        text: this.title
                    },
                    annotation: {
                        annotations: {}
                    }
                }
            }
        };
    }

    _initializeLines() {
        this.linesDefinition.forEach(lineDef => {
            const { id, visible, type, params, formula, x_range, style } = lineDef;
            this.lineData.set(id, {
                type,
                visible: visible !== false,
                params: params || {},
                formula: formula || '',
                x_range: x_range || this.xRange,
                style: style || {},
                data: []
            });

            if (type === 'real_time_data') {
                this.practicalDataBuffer.set(id, []);
            }
        });

        this._updateStaticLinesData();
        this._updateChartDatasets();   // Для user_formula, real_time_data

        if (this.chartInstance) {
             this._updateChartAnnotations();
        }
    }

    _updateStaticLinesData() {
        for (let [id, lineInfo] of this.lineData) {
            if (!lineInfo.visible) continue;

            let newData = [];
            switch (lineInfo.type) {
                case 'x_constant':
                    // Данные не нужны для вертикальной линии в datasets
                    newData = [];
                    break;
                case 'user_formula':
                    const { formula, params, x_range } = lineInfo;
                    const min_x = x_range.min;
                    const max_x = x_range.max;
                    newData = this._calculateFormulaData(formula, params, min_x, max_x);
                    break;
                case 'real_time_data':
                    newData = this.practicalDataBuffer.get(id) || [];
                    break;
                default:
                    this.logger.warn(`Неизвестный тип линии: ${lineInfo.type} для id: ${id}`);
            }
            lineInfo.data = newData;
        }
    }

    _calculateFormulaData(formulaString, params, min_x, max_x) {
        console.log(`_calculateFormulaData called for formula: "${formulaString}", params:`, params);
        const data = [];
        if (!formulaString) {
            this.logger.warn('Формула не задана.');
            return data;
        }

        if (typeof math === 'undefined') {
            this.logger.error('math.js не найдена. Формула не может быть вычислена.');
            return data;
        }

        try {
            const baseScope = { ...params };
            const step = 1;

            for (let x = min_x; x <= max_x; x += step) {
                const scope = { ...baseScope, x: x };
                const y = math.evaluate(formulaString, scope);
                data.push({ x: x, y: y });
            }
            console.log(`_calculateFormulaData: calculated ${data.length} points for formula "${formulaString}". First few:`, data.slice(0, 3));
        } catch (error) {
            this.logger.error(`Ошибка при вычислении формулы "${formulaString}":`, error.message);
            for (let x = min_x; x <= max_x; x += 1) {
                data.push({ x: x, y: 0 });
            }
        }
        return data;
    }

    // --- НОВЫЙ МЕТОД: Обновление datasets Chart.js ---
    _updateChartDatasets() {
        console.log('_updateChartDatasets called');
        const datasets = [];
        for (let [id, lineInfo] of this.lineData) {
            if (!lineInfo.visible) continue;

            if (lineInfo.type === 'x_constant') {
                // Вертикальные линии не добавляются в datasets
                continue;
            }

            console.log(`_updateChartDatasets: Adding dataset for line id: ${id}, type: ${lineInfo.type}`);
            const dataset = {
                label: lineInfo.style.label || id,
                data: lineInfo.data,
                borderColor: lineInfo.style.borderColor,
                backgroundColor: lineInfo.style.backgroundColor,
                borderWidth: lineInfo.style.borderWidth,
                borderDash: lineInfo.style.borderDash,
                pointRadius: lineInfo.style.pointRadius,
                fill: lineInfo.style.fill,
                order: lineInfo.style.order,
            };
            datasets.push(dataset);
        }
        if (this.chartInstance) {
            console.log('_updateChartDatasets: Updating Chart.js instance datasets');
            this.chartInstance.data.datasets = datasets;
            this.chartInstance.update();
        } else {
            console.log('_updateChartDatasets: Setting datasets in config');
            this.config.data.datasets = datasets;
        }
    }
    // ---

    // --- НОВЫЙ МЕТОД: Обновление аннотаций (вертикальные линии) ---
    _updateChartAnnotations() {
        console.log('_updateChartAnnotations called');
        const annotations = {};
        let annotationIndex = 0;
        for (let [id, lineInfo] of this.lineData) {
            if (!lineInfo.visible) continue;

            if (lineInfo.type === 'x_constant') {
                console.log(`_updateChartAnnotations: Creating annotation for vertical line id: ${id}, x = ${lineInfo.params.a}`);
                annotations[`annotation_${annotationIndex++}`] = {
                    type: 'line',
                    mode: 'vertical',
                    scaleID: 'x',
                    value: lineInfo.params.a,
                    borderColor: lineInfo.style.borderColor || 'rgba(0, 0, 0, 0.5)',
                    borderWidth: lineInfo.style.borderWidth || 1,
                    borderDash: lineInfo.style.borderDash || [6, 6],
                    label: {
                        display: !!lineInfo.style.label,
                        content: lineInfo.style.label || id,
                        position: 'start'
                    }
                };
            }
        }

        console.log('_updateChartAnnotations: Annotations object prepared:', annotations);

        if (this.chartInstance) {
            console.log('_updateChartAnnotations: Updating Chart.js instance annotation options');
            this.chartInstance.options.plugins.annotation.annotations = annotations;
            this.chartInstance.update();
        } else {
            console.log('_updateChartAnnotations: Setting annotations in config');
            this.config.options.plugins.annotation.annotations = annotations;
        }
    }
    // ---

    render() {
        const containerDiv = document.createElement('div');
        containerDiv.className = 'chart-container';
        containerDiv.id = `chart-container-${this.controllerName}-${this.id}`;
        this.domElement = containerDiv;

        this.canvasElement = document.createElement('canvas');
        this.canvasElement.id = `chart-canvas-${this.controllerName}-${this.id}`;
        containerDiv.appendChild(this.canvasElement);

        if (typeof Chart !== 'undefined') {
            this.chartInstance = new Chart(this.canvasElement, this.config);
            this.logger.info(`Chart.js экземпляр создан для графика ${this.id}`);

            this._updateChartAnnotations(); // Теперь chartInstance существует, вызываем обновление аннотаций

            this._setupResizeObserver();
        } else {
            this.logger.warn('Chart.js не найден.');
        }

        return containerDiv;
    }

    _setupResizeObserver() {
        if (typeof ResizeObserver !== 'undefined' && this.domElement && this.chartInstance) {
            this.resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    if (this.chartInstance) {
                        this.chartInstance.resize();
                    }
                }
            });
            this.resizeObserver.observe(this.domElement);
        } else {
            this.logger.warn('ResizeObserver не поддерживается или chartInstance не создан.');
        }
    }

    updateLineData(lineId, newData) {
        const lineInfo = this.lineData.get(lineId);
        if (!lineInfo) {
            this.logger.warn(`Линия с id '${lineId}' не найдена для обновления данных.`);
            return;
        }

        if (lineInfo.type === 'real_time_data') {
            const buffer = this.practicalDataBuffer.get(lineId) || [];
            if (newData && typeof newData === 'object' && newData.x !== undefined && newData.y !== undefined) {
                buffer.push(newData);
                this.practicalDataBuffer.set(lineId, buffer);
            } else if (Array.isArray(newData)) {
                this.practicalDataBuffer.set(lineId, newData);
            }
            lineInfo.data = this.practicalDataBuffer.get(lineId) || [];
        } else if (lineInfo.type === 'user_formula') {
            this.logger.warn(`updateLineData вызван для формулы '${lineId}'. Используйте updateFormulaParams.`);
            return;
        } else {
            this.logger.warn(`updateLineData не применим к линии типа '${lineInfo.type}' (id: ${lineId}).`);
            return;
        }

        this._updateChartDatasets();
    }

    updateFormulaParams(formulaId, newParams) {
         const lineInfo = this.lineData.get(formulaId);
         if (!lineInfo || lineInfo.type !== 'user_formula') {
            this.logger.warn(`Формула с id '${formulaId}' не найдена или не является user_formula.`);
            return;
         }

         lineInfo.params = { ...lineInfo.params, ...newParams };
         lineInfo.data = this._calculateFormulaData(lineInfo.formula, lineInfo.params, lineInfo.x_range.min, lineInfo.x_range.max);

         this._updateChartDatasets();
    }

    updateLineVisibility(lineId, isVisible) {
        const lineInfo = this.lineData.get(lineId);
        if (!lineInfo) {
            this.logger.warn(`Линия с id '${lineId}' не найдена для обновления видимости.`);
            return;
        }
        lineInfo.visible = isVisible;
        this._updateStaticLinesData();
        this._updateChartDatasets();
        this._updateChartAnnotations(); // Обновим аннотации
    }

    updateTitleVisibility(isVisible) {
        if (this.chartInstance) {
             this.chartInstance.options.plugins.title.display = isVisible;
             this.chartInstance.update();
        }
    }

    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
        this.domElement = null;
        this.canvasElement = null;
    }
}