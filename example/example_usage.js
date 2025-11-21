// Пример использования

const exampleSchema = {
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
            "graphics": [
                {
                "id": "graph",
                "title": "Main Graph",
                "visibility_title": true
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
    const data = [10, 20, 30, 40, 50, 60, 70, 80 , 90, 100];
    generator.updateGraphData('graph', labels, data); // 'graph' - это id из схемы
}, 3000);

