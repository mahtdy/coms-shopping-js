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
const baseMessager_1 = require("./baseMessager");
const repository_1 = __importDefault(require("../mongoose-controller/repositories/notificationTemplate/repository"));
const repository_2 = __importDefault(require("../mongoose-controller/repositories/domain/repository"));
const repository_3 = __importDefault(require("../mongoose-controller/repositories/language/repository"));
// import nodemailer from "nodemailer"
const web_push_1 = __importDefault(require("web-push"));
// interface EditTemplate {
//     template: SmsTemplate
//     text: string
// }
// export enum EditTemplateResult {
//     "extenalError" = 400,
//     "internalError" = 500,
//     "success" = 200
// }
const notificationTemplateRepo = new repository_1.default();
const domainRepo = new repository_2.default();
const languageRepo = new repository_3.default();
let NotificationMessager = class NotificationMessager {
    constructor() {
    }
    // static async send(options: NoticationDataOptions): Promise<boolean> {
    //     return false
    // }
    static async sendMulti(options) {
        return false;
    }
    static async send(options) {
        // console.log(options)
        // webpush.setVapidDetails(
        //     'mailto:example@yourdomain.org',
        //     "BA15XdzcdKUtdLFBw-VJGF8yeBdMt2zEd3o_J1_h5hJ6w4Y04oplqs0ZfNVuCx5sMQC2vvTYEJyImLE4MLDNxyM",
        //     "yKlDizb7BDCnAkCxe2Oqyi_hgQ2ccd7howsVGSMymfo"
        // )
        // // web
        try {
            let domain;
            if (options.language) {
                let language = await languageRepo.findById(options.language);
                if (language == null) {
                    return false;
                }
                if (language.domain != undefined) {
                    domain = await domainRepo.findById(language.domain);
                }
                else {
                    domain = await domainRepo.findOne({
                        isDefault: true
                    });
                }
            }
            else {
                domain = await domainRepo.findOne({
                    isDefault: true
                });
            }
            if (domain == null) {
                return false;
            }
            if (options.receptor.length != undefined) {
                for (let i = 0; i < options.receptor.length; i++) {
                    await this.sendNotif({
                        template: options.template,
                        parameters: options.parameters,
                        receptor: options.receptor[i],
                        url: options.url
                    }, domain);
                }
            }
            else {
                await this.sendNotif(options, domain);
            }
        }
        catch (error) {
            throw error;
        }
        return false;
    }
    static async sendNotif(options, domain) {
        var _a, _b, _c;
        try {
            if (options.receptor.domain.toHexString() != domain._id.toHexString()) {
                console.log("resturn");
            }
            if (options.receptor.type == "web-push") {
                web_push_1.default.setVapidDetails(`mailto:${(_a = domain.notificationConfig) === null || _a === void 0 ? void 0 : _a.email}`, ((_b = domain.notificationConfig) === null || _b === void 0 ? void 0 : _b.publicKey) || "", ((_c = domain.notificationConfig) === null || _c === void 0 ? void 0 : _c.privateKey) || "");
                let template = await notificationTemplateRepo.findOne({
                    title: options.template
                });
                console.log(template);
                if (template == null) {
                    return;
                }
                let msg = template.text;
                for (const key in options.parameters) {
                    msg = msg.replace(`$${key}`, options.parameters[key]);
                }
                await web_push_1.default.sendNotification(options.receptor.config, JSON.stringify({
                    title: template.messageTitle,
                    message: msg,
                    url: options.url
                }));
            }
        }
        catch (error) {
            // console.log("ee" , error)
            throw error;
        }
    }
};
NotificationMessager = __decorate([
    (0, baseMessager_1.staticImplements)()
], NotificationMessager);
exports.default = NotificationMessager;
