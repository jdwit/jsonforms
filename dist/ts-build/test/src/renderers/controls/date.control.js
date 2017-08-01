"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const testers_1 = require("../../core/testers");
const renderer_util_1 = require("../renderer.util");
const base_control_1 = require("./base.control");
/**
 * Default tester for date controls.
 * @type {RankedTester}
 */
exports.dateControlTester = testers_1.rankWith(2, testers_1.and(testers_1.uiTypeIs('Control'), testers_1.formatIs('date')));
/**
 * Default date control.
 */
let DateControl = class DateControl extends base_control_1.BaseControl {
    /**
     * @inheritDoc
     */
    configureInput(input) {
        input.type = 'date';
        input.classList.add('form-control');
    }
    /**
     * @inheritDoc
     */
    get valueProperty() {
        return 'valueAsDate';
    }
    /**
     * @inheritDoc
     */
    get inputChangeProperty() {
        return 'oninput';
    }
    /**
     * @inheritDoc
     */
    convertModelValue(value) {
        return new Date(value);
    }
    /**
     * @inheritDoc
     */
    convertInputValue(value) {
        if (value === null || value === undefined) {
            return undefined;
        }
        return value.toISOString().substr(0, 10);
    }
    /**
     * @inheritDoc
     */
    createInputElement() {
        return document.createElement('input');
    }
};
DateControl = __decorate([
    renderer_util_1.JsonFormsRenderer({
        selector: 'jsonforms-date',
        tester: exports.dateControlTester
    })
], DateControl);
exports.DateControl = DateControl;
//# sourceMappingURL=date.control.js.map