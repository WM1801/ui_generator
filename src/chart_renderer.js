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

        // --- Флаг и ID для requestAnimationFrame ---
        this.needsUpdate = false;
        this.updateRequestId = null;
        // ---

        this.frontendProps = graphicSchema.frontend_props || {};
        this.xAxisLabel = this.frontendProps.x_axis_label || 'X';
        this.yAxisLabel = this.frontendProps.y_axis_label || 'Y';
        this.xRange = this.frontendProps.x_range || { min: -360, max: 360 };

        this.yRangeSpec = this.frontendProps.y_range; // Сохраняем исходное значение
        this.linesDefinition = this.frontendProps.lines || [];

        this.lineData = new Map();
        this.practicalDataBuffers = new Map(); // id -> Map (rounded_x -> y_value)
        this.config = this._getDefaultConfig();
        this._initializeLines();
    }


    _getDefaultConfig() {
        let yMin, yMax;
        if (this.yRangeSpec && typeof this.yRangeSpec === 'object' && this.yRangeSpec.min !== undefined && this.yRangeSpec.max !== undefined) {
            yMin = this.yRangeSpec.min;
            yMax = this.yRangeSpec.max;
        } else if (this.yRangeSpec === 'auto' || this.yRangeSpec === null || this.yRangeSpec === undefined) {
            yMin = undefined;
            yMax = undefined;
        } else {
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
            const { id, visible, type, params, formula, x_range, style, frontend_props } = lineDef;

            const lineInfo = {
                type,
                visible: visible !== false,
                params: params || {},
                formula: formula || '',
                x_range: x_range || this.xRange,
                style: style || {},
                // --- Сохраняем frontend_props и вычисляем roundPrecision ---
                frontendProps: frontend_props || {},
                roundPrecision: (frontend_props && frontend_props.round_precision !== undefined) ? frontend_props.round_precision : 1, // По умолчанию 1 (Math.round)
                data: []
                // ---
            };
            console.log(`_initializeLines: Line ID: ${id}, Round Precision: ${lineInfo.roundPrecision}`);

            this.lineData.set(id, lineInfo);
            
            if (type === 'real_time_data') {
                this.practicalDataBuffers.set(id, new Map());
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
                    newData = [];
                    break;
                case 'user_formula':
                    const { formula, params, x_range } = lineInfo;
                    const min_x = x_range.min;
                    const max_x = x_range.max;
                    newData = this._calculateFormulaData(formula, params, min_x, max_x);
                    break;
                case 'real_time_data':
                    // --- ИСПРАВЛЕНО: practicalDataBuffers (множественное число) ---
                    // newData = this.practicalDataBuffer.get(id) || []; // Было
                    const bufferMap = this.practicalDataBuffers.get(id);
                    if (bufferMap) {
                        // Преобразуем Map (rounded_x -> y_value) в массив точек [{x: x, y: y_value}]
                        newData = Array.from(bufferMap.entries()).map(([rounded_x, y_val]) => ({ x: rounded_x, y: y_val })).sort((a, b) => a.x - b.x);
                    } else {
                        newData = [];
                    }
                    // ---
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

    // ---  Обновление datasets Chart.js ---
    _updateChartDatasets() {
        console.log('_updateChartDatasets called. Current needsUpdate:', this.needsUpdate, 'Current updateRequestId:', this.updateRequestId);
        this.needsUpdate = true;

        if (!this.updateRequestId) {
            console.log('_updateChartDatasets: Scheduling _performChartUpdate via requestAnimationFrame');
            this.updateRequestId = requestAnimationFrame(() => {
                console.log('_updateChartDatasets: requestAnimationFrame callback executing');
                this._performChartUpdate();
            });
        } else {
             console.log('_updateChartDatasets: requestAnimationFrame already scheduled.');
        }
    }

        
    // ---  Фактическое обновление Chart.js ---
    _performChartUpdate() {
        console.log('_performChartUpdate() called. needsUpdate was:', this.needsUpdate);
        // Сбрасываем флаг и ID
        this.needsUpdate = false;
        this.updateRequestId = null;

        console.log('_performChartUpdate: Processing datasets...');
        const datasets = [];
        for (let [id, lineInfo] of this.lineData) {
            if (!lineInfo.visible) continue;

            if (lineInfo.type === 'x_constant') {
                // Вертикальные линии не добавляются в datasets
                continue;
            }

            console.log('_performChartUpdate: Adding dataset for line id:', id, 'with data length:', lineInfo.data.length);
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
            console.log('_performChartUpdate: Updating Chart.js instance datasets. New dataset count:', datasets.length);
            try {
                this.chartInstance.data.datasets = datasets;
                this.chartInstance.update('none');
                console.log('_performChartUpdate: Chart.js instance updated successfully.');
            } catch (error) {
                 console.error('_performChartUpdate: Error updating Chart.js instance:', error);
            }
        } else {
            console.log('_performChartUpdate: Setting datasets in config (chartInstance not yet created)');
            this.config.data.datasets = datasets;
        }
    }

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
        console.log(`updateLineData called for lineId: ${lineId}, newData:`, newData);
        const lineInfo = this.lineData.get(lineId);
        if (!lineInfo) {
            this.logger.warn(`Линия с id '${lineId}' не найдена для обновления данных.`);
            return;
        }

        if (lineInfo.type === 'real_time_data') {
            let bufferMap = this.practicalDataBuffers.get(lineId);
            if (!bufferMap) {
                bufferMap = new Map();
                this.practicalDataBuffers.set(lineId, bufferMap);
            }

            // --- НОВОЕ: Используем roundPrecision из lineInfo ---
            const precision = lineInfo.roundPrecision;
            const multiplier = 1 / precision; // Например, для 0.1 -> multiplier = 10
            // ---

            if (newData && typeof newData === 'object' && newData.x !== undefined && newData.y !== undefined) {
                // --- ИСПРАВЛЕНО: Округляем x с заданной точностью ---
                // const roundedX = Math.round(newData.x); // Было
                const roundedX = Math.round(newData.x * multiplier) / multiplier; // Стало
                // ---
                bufferMap.set(roundedX, newData.y);
                console.log(`updateLineData: Updated point (x_rounded=${roundedX}, y=${newData.y}) for line ${lineId}`);
            } else if (Array.isArray(newData)) {
                bufferMap.clear();
                newData.forEach(point => {
                    if (point && typeof point === 'object' && point.x !== undefined && point.y !== undefined) {
                        // --- ИСПРАВЛЕНО: Округляем x с заданной точностью ---
                        // const roundedX = Math.round(point.x); // Было
                        const roundedX = Math.round(point.x * multiplier) / multiplier; // Стало
                        // ---
                        bufferMap.set(roundedX, point.y);
                    }
                });
                console.log(`updateLineData: Replaced buffer for line ${lineId}, new points count: ${bufferMap.size}`);
            } else {
                this.logger.warn(`Неверный формат данных для updateLineData (real_time_data): ${JSON.stringify(newData)}`);
                return;
            }

            // Преобразуем Map в отсортированный массив
            lineInfo.data = Array.from(bufferMap.entries()).map(([x, y]) => ({ x: x, y: y })).sort((a, b) => a.x - b.x);
            console.log(`updateLineData: Updated lineInfo.data for ${lineId}, length: ${lineInfo.data.length}. First few:`, lineInfo.data.slice(0, 3));

            this._updateChartDatasets(); // Вызовет RAF

        } else if (lineInfo.type === 'user_formula') {
            this.logger.warn(`updateLineData вызван для формулы '${lineId}'. Используйте updateFormulaParams.`);
            return;
        } else {
            this.logger.warn(`updateLineData не применим к линии типа '${lineInfo.type}' (id: ${lineId}).`);
            return;
        }
    }

    updateLineData2(lineId, newData) {
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
        if (this.updateRequestId) {
            cancelAnimationFrame(this.updateRequestId);
            this.updateRequestId = null;
        }
        // ---
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