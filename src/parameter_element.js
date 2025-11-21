// parameter_element.js
class ParameterElement extends UIElement {
    constructor(schema, controllerName, handlers, eventManager, logger = GlobalLogger) {
        super(schema, controllerName, handlers, eventManager, logger);
        this.units = schema.units;
        this.frontendProps = schema.frontend_props || {};
        this.defaultValue = this.frontendProps.default;
        this.styleClass = this.frontendProps.style || '';
    }

    _createCommonParts() {
        const container = document.createElement('div');
        container.className = 'item';

        //Применяем стиль к контейнеру элемента ---
        if (this.styleClass) {
            container.classList.add(this.styleClass);
        }

        const label = document.createElement('span');
        label.className = 'item-label';
        label.textContent = this.displayName;
        container.appendChild(label);

        const controlDiv = document.createElement('div');
        controlDiv.className = 'item-control';
        container.appendChild(controlDiv);

        if (this.units) {
            const unitsSpan = document.createElement('span');
            unitsSpan.className = 'item-units';
            unitsSpan.textContent = this.units;
            container.appendChild(unitsSpan);
        }

        return { container, controlDiv };
    }
}

class NumberParameterElement extends ParameterElement {
    constructor(schema, controllerName, handlers, eventManager, logger = GlobalLogger) {
        super(schema, controllerName, handlers, eventManager, logger);
        this.handleChange = this.handleChange.bind(this);
        this.currentValue = this.defaultValue !== undefined ? this.defaultValue : null;
    }

    render() {
        const { container, controlDiv } = this._createCommonParts();

        const input = document.createElement('input');
        input.type = 'number';
        input.id = `param-${this.controllerName}-${this.id}-input`;
        input.className = 'number-input';
        if (this.frontendProps.step !== undefined) input.step = this.frontendProps.step;
        if (this.frontendProps.min !== undefined) input.min = this.frontendProps.min;
        if (this.frontendProps.max !== undefined) input.max = this.frontendProps.max;

        //Устанавливаем значение по умолчанию (или currentValue) ПОСЛЕ создания input ---
        // Это гарантирует, что currentValue (установленное в конструкторе) будет отражено в input.value
        if (this.currentValue !== null && this.currentValue !== undefined) {
             input.value = this.currentValue;
        }

        this.addEventListener(input, 'change', this.handleChange);

        controlDiv.appendChild(input);
        this.domElement = container;
        return this.domElement;
    }

    handleChange(e) {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            // Обновляем внутреннее значение
            this.currentValue = value;
            this.eventManager.publish('PARAMETER_VALUE_CHANGED', {
                paramId: this.id,
                value: value,
                controllerName: this.controllerName
            });

            if (this.handlers && typeof this.handlers.onParameterChange === 'function') {
                this.handlers.onParameterChange(this.id, value);
            }
        } else {
            e.target.value = this.currentValue  || '';
        }
    }

    updateValue(value) {
        if (this.domElement && this.domElement.querySelector) {
            const input = this.domElement.querySelector('input.number-input');
            if (input && parseFloat(input.value) !== value) {
                 input.value = value;
                 this.currentValue = value;
            }
        }
    }

    getValue() {
        if (this.domElement && this.domElement.querySelector) {
            const input = this.domElement.querySelector('input.number-input');
            if (input) {
                const value = parseFloat(input.value);
                // Возвращаем значение из DOM, если оно валидно, иначе внутреннее
                return isNaN(value) ? this.currentValue : value;
            }
        }
        // Если DOM недоступен, возвращаем внутреннее значение
        return this.currentValue;
    }

    destroy() {
        super.destroy();
    }
}

class ReadonlyParameterElement extends ParameterElement {
    constructor(schema, controllerName, handlers, eventManager, logger = GlobalLogger) {
        super(schema, controllerName, handlers, eventManager, logger);
        // Добавим внутреннее значение для readonly
        this.currentValue = this.defaultValue !== undefined ? this.defaultValue : '---';
    }
    render() {
        const { container, controlDiv } = this._createCommonParts();
        const display = document.createElement('div');
        display.className = 'readonly-display';
        display.id = `param-${this.controllerName}-${this.id}-display`;
        display.textContent = this.currentValue;

        controlDiv.appendChild(display);
        this.domElement = container;
        return this.domElement;
    }
    updateValue(value) {
        if (this.domElement && this.domElement.querySelector) {
            const display = this.domElement.querySelector('.readonly-display');
            if (display) display.textContent = value;
            // Обновляем внутреннее значение при внешнем обновлении
            this.currentValue = value;
        }
    }

    getValue() {
        // Для readonly всегда возвращаем внутреннее значение
        return this.currentValue;
    }

    destroy() { super.destroy(); }
}

class FlagsParameterElement extends ParameterElement {
    constructor(schema, controllerName, handlers, eventManager, logger = GlobalLogger) {
        super(schema, controllerName, handlers, eventManager, logger);
        // Добавим внутреннее значение для флагов
        this.currentValue = this.defaultValue !== undefined ? this.defaultValue : 0;
    }
    render() {
        const { container, controlDiv } = this._createCommonParts();
        const flagsContainer = document.createElement('div');
        flagsContainer.className = 'flags-container';
        flagsContainer.id = `param-${this.controllerName}-${this.id}-flags-container`;
        controlDiv.appendChild(flagsContainer);
        this.domElement = container;

        if (this.frontendProps && this.frontendProps.bits) {
            const sortedBits = Object.entries(this.frontendProps.bits).sort(([a], [b]) => {
                const numA = parseInt(a.split('-')[0], 10);
                const numB = parseInt(b.split('-')[0], 10);
                if (isNaN(numA) || isNaN(numB)) {
                    this.logger.warn(`Невозможно распарсить бит из ключа: ${a} или ${b}`);
                    return 0;
                }
                return numB - numA;
            });

            sortedBits.forEach(([bitKey, description]) => {
                const flagItem = document.createElement('div');
                flagItem.className = 'flag-item';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `param-${this.controllerName}-${this.id}-flag-${bitKey}`;
                checkbox.dataset.bit = bitKey; // <-- Сохраняем ключ (например, "0-ready")

                const flagLabel = document.createElement('label');
                flagLabel.htmlFor = checkbox.id;
                flagLabel.textContent = `${bitKey}: ${description}`;

                flagItem.appendChild(checkbox);
                flagItem.appendChild(flagLabel);
                flagsContainer.appendChild(flagItem);

                //  Обработчик change ---
                this.addEventListener(checkbox, 'change', () => {
                    let newValue = 0;
                    const checkboxes = flagsContainer.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(cb => {
                        if (cb.checked) {
                            const fullBitKey = cb.dataset.bit; // Например, "0-ready"
                            const dashIndex = fullBitKey.indexOf('-');
                            if (dashIndex === -1) {
                                console.error(`Ошибка разбора dataset.bit при изменении: '${fullBitKey}' не содержит '-'`);
                                return; // Пропускаем этот чекбокс
                            }
                            const potentialBitNumStr = fullBitKey.substring(0, dashIndex);
                            const bitNum = parseInt(potentialBitNumStr, 10);
                            if (isNaN(bitNum) || bitNum < 0 || bitNum > 31) {
                                console.error(`Ошибка разбора бита при изменении: '${potentialBitNumStr}' из '${fullBitKey}' не является допустимым номером бита (0-31)`);
                                return; // Пропускаем этот чекбокс
                            }
                            newValue |= (1 << bitNum); // Устанавливаем бит
                        }
                    });
                    this.currentValue = newValue;
                    // Публикуем событие с новым значением
                    this.eventManager.publish('PARAMETER_VALUE_CHANGED', {
                        paramId: this.id,
                        value: newValue,
                        controllerName: this.controllerName
                    });
                    
                });
                // ---
            });
            //Применяем значение по умолчанию к чекбоксам после их создания ---
            // Вызываем updateValue с defaultValue, чтобы установить начальное состояние
            if (this.defaultValue !== undefined) {
                // Обновляем UI, чтобы отразить defaultValue
                this.updateValue(this.currentValue);
            }

        } else {
             console.log('FlagsParameterElement.render: frontendProps.bits НЕ найдены!');
        }
        return this.domElement;
    }

    updateValue(value) {
        if (this.domElement && this.domElement.querySelector) {
            const flagsContainer = this.domElement.querySelector('.flags-container');
            if (flagsContainer) {
                const checkboxes = flagsContainer.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    const fullBitKey = checkbox.dataset.bit; // Например, "0-ready-something"

                    // --- ИСПРАВЛЕНО: Разбор до первого '-' ---
                    const dashIndex = fullBitKey.indexOf('-');
                    if (dashIndex === -1) {
                        // Не найдено '-', это ошибка формата
                        console.error(`Ошибка разбора dataset.bit: '${fullBitKey}' не содержит '-'`);
                        return; // Пропускаем этот чекбокс
                    }

                    const potentialBitNumStr = fullBitKey.substring(0, dashIndex); // Берем часть до первого '-'

                    const bitNum = parseInt(potentialBitNumStr, 10);
                    if (isNaN(bitNum) || bitNum < 0 || bitNum > 31) {
                        // Не удалось распарсить или число вне диапазона
                        console.error(`Ошибка разбора бита: '${potentialBitNumStr}' из '${fullBitKey}' не является допустимым номером бита (0-31)`);
                        return; // Пропускаем этот чекбокс
                    }

                    const bitValue = (value >> bitNum) & 1;
                    checkbox.checked = !!bitValue;
                    
                });
                 // Обновляем внутреннее значение при внешнем обновлении
                 this.currentValue = value;
            }
        }
    }

    getValue() {
        // Для флагов возвращаем внутреннее значение
        // (которое обновляется как при внешнем updateValue, так и при изменении UI)
        return this.currentValue;
    }

    destroy() { super.destroy(); }
}

class SliderParameterElement extends ParameterElement {
    constructor(schema, controllerName, handlers, eventManager, logger = GlobalLogger) {
        super(schema, controllerName, handlers, eventManager, logger);
        // Используем defaultValue, если оно задано, иначе 0
        this.currentValue = this.defaultValue !== undefined ? this.defaultValue : 0;
        // Для слайдера часто полезно отображать текущее значение рядом
        this.showValueDisplay = this.frontendProps.show_value_display !== false; // По умолчанию true
    }

    render() {
        const { container, controlDiv } = this._createCommonParts();

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container'; // Дополнительный контейнер для стиля

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = `param-${this.controllerName}-${this.id}-slider`;
        slider.className = 'slider-input';
        // Устанавливаем min, max, step из frontendProps
        if (this.frontendProps.min !== undefined) slider.min = this.frontendProps.min;
        if (this.frontendProps.max !== undefined) slider.max = this.frontendProps.max;
        if (this.frontendProps.step !== undefined) slider.step = this.frontendProps.step;

        // Устанавливаем значение по умолчанию (или currentValue) ПОСЛЕ создания input
        slider.value = this.currentValue;

        // Создаем отображение значения
        let valueDisplay = null;
        if (this.showValueDisplay) {
            valueDisplay = document.createElement('span');
            valueDisplay.className = 'slider-value-display';
            valueDisplay.id = `param-${this.controllerName}-${this.id}-value-display`;
            valueDisplay.textContent = slider.value; // Используем начальное значение слайдера
            sliderContainer.appendChild(valueDisplay);
        }

        slider.addEventListener('input', (e) => { // 'input' срабатывает при движении ползунка
            const value = parseFloat(e.target.value);
            this.currentValue = value;
            if (valueDisplay) {
                valueDisplay.textContent = value; // Обновляем отображение
            }
            this.eventManager.publish('PARAMETER_VALUE_CHANGED', {
                paramId: this.id,
                value: value,
                controllerName: this.controllerName
            });
        });

        sliderContainer.appendChild(slider);

        controlDiv.appendChild(sliderContainer);
        this.domElement = container;
        return this.domElement;
    }

    updateValue(value) {
        if (this.domElement && this.domElement.querySelector) {
            const slider = this.domElement.querySelector('input.slider-input');
            if (slider && parseFloat(slider.value) !== value) {
                 slider.value = value;
                 this.currentValue = value;
                 // Обновляем отображение значения, если оно есть
                 if (this.showValueDisplay) {
                     const valueDisplay = this.domElement.querySelector('.slider-value-display');
                     if (valueDisplay) {
                         valueDisplay.textContent = value;
                     }
                 }
            }
        }
    }

    getValue() {
        if (this.domElement && this.domElement.querySelector) {
            const slider = this.domElement.querySelector('input.slider-input');
            if (slider) {
                const value = parseFloat(slider.value);
                return isNaN(value) ? this.currentValue : value;
            }
        }
        return this.currentValue;
    }

    destroy() {
        super.destroy();
    }
}


class SelectParameterElement extends ParameterElement {
    constructor(schema, controllerName, handlers, eventManager, logger = GlobalLogger) {
        super(schema, controllerName, handlers, eventManager, logger);
        // Значение по умолчанию для select
        this.currentValue = this.defaultValue !== undefined ? this.defaultValue : '';
        // Опции для select должны быть в frontendProps
        this.options = this.frontendProps.options || []; // Ожидаем массив объектов { value: '...', label: '...' }
    }

    render() {
        const { container, controlDiv } = this._createCommonParts();

        const select = document.createElement('select');
        select.id = `param-${this.controllerName}-${this.id}-select`;
        select.className = 'select-input';

        // Заполняем опции
        this.options.forEach(optionData => {
            const option = document.createElement('option');
            option.value = optionData.value;
            option.textContent = optionData.label || optionData.value;
            select.appendChild(option);
        });

        // Устанавливаем значение по умолчанию (или currentValue) ПОСЛЕ заполнения опций
        select.value = this.currentValue;

        select.addEventListener('change', (e) => {
            const value = e.target.value;
            this.currentValue = value;
            this.eventManager.publish('PARAMETER_VALUE_CHANGED', {
                paramId: this.id,
                value: value,
                controllerName: this.controllerName
            });
        });

        controlDiv.appendChild(select);
        this.domElement = container;
        return this.domElement;
    }

    updateValue(value) {
        if (this.domElement && this.domElement.querySelector) {
            const select = this.domElement.querySelector('select.select-input');
            if (select && select.value !== value) {
                 select.value = value;
                 this.currentValue = value;
            }
        }
    }

    getValue() {
        if (this.domElement && this.domElement.querySelector) {
            const select = this.domElement.querySelector('select.select-input');
            if (select) {
                return select.value;
            }
        }
        return this.currentValue;
    }

    destroy() {
        super.destroy();
    }
}


class RadioParameterElement extends ParameterElement {
    constructor(schema, controllerName, handlers, eventManager, logger = GlobalLogger) {
        super(schema, controllerName, handlers, eventManager, logger);
        // Значение по умолчанию для radio
        this.currentValue = this.defaultValue !== undefined ? this.defaultValue : '';
        // Опции для radio должны быть в frontendProps
        this.options = this.frontendProps.options || []; // Ожидаем массив объектов { value: '...', label: '...' }
    }

    render() {
        const { container, controlDiv } = this._createCommonParts();

        const radioContainer = document.createElement('div');
        radioContainer.className = 'radio-container'; // Дополнительный контейнер для стиля

        this.options.forEach((optionData, index) => {
            const radioItem = document.createElement('div');
            radioItem.className = 'radio-item';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `param-${this.controllerName}-${this.id}-radio-group`; // Группа для радио
            radio.id = `param-${this.controllerName}-${this.id}-radio-${index}`;
            radio.value = optionData.value;
            radio.dataset.optionIndex = index; // Для удобства поиска

            // Устанавливаем checked, если значение совпадает с defaultValue/currentValue
            if (optionData.value === this.currentValue) {
                radio.checked = true;
            }

            const label = document.createElement('label');
            label.htmlFor = radio.id;
            label.textContent = optionData.label || optionData.value;

            radioItem.appendChild(radio);
            radioItem.appendChild(label);
            radioContainer.appendChild(radioItem);

            radio.addEventListener('change', (e) => {
                if (e.target.checked) { // Проверяем, что именно этот radio стал отмечен
                    const value = e.target.value;
                    this.currentValue = value;
                    this.eventManager.publish('PARAMETER_VALUE_CHANGED', {
                        paramId: this.id,
                        value: value,
                        controllerName: this.controllerName
                    });
                }
            });
        });

        controlDiv.appendChild(radioContainer);
        this.domElement = container;
        return this.domElement;
    }

    updateValue(value) {
        if (this.domElement && this.domElement.querySelector) {
            // Находим радио с нужным значением и отмечаем его
            const radioInputs = this.domElement.querySelectorAll(`input[name="param-${this.controllerName}-${this.id}-radio-group"]`);
            radioInputs.forEach(radio => {
                if (radio.value === value) {
                    radio.checked = true;
                    this.currentValue = value; // Обновляем внутреннее значение
                } else {
                    radio.checked = false; // Снимаем с других
                }
            });
        }
    }

    getValue() {
        // Возвращаем текущее значение на основе checked radio
        if (this.domElement && this.domElement.querySelector) {
            const checkedRadio = this.domElement.querySelector(`input[name="param-${this.controllerName}-${this.id}-radio-group"]:checked`);
            if (checkedRadio) {
                return checkedRadio.value;
            }
        }
        return this.currentValue; // Если DOM недоступен или не отмечен ни один radio
    }

    destroy() {
        super.destroy();
    }
}