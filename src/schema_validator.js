// schema_validator.js
class SchemaValidator {
    static SUPPORTED_VERSIONS = ['1.0.0']; 
    static validate(schema) {
        const errors = [];

        if (!schema || typeof schema !== 'object') {
            errors.push('Схема должна быть объектом.');
            return { valid: false, errors };
        }

        const schemaVersion = schema.schema_version;
        if (!schemaVersion) {
            errors.push('Схема должна содержать поле schema_version.');
        } else if (!this.SUPPORTED_VERSIONS.includes(schemaVersion)) {
            errors.push(`Версия схемы '${schemaVersion}' не поддерживается. Поддерживаемые версии: ${this.SUPPORTED_VERSIONS.join(', ')}.`);
        }

        if (!schema.controller || typeof schema.controller !== 'object') {
            errors.push('Схема должна содержать объект controller.');
        } else {
            if (!schema.controller.name) {
                errors.push('Схема должна содержать controller.name.');
            }

            // --- ПРОВЕРКА НОВОЙ СТРУКТУРЫ ---
            if (!Array.isArray(schema.controller.items)) {
                errors.push('Схема должна содержать массив controller.items.');
            } else {
                schema.controller.items.forEach((item, index) => {
                    if (!item.type) {
                        errors.push(`Элемент controller.items[${index}] должен иметь type.`);
                        return; // Пропускаем дальнейшую проверку этого элемента
                    }

                    // Проверяем конкретный тип элемента
                    switch (item.type) {
                        case 'tabs':
                            if (!item.id) {
                                errors.push(`Элемент tabs в controller.items[${index}] должен иметь id.`);
                            }
                            if (!Array.isArray(item.tabs)) {
                                errors.push(`Элемент tabs в controller.items[${index}] должен содержать массив tabs.`);
                            } else {
                                // Проверяем структуру tabs (та же логика, что была раньше, но внутри item.tabs)
                                item.tabs.forEach((tab, tIndex) => {
                                    if (!tab.id) {
                                        errors.push(`Вкладка controller.items[${index}].tabs[${tIndex}] должна иметь id.`);
                                    }
                                    if (!Array.isArray(tab.groups)) {
                                        errors.push(`Вкладка controller.items[${index}].tabs[${tIndex}] должна содержать массив groups.`);
                                    } else {
                                        tab.groups.forEach((group, gIndex) => {
                                            if (!group.id) {
                                                errors.push(`Группа controller.items[${index}].tabs[${tIndex}].groups[${gIndex}] должна иметь id.`);
                                            }
                                            if (!Array.isArray(group.items)) {
                                                errors.push(`Группа controller.items[${index}].tabs[${tIndex}].groups[${gIndex}] должна содержать массив items.`);
                                            } else {
                                                group.items.forEach((paramOrCommand, pItemIndex) => {
                                                    if (!paramOrCommand.type) {
                                                        errors.push(`Элемент controller.items[${index}].tabs[${tIndex}].groups[${gIndex}].items[${pItemIndex}] должен иметь type.`);
                                                    } else if (paramOrCommand.type === 'parameter' && !paramOrCommand.param_id) {
                                                        errors.push(`Параметр controller.items[${index}].tabs[${tIndex}].groups[${gIndex}].items[${pItemIndex}] должен иметь param_id.`);
                                                    } else if (paramOrCommand.type === 'command' && !paramOrCommand.command_id) {
                                                        errors.push(`Команда controller.items[${index}].tabs[${tIndex}].groups[${gIndex}].items[${pItemIndex}] должна иметь command_id.`);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                            break;
                        case 'graphics':
                            if (!item.id) {
                                errors.push(`Элемент graphics в controller.items[${index}] должен иметь id.`);
                            }
                            if (!Array.isArray(item.graphics)) {
                                errors.push(`Элемент graphics в controller.items[${index}] должен содержать массив graphics.`);
                            } else {
                                // Проверяем структуру graphics
                                item.graphics.forEach((graphic, gIndex) => {
                                    if (!graphic.id) {
                                        errors.push(`График controller.items[${index}].graphics[${gIndex}] должен иметь id.`);
                                    }
                                });
                            }
                            break;
                        default:
                            errors.push(`Неизвестный тип элемента в controller.items[${index}]: ${item.type}`);
                    }
                });
            }
            // ---
        }

        return { valid: errors.length === 0, errors };
    }
}