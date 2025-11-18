"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../mongoose-controller/repositories/internalMessage/repository"));
const repository_2 = __importDefault(require("../mongoose-controller/repositories/internalMessageTemplate/repository"));
const baseMessager_1 = require("./baseMessager");
// interface EditTemplate {
//     template: SmsTemplate
//     text: string
// }
// export enum EditTemplateResult {
//     "extenalError" = 400,
//     "internalError" = 500,
//     "success" = 200
// }
const internalRepo = new repository_1.default();
const internalTemplateRepo = new repository_2.default();
let InternalMessager = class InternalMessager {
    constructor() {
    }
    static async send(options) {
        try {
            var template = await internalTemplateRepo.findOne({
                title: options.template
            });
            if (template == null) {
                return false;
            }
            await internalRepo.insert({
                id: options.receptor,
                namespace: options.namespace,
                message: this.messageBuilder(template.text, options.parameters)
            });
        }
        catch (error) {
            throw error;
        }
        return false;
    }
    static async sendMulti(options) {
        try {
            var template = await internalTemplateRepo.findOne({
                title: options.template
            });
            if (template == null) {
                return false;
            }
            for (let i = 0; i < options.data.length; i++) {
                try {
                    await internalRepo.insert({
                        id: options.data[i].receptor,
                        namespace: options.namespace,
                        message: this.messageBuilder(template.text, options.data[i].parameters)
                    });
                }
                catch (error) {
                }
            }
        }
        catch (error) {
            throw error;
        }
        return false;
    }
    static messageBuilder(text, parameters) {
        for (const key in parameters) {
            text = text.replace(`$${key}`, parameters[key]);
        }
        return text;
    }
};
InternalMessager = __decorate([
    (0, baseMessager_1.staticImplements)()
], InternalMessager);
exports.default = InternalMessager;
