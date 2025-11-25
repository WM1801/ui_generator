// Пример использования

const exampleSchema = {
    "schema_version": "1.0.0",
    "controller": { 
        "name": "motor1", 
        "display_name": "Motor Controller 1",
        "layout": "row", // "row"/"column"
        "visibility_head": true,  
    
        "items": [ // <-- Единый массив элементов UI
    
            {
                "type": "tabs", // Указывает, что это блок вкладок
                "id": "tabs_main",
                "visibility": true,
                "width": "50%", // auto
                "tabs": //существующие вкладки
                [
                {
                    "id": "main",
                    "title": "Main Settings",
                    "visibility": true,
                    "groups": [
                        {
                            "id": "config",
                            "title": "Configuration",
                            "items": [
                                {
                                    "type": "parameter",
                                    "param_id": "speed",
                                    "display_name": "Speed",
                                    "frontend_type": "number",
                                    "units": "RPM",
                                    "frontend_props": { "min": 0, "max": 3000, "step": 100, "default": 1500 }
                                },
                                {
                                    "type": "parameter",
                                    "param_id": "position",
                                    "display_name": "Position",
                                    "frontend_type": "readonly",
                                    "units": "steps", 
                                    "frontend_props": { "default": 500 }
                                },
                                {
                                    "type": "parameter",
                                    "param_id": "status_flags",
                                    "display_name": "Status Flags",
                                    "frontend_type": "flags",
                                    "frontend_props": {
                                        "bits": {
                                            "0-ready": "Ready",
                                            "1-running": "Running",
                                            "2-error": "Error"
                                        }, 
                                        "default": 2 

                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": "actions",
                    "title": "Actions",
                    "visibility": true,
                    "groups": [
                        {
                            "id": "buttons",
                            "title": "Control",
                            "items": [
                                {
                                    "type": "command",
                                    "command_id": "START",
                                    "display_name": "Start Motor",
                                    "frontend_props": {
                                        "style": "base",
                                        "style_clicked": "clicked", // стиль для нажатия
                                        "display_name_clicked": "Starting...", // текст для нажатия
                                        "auto_reset": false,             //Автоматически сбросить стиль/текст
                                        "click_duration": 500,         //  Время сброса в мс (если auto_reset true)
                                        "tooltip": "Starts the motor. Hold to start slowly.", // <-- Новое свойство
                                        "behavior": "button"       // поведение (button/toggle)
                                    }
                                },
                                {
                                    "type": "command",
                                    "command_id": "STOP",
                                    "display_name": "Stop Motor", 
                                    frontend_props: {
                                        "style_clicked": "clicked", // стиль для нажатия
                                    }
                                },
                                {
                                    "type": "command",
                                    "command_id": "BUTTON_ON_OFF_TOGGLE",
                                    "display_name": "OFF", 
                                    frontend_props: {
                                        "style_clicked": "clicked", // стиль для нажатия
                                        "display_name_active": "ON   ", // <-- Текст в активном состоянии
                                        "style" : "base", // <-- Стиль для неактивного состояния
                                        "style_active" : "success", // <-- Стиль для активного состояния
                                        "behavior": "toggle"
                                    }
                                },
                                {
                                    "type": "command",
                                    "command_id": "TOGGLE_LIGHT",
                                    "display_name": "Turn On Light",  // <-- Текст в неактивном состоянии
                                    "frontend_props": {
                                        "style": "primary",      // <-- Стиль для неактивного состояния
                                        "style_active": "success",   // <-- Стиль для активного состояния
                                        "display_name_active": "Turn Off Light", // <-- Текст в активном состоянии
                                        "style_clicked": "clicked",      // <-- Стиль для нажатия даже у toggle
                                        "display_name_clicked": "Toggling...", // <-- Текст для нажатия у toggle
                                        "auto_reset": true,              // <-- Автоматически сбросить при нажатии
                                        "click_duration": 300,           // <-- Время сброса в мс
                                        "behavior": "toggle"             // <-- Поведение
                                    }
                                },
                                {
                                    "type": "command",
                                    "command_id": "REBOOT",
                                    "display_name": "Reboot Controller",
                                    "frontend_props": {
                                        "style": "primary",          // CSS-класс для неактивного состояния
                                        "style_active": "danger",    // CSS-класс для активного состояния (на случай, если она станет toggle)
                                        "display_name_active": "Rebooting...", // Текст в активном состоянии (на случай, если станет toggle)
                                        "behavior": "toggle",         // toggle-кнопка
                                        "tooltip": "press me"       // <-- подсказка
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": "sliders",
                    "title": "Параметры",
                    "visibility": true,
                    "groups": [
                        {
                            "id": "sliders_group",
                            "title": "Управление",
                            "items": [
                                {
                                    "type": "parameter",
                                    "param_id": "volume",
                                    "display_name": "Volume",
                                    "frontend_type": "slider",
                                    "units": "%",
                                    "frontend_props": {
                                        "min": 0,
                                        "max": 100,
                                        "step": 1,
                                        "default": 50,
                                        "style": "slider-style-class", // Применится к div.item
                                        "show_value_display": true
                                    }
                                },
                                {
                                    "type": "parameter",
                                    "param_id": "mode",
                                    "display_name": "Mode",
                                    "frontend_type": "select",
                                    "frontend_props": {
                                        "default": "auto",
                                        "style": "select-style-class", // Применится к div.item
                                        "options": [
                                            { "value": "auto", "label": "Automatic" },
                                            { "value": "manual", "label": "Manual" },
                                            { "value": "off", "label": "Off" }
                                        ]
                                    }
                                },
                                {
                                    "type": "parameter",
                                    "param_id": "color",
                                    "display_name": "Color",
                                    "frontend_type": "radio",
                                    "frontend_props": {
                                        "default": "blue",
                                        "style": "radio-style-class", // Применится к div.item
                                        "options": [
                                            { "value": "red", "label": "Red" },
                                            { "value": "green", "label": "Green" },
                                            { "value": "blue", "label": "Blue" }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }, 
        {
            "type": "graphics",
            "id": "graphics_main",
            "visibility": true,
            "width": "40%",
            "graphics": [
                {
                    "id": "graph",
                    "title": "Main Graph33",
                    "visibility_title": true,
                    "frontend_props": {
                        "type": "line",
                        "x_axis_label": "Position (degrees)", // Подпись оси X
                        "y_axis_label": "Parameter Value",   // Подпись оси Y
                        "x_range": { "min": -30, "max": 30 }, // Общий диапазон по X
                        "y_range": { "min": 0, "max": 100 }, // Фиксированный диапазон
                         //"y_range": "auto", // Автоматическое масштабирование (альтернатива)
        
                        // --- НОВОЕ: Определение линий ---
                        "lines": [
                            {
                                "id": "line_PLW",
                                "visible": true,
                                "type": "x_constant", // Вертикальная линия
                                "params": { "a": 20},
                                "frontend_props": { // <-- frontend_props для конкретной линии
                                    "round_precision": 0.1 // <-- НОВОЕ: Округлять X до 0.1 (одна десятая)
                                },
                                "style": { // Стили для Chart.js dataset
                                    "borderColor": "rgba(0, 0, 255, 0.7)",
                                    "borderWidth": 3,
                                    "borderDash": [5, 5],
                                    "pointRadius": 0,
                                    "fill": false
                                }
                            },
                            {
                                "id": "line_PLS",
                                "visible": true,
                                "type": "x_constant", // Вертикальная линия
                                "params": { "a": 22},
                                "frontend_props": { // <-- frontend_props для конкретной линии
                                    "round_precision": 0.1 // <-- НОВОЕ: Округлять X до 0.1 (одна десятая)
                                },
                                "style": { // Стили для Chart.js dataset
                                    "borderColor": "rgba(0, 0, 255, 0.7)",
                                    "borderWidth": 3,
                                    "borderDash": [5, 5],
                                    "pointRadius": 0,
                                    "fill": false
                                }
                            },
                            {
                                "id": "line_PLH",
                                "visible": true,
                                "type": "x_constant", // Вертикальная линия
                                "params": { "a": 24},
                                "frontend_props": { // <-- frontend_props для конкретной линии
                                    "round_precision": 0.1 // <-- НОВОЕ: Округлять X до 0.1 (одна десятая)
                                },
                                "style": { // Стили для Chart.js dataset
                                    "borderColor": "rgba(0, 0, 255, 0.7)",
                                    "borderWidth": 3,
                                    "borderDash": [5, 5],
                                    "pointRadius": 0,
                                    "fill": false
                                }
                            },
                            {
                                "id": "line_NLW",
                                "visible": true,
                                "type": "x_constant",
                                "params": { "a": -20 },
                                "frontend_props": { // <-- frontend_props для конкретной линии
                                    "round_precision": 0.1 // <-- НОВОЕ: Округлять X до 0.1 (одна десятая)
                                },
                                "style": {
                                    "borderColor": "rgba(0, 0, 255, 0.7)",
                                    "borderWidth": 3,
                                    "borderDash": [5, 5],
                                    "pointRadius": 0,
                                    "fill": false
                                }
                            },
                            {
                                "id": "line_NLS",
                                "visible": true,
                                "type": "x_constant",
                                "params": { "a": -22 },
                                "frontend_props": { // <-- frontend_props для конкретной линии
                                    "round_precision": 0.1 // <-- НОВОЕ: Округлять X до 0.1 (одна десятая)
                                },
                                "style": {
                                    "borderColor": "rgba(0, 0, 255, 0.7)",
                                    "borderWidth": 3,
                                    "borderDash": [5, 5],
                                    "pointRadius": 0,
                                    "fill": false
                                }
                            },
                            {
                                "id": "line_NLH",
                                "visible": true,
                                "type": "x_constant",
                                "params": { "a": -24 },
                                "frontend_props": { // <-- frontend_props для конкретной линии
                                    "round_precision": 0.1 // <-- НОВОЕ: Округлять X до 0.1 (одна десятая)
                                },
                                "style": {
                                    "borderColor": "rgba(0, 0, 255, 0.7)",
                                    "borderWidth": 3,
                                    "borderDash": [5, 5],
                                    "pointRadius": 0,
                                    "fill": false
                                }
                            },
                            
                            // ... другие вертикальные линии ...
                            {
                                "id": "teor",
                                "visible": true,
                                "type": "user_formula", // Пользовательская формула y = f(x)
                                "formula": "a*sin(x)/x", //"a * x * x + b * x + c", // //"x + a * b / c", // Выражение
                                "params": { "a": 10, "b": 0, "c": 10, "k": 1 },
                                "frontend_props": { // <-- frontend_props для конкретной линии
                                    "round_precision": 0.1 // <-- НОВОЕ: Округлять X до 0.1 (одна десятая)
                                },
                                "style": {
                                    "label": "Theoretical Curve",
                                    "borderColor": "rgba(255, 99, 132, 0.5)", // Светло-красный
                                    "backgroundColor": "rgba(255, 99, 132, 0.1)",
                                    "borderWidth": 2,
                                    "borderDash": [5, 5], // Пунктир
                                    "pointRadius": 0,
                                    "fill": false,
                                    "order": 0 // Порядок отрисовки (ниже)
                                }
                            },
                            {
                                "id": "prakt",
                                "visible": true,
                                "type": "real_time_data", // Практические данные
                                "params": {}, // Не используется для типа real_time_data
                                "frontend_props": { // <-- frontend_props для конкретной линии
                                    "round_precision": 0.1 // <-- НОВОЕ: Округлять X до 0.1 (одна десятая)
                                },
                                "style": {
                                    "label": "Practical Data",
                                    "borderColor": "rgb(75, 192, 192)",
                                    "backgroundColor": "rgba(75, 192, 192, 0.2)",
                                    "borderWidth": 2,
                                    "pointRadius": 3,
                                    "fill": false,
                                    "order": 1 // Порядок отрисовки (выше)
                                }
                            }
                        ]
                        // --- Конец определения линий ---
                    }
                }
            ]
        }
        ]
    }
};

const handlers = {
    onParameterChange: (paramId, value) => {
        console.log(`Handler: Parameter ${paramId} changed to ${value}`);
    },
    onCommand: (commandId) => {
        console.log(`Handler: Command ${commandId} executed`);
    }
};

// Создаем генератор
const generator = new UIGenerator(exampleSchema, handlers);

//Подписываемся на PARAMETER_VALUE_CHANGED ---
const eventManager = generator.getEventManager();


eventManager.subscribe('PARAMETER_VALUE_CHANGED', (data) => {
    console.log('Event received:', data); // Отладка
    if (data.controllerName === 'motor1' && data.paramId === 'volume') {
        const volumeValue = data.value;
        console.log(`Событие PARAMETER_VALUE_CHANGED: volume = ${volumeValue}`);

        // --- НОРМАЛИЗАЦИЯ И ОТПРАВКА НА ГРАФИК ---
        const xRange = exampleSchema.controller.items.find(item => item.id === 'graphics_main').graphics[0].frontend_props.x_range;
        const minX = xRange.min;
        const maxX = xRange.max;
        const sliderMin = 0;
        const sliderMax = 100;

        // Линейная нормализация: sliderValue -> xValue
        const xValue = ((volumeValue - sliderMin) / (sliderMax - sliderMin)) * (maxX - minX) + minX;

        // Вычисляем Y (например, синусоида)
        const yRange = exampleSchema.controller.items.find(item => item.id === 'graphics_main').graphics[0].frontend_props.y_range;
        const minY = yRange.min;
        const maxY = yRange.max;

        const amplitude = (maxY - minY) * 0.4;
        const baseY = minY + (maxY - minY) / 2;
        // Используем нормализованный xValue для вычисления y
        const yValue = baseY + amplitude * Math.sin(xValue * Math.PI / 30);

        console.log(`  -> Отправка точки на график: X_norm=${xValue.toFixed(2)}, Y=${yValue.toFixed(2)}`);

        // --- ИЗМЕНЕНО: Отправляем точку на график prakt ---
        // Теперь updateLineData обновит буфер prakt, и график отобразит актуальные данные
        generator.updateLineData('graph', 'prakt', {x: xValue, y: yValue});
        // ---
    }
});

eventManager.subscribe('COMMAND_CLICKED', (data) => { 
    console.log('Event: COMMAND_CLICKED', data); 
    // data: { commandId, controllerName } 
});

document.addEventListener('DOMContentLoaded', () => {
    const toggleHeaderCheckbox = document.getElementById('toggle-header');
    const toggleTabsCheckbox = document.getElementById('toggle-tabs');
    const toggleGraphCheckbox = document.getElementById('toggle-graph');

    // Инициализируем состояние чекбоксов в соответствии с начальным состоянием UI
    // (предполагаем, что изначально всё видимо)
    toggleHeaderCheckbox.checked = true; // или false, если заголовок изначально скрыт
    toggleTabsCheckbox.checked = true;   // или false, если вкладки изначально скрыты
    toggleGraphCheckbox.checked = true;  // или false, если график изначально скрыт

    // Добавляем обработчики событий
    toggleHeaderCheckbox.addEventListener('change', (e) => {
        generator.setControllerHeaderVisibility(e.target.checked);
    });

    toggleTabsCheckbox.addEventListener('change', (e) => {
        generator.updateItemVisibility("tabs_main", e.target.checked);
    });

    toggleGraphCheckbox.addEventListener('change', (e) => {
        generator.updateItemVisibility("graphics_main", e.target.checked);
    });
    
});

// Если бы был WebSocket сервер, можно было бы подключить DataConnector
// const dataConnector = new DataConnector(generator.getEventManager());
// dataConnector.connect('ws://localhost:8080/ws');
// generator.setDataConnector(dataConnector);

// Генерируем UI
generator.generateUI('app');

// Пример внешнего обновления параметра
setTimeout(() => {
    generator.updateParameter('position', 12345);
    generator.updateParameter('status_flags', 3); // 0b011 - ready и running
}, 2000);

// Пример обновления видимости
setTimeout(() => {
    //generator.updateElementVisibility('config', false);
    const currentValue = generator.getParameterValue('speed'); // Например, получит значение из NumberParameterElement
    console.log('Текущее значение speed:', currentValue);

    const flagValue = generator.getParameterValue('status_flags'); // Получит значение из FlagsParameterElement
    console.log('Текущее значение status_flags:', flagValue);

    const positionValue = generator.getParameterValue('position'); // Получит значение из ReadonlyParameterElement
    console.log('Текущее значение position:', positionValue);
}, 4000);


setTimeout(() => {
    console.log('Обновляем несколько параметров');
    const data = {
        "parameters": 
            {
                "speed": 300,
                "status_flags": 1,
                "position": 789,
            }
        
    }
    generator.updateMultipleParameters(data.parameters);
    const currentValue = generator.getParameterValue('speed'); // Например, получит значение из NumberParameterElement
    console.log('Текущее значение speed:', currentValue);

    const flagValue = generator.getParameterValue('status_flags'); // Получит значение из FlagsParameterElement
    console.log('Текущее значение status_flags:', flagValue);

    const positionValue = generator.getParameterValue('position'); // Получит значение из ReadonlyParameterElement
    console.log('Текущее значение position:', positionValue);
}, 10000);

setTimeout(() => {
    console.log('Обновляем данные графика');
    const labels = ['Point 1', 'Point 2', 'Point 3'];
    const data = [10, 20, 30];
    generator.updateGraphData('graph', labels, data); // 'graph' - это id из схемы
}, 3000);
/*
// Обновление параметров формулы
setTimeout(() => {
    console.log('Обновляем параметры формулы теоретической кривой');
    generator.updateFormulaParams('graph', 'teor', { a: 0.6, b: 12, c: 4 }); // id графика, id формулы, новые параметры
}, 15000);

// 

// Скрыть линию
setTimeout(() => {
    console.log('Скрываем теоретическую кривую');
    generator.updateLineVisibility('graph', 'teor', false);
}, 25000);

// Показать линию
setTimeout(() => {
    console.log('Показываем теоретическую кривую');
    generator.updateLineVisibility('graph', 'teor', true);
}, 30000);

*/
//Обновление данных реального времени
// устарел
/*setTimeout(() => {
    console.log('Добавляем точку к практическим данным');
    // generator.updateLineData('graph', 'prakt', {x: 45, y: 15}); // Добавить одну точку
    generator.updateLineData('graph', 'prakt', [
        {x: -15, y: 62},
        {x: -5, y: 12},
        {x: 5, y: 15},
        {x: 26, y: 45},
        {x: 29, y: 15}, 
       {x: -25, y: 15} ]); // Обновить весь буфер
}, 20000);*/

setTimeout(() => {
    console.log('Обновляем данные графика (устаревший вызов, перенаправленный на prakt)');
    const data = [
        {x: -15, y: 62},
        {x: -5, y: 12},
        {x: 5, y: 15},
        {x: 26, y: 45},
        {x: 29, y: 15},
        {x: -25, y: 15}
    ]; // Теперь формат данных соответствует real_time_data
    // generator.updateGraphData('graph', labels, data); // <-- УСТАРЕВШИЙ ВЫЗОВ
    generator.updateLineData('graph', 'prakt', data); // <-- НОВЫЙ ВЫЗОВ
}, 3000);


