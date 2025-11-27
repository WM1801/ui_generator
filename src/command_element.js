class CommandElement extends UIElement {
    constructor(schema, controllerName, handlers, eventManager, logger = GlobalLogger) {
        super(schema, controllerName, handlers, eventManager, logger);
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this); 
        this.handleMouseUp = this.handleMouseUp.bind(this);     
        this.handleMouseLeave = this.handleMouseLeave.bind(this); 

        // Поведение
        this.isToggle = (schema.frontend_props && schema.frontend_props.behavior === 'toggle') || false;
        this.state = false;

        // Стили и отображение (актуально для toggle)
        this.styleClass = (schema.frontend_props && schema.frontend_props.style) || '';
        this.styleActiveClass = (schema.frontend_props && schema.frontend_props.style_active) || '';
        this.displayNameInactive = this.displayName; // display_name из схемы
        this.displayNameActive = (schema.frontend_props && schema.frontend_props.display_name_active) || this.displayNameInactive;
        this.nameLabel = this.displayNameLabel || ''; 
        // Стили и отображение для нажатия (актуально для всех)
        this.styleClickedClass = (schema.frontend_props && schema.frontend_props.style_clicked) || '';
        this.displayNameClicked = (schema.frontend_props && schema.frontend_props.display_name_clicked) || '';
        this.autoReset = (schema.frontend_props && schema.frontend_props.auto_reset) || false;
        this.clickDuration = (schema.frontend_props && schema.frontend_props.click_duration) || 200; // по умолчанию 200мс
        this.isCurrentlyClicked = false; // Состояние нажатия

        this.tooltip = (schema.frontend_props && schema.frontend_props.tooltip) || '';
    
    }

    render() {
        const container = document.createElement('div');
        container.className = 'item';
        if(this.displayNameLabelVisible === true){
            const label = document.createElement('span');
            label.className = 'item-label';
            if(this.nameLabel===""){
                label.textContent = "default_name";
            }else {
                label.textContent = this.nameLabel;
            }
            container.appendChild(label);
        }
        
        const controlDiv = document.createElement('div');
        controlDiv.className = 'item-control';
        container.appendChild(controlDiv);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'command-button';

        if (this.styleClass) {
            button.classList.add(this.styleClass);
        }

        if (this.tooltip) {
            button.title = this.tooltip;
        }

        if (this.isToggle) {
            button.classList.add('toggle-button');
            button.setAttribute('aria-pressed', this.state ? 'true' : 'false');
            this._updateToggleAppearance(button, this.state);
        } else {
            button.textContent = this.displayNameInactive;
        }

        button.dataset.commandId = this.id;

        // ---  ОБРАБОТЧИКИ СОБЫТИЙ ---
        this.addEventListener(button, 'click', this.handleClick);
        this.addEventListener(button, 'mousedown', this.handleMouseDown);
        this.addEventListener(button, 'mouseup', this.handleMouseUp);
        this.addEventListener(button, 'mouseleave', this.handleMouseLeave); // Если мышь ушла во время нажатия
        // blur может быть полезен при focus, но mousedown/up/leave покрывают основной UI
        // ---

        controlDiv.appendChild(button);
        this.domElement = container;
        return this.domElement;
    }

    handleClick() {
        if (this.isToggle) {
            this.state = !this.state;
            const button = this.domElement.querySelector('button.command-button');
            if (button) {
                button.setAttribute('aria-pressed', this.state ? 'true' : 'false');
                this._updateToggleAppearance(button, this.state);
            }
            // Публикуем событие с новым состоянием
            this.eventManager.publish('COMMAND_TOGGLED', {
                commandId: this.id,
                controllerName: this.controllerName,
                state: this.state //состояние передаётся в eventManager
            });

             // Вызываем обработчик, передавая новое состояние toggle-кнопки
            if (this.handlers && typeof this.handlers.onCommand === 'function') {
                this.handlers.onCommand(this.id, this.state); //  передаём this.state
            }
        } else {
            // Для обычной кнопки состояние не меняется, всегда false
            // Публикуем событие без состояния
            this.eventManager.publish('COMMAND_CLICKED', {
                commandId: this.id,
                controllerName: this.controllerName
            });
            // Вызываем обработчик, не передавая состояние (или передавая null/undefined)
            if (this.handlers && typeof this.handlers.onCommand === 'function') {
                this.handlers.onCommand(this.id , undefined );
            }
        }
    }

    // --- МЕТОДЫ ОБРАБОТЧИКОВ ---
    handleMouseDown() {
        this.isCurrentlyClicked = true;
        const button = this.domElement.querySelector('button.command-button');
        if (button && this.styleClickedClass) {
            button.classList.add(this.styleClickedClass);
        }
        if (button && this.displayNameClicked) {
            // Сохраняем текущий текст, чтобы вернуть его позже
            this.originalTextDuringClick = button.textContent;
            button.textContent = this.displayNameClicked;
        }

        // Если включён auto_reset, планируем сброс
        if (this.autoReset) {
            clearTimeout(this.clickResetTimer); // Очищаем предыдущий таймер, если был
            this.clickResetTimer = setTimeout(() => {
                this._resetClickAppearance();
            }, this.clickDuration);
        }
    }

    handleMouseUp() {
        this._resetClickAppearance();
    }

    handleMouseLeave() {
        // Если кнопка "ушла" из-под курсора во время нажатия, сбрасываем
        if (this.isCurrentlyClicked) {
            this._resetClickAppearance();
        }
    }

    /**
     * Сбрасывает стиль и текст, установленные при нажатии.
     * @private
     */
    _resetClickAppearance() {
        if (this.isCurrentlyClicked) {
            this.isCurrentlyClicked = false;
            clearTimeout(this.clickResetTimer); // Очищаем таймер, если сброс произошёл вручную
            const button = this.domElement.querySelector('button.command-button');
            if (button) {
                if (this.styleClickedClass) {
                    button.classList.remove(this.styleClickedClass);
                }
                // Восстанавливаем текст в зависимости от текущего состояния (toggle или обычный)
                if (this.isToggle) {
                    // Для toggle восстанавливаем текст, соответствующий this.state
                    button.textContent = this.state ? this.displayNameActive : this.displayNameInactive;
                } else {
                    // Для обычной кнопки восстанавливаем неактивный текст
                    button.textContent = this.displayNameInactive;
                }
                // Убираем временную переменную
                delete this.originalTextDuringClick;
            }
        }
    }
    // ---

    _updateToggleAppearance(button, state) {
        // Убираем активный класс и добавляем неактивный (или наоборот)
        if (this.styleActiveClass) {
            if (state) {
                if (this.styleClass) button.classList.remove(this.styleClass);
                button.classList.add(this.styleActiveClass);
            } else {
                button.classList.remove(this.styleActiveClass);
                if (this.styleClass) button.classList.add(this.styleClass);
            }
        }
        // Устанавливаем текст
        button.textContent = state ? this.displayNameActive : this.displayNameInactive;
    }

    destroy() {
        // Очищаем таймер при уничтожении элемента, чтобы избежать утечек памяти
        if (this.clickResetTimer) {
            clearTimeout(this.clickResetTimer);
        }
        super.destroy();
    }
}