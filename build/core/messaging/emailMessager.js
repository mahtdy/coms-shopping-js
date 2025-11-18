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
const repository_1 = __importDefault(require("../mongoose-controller/repositories/emailTemplate/repository"));
const repository_2 = __importDefault(require("../mongoose-controller/repositories/emailConfig/repository"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const errorLogger_1 = __importDefault(require("../errorLogger"));
let EmailMessager = class EmailMessager {
    constructor() {
    }
    static async send(options) {
        try {
            // return true
            var template = await new repository_1.default().findOne({
                title: options.template
            });
            if (template == null) {
                return false;
            }
            var config;
            var emailConfigRepo = new repository_2.default();
            if (template.defaultEmailConfig) {
                config = await emailConfigRepo.findById(template.defaultEmailConfig);
            }
            else {
                config = await emailConfigRepo.getDefault();
            }
            if (config == null) {
                return false;
            }
            var transporter = nodemailer_1.default.createTransport({
                host: config.host,
                port: config.port,
                auth: {
                    user: config.config.userName,
                    pass: config.config.password
                },
                secure: false,
                tls: {
                    rejectUnauthorized: false
                }
            });
            const mailOptions = {
                from: config.config.userName,
                to: options.receptor,
                subject: "subject",
                html: this.renderHtml(template === null || template === void 0 ? void 0 : template.text, options.parameters)
            };
            try {
                var info = await transporter.sendMail(mailOptions);
                console.log(info);
                return true;
            }
            catch (error) {
                console.log(error);
                throw error;
                return false;
            }
        }
        catch (error) {
            throw error;
        }
    }
    static async sendMulti(options) {
        console.log(options);
        try {
            var template = await new repository_1.default().findOne({
                title: options.template
            });
            if (template == null) {
                return false;
            }
            var config;
            var emailConfigRepo = new repository_2.default();
            if (template.defaultEmailConfig) {
                config = await emailConfigRepo.findById(template.defaultEmailConfig);
            }
            else {
                config = await emailConfigRepo.getDefault();
            }
            console.log(config);
            if (config == null) {
                return false;
            }
            var transporter = nodemailer_1.default.createTransport({
                service: "gmail",
                auth: {
                    user: config.config.userName,
                    pass: config.config.password
                }
            });
            for (let i = 0; i < options.receptor.length; i++) {
                const mailOptions = {
                    from: config.config.userName, // sender address
                    to: options.receptor[i], // list of receivers
                    subject: "subject", // Subject line
                    html: this.renderHtml(template === null || template === void 0 ? void 0 : template.text, options.parameters[i]) // plain text body
                };
                try {
                    console.log(mailOptions);
                    var info = await transporter.sendMail(mailOptions);
                    console.log(info);
                    // return true
                }
                catch (error) {
                    console.log(error);
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            throw error;
        }
    }
    static async sendWithConfig(options, config) {
        var template = await new repository_1.default().findOne({
            title: options.template
        });
        var transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: config.config.userName,
                pass: config.config.password
            }
        });
        const mailOptions = {
            from: config.config.userName, // sender address
            to: options.receptor, // list of receivers
            subject: "subject", // Subject line
            html: template === null || template === void 0 ? void 0 : template.text // plain text body
        };
        try {
            var info = await transporter.sendMail(mailOptions);
            console.log(info);
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
    static renderHtml(html, data) {
        for (const key in data) {
            html = html.replace(`$${key}`, data[key]);
        }
        return html;
    }
};
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "email",
            error: err.message,
            isCritical: false,
            // otherInfo: {
            //     service: "kasbarg",
            //     error: err,
            //     type: "OTP"
            // }
        };
    })
], EmailMessager, "send", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "email",
            error: err.message,
            isCritical: false,
            otherInfo: {
                multi: true,
                error: err
            }
        };
    })
], EmailMessager, "sendMulti", null);
EmailMessager = __decorate([
    (0, baseMessager_1.staticImplements)()
], EmailMessager);
exports.default = EmailMessager;
