"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditTemplateResult = void 0;
const baseMessager_1 = require("./baseMessager");
const repository_1 = __importDefault(require("../mongoose-controller/repositories/smsConfig/repository"));
const repository_2 = __importDefault(require("../mongoose-controller/repositories/smsTemplate/repository"));
const model_1 = require("../mongoose-controller/repositories/smsConfig/model");
const request_1 = __importDefault(require("request"));
const mongoose_1 = require("mongoose");
const soap = __importStar(require("soap"));
const util_1 = require("util");
const errorLogger_1 = __importDefault(require("../errorLogger"));
const repository_3 = __importDefault(require("../mongoose-controller/repositories/smsMessageLog/repository"));
var kavenegar = require("kavenegar");
var smsMessageLogReo = new repository_3.default();
function SMSLog(helper) {
    return (target, propertyKey, propertyDescriptor) => {
        propertyDescriptor = propertyDescriptor;
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            try {
                var result = await originalMethod.apply(this, args);
                await smsMessageLogReo.insert(helper(args, result));
                // console.log(result);
                // console.log(args)
                return result;
            }
            catch (err) {
                throw err;
            }
        };
        return propertyDescriptor;
    };
}
function OTPHelper(args, id) {
    return {
        _id: args[0].id,
        reciver: args[0].receptor,
        sendDate: new Date(),
        delivered: false,
        fialed: false,
        senderId: id,
        data: args[0].parameters,
        sender: args[1]._id,
        template: args[2]._id
    };
}
var EditTemplateResult;
(function (EditTemplateResult) {
    EditTemplateResult[EditTemplateResult["extenalError"] = 400] = "extenalError";
    EditTemplateResult[EditTemplateResult["internalError"] = 500] = "internalError";
    EditTemplateResult[EditTemplateResult["success"] = 200] = "success";
})(EditTemplateResult || (exports.EditTemplateResult = EditTemplateResult = {}));
let SmsMessager = class SmsMessager {
    constructor() {
    }
    static async sendMulti(options) {
        var template = await new repository_2.default().findOne({
            title: options.template
        }, {
            fromDb: true
        });
        if (template == null) {
            return false;
        }
        try {
            var config;
            if (template.defaultSmsConfig) {
                config = await new repository_1.default().findById(new mongoose_1.Types.ObjectId(template.defaultSmsConfig), {
                    fromDb: true
                });
            }
            else {
                config = await new repository_1.default().getDefault();
            }
        }
        catch (error) {
            return false;
        }
        if (config == null) {
            return false;
        }
        if (config.isOTP) {
            for (let i = 0; i < options.data.length; i++) {
                await this.sendOTP({
                    receptor: options.data[i].receptor,
                    parameters: options.data[i].parameters,
                    template: options.template
                }, config, template);
            }
            return false;
        }
        else {
            try {
                for (let i = 0; i < options.data.length; i++) {
                    var msg = template.text;
                    var inputs = template.inputs;
                    for (let j = 0; j < inputs.length; j++) {
                        msg = msg.replace("$" + inputs[i], options.data[i].parameters[inputs[j]]);
                    }
                    var data = {
                        message: msg,
                        receptor: options.data[i].receptor,
                        sender: config.lineNumber,
                    };
                    switch (config.id) {
                        case model_1.SmsServices.kasbarg:
                            await this.kasbarg(data, config);
                        case model_1.SmsServices.farapayamak:
                            break;
                        case model_1.SmsServices.sms:
                            await this.sms(data, config);
                        case model_1.SmsServices.sabapayamak:
                            await this.sabapayamak(data, config);
                        case model_1.SmsServices.mediapayamak:
                            await this.mediapayamak(data, config);
                        case model_1.SmsServices.kavenegar:
                            await this.kavenegar(data, config);
                        case model_1.SmsServices.parsgreen:
                            await this.parsgreen(data, config);
                        case model_1.SmsServices["hiro-sms"]:
                            await this.hiroSms(data, config);
                        case model_1.SmsServices.niksms:
                            await this.niksms(data, config);
                        case model_1.SmsServices.smspanel:
                            await this.smspanel(data, config);
                        case model_1.SmsServices["payam-resan"]:
                            await this.payamResan(data, config);
                        case model_1.SmsServices.mellipayamak:
                            await this.mellipayamak(data, config);
                            break;
                        default:
                            break;
                    }
                }
            }
            catch (error) {
                // console.log(error)
                throw error;
            }
        }
        return false;
    }
    static async send(options) {
        var template = await new repository_2.default().findOne({
            title: options.template
        }, {
            fromDb: true
        });
        if (template == null) {
            return false;
        }
        try {
            var config = null;
            if (template.sendOTP) {
                config = await new repository_1.default().getOTP();
            }
            if (template.defaultSmsConfig && config == null) {
                config = await new repository_1.default().findById(new mongoose_1.Types.ObjectId(template.defaultSmsConfig), {
                    fromDb: true
                });
            }
            else if (config == null) {
                config = await new repository_1.default().getDefault();
            }
        }
        catch (error) {
            return false;
        }
        if (config == null) {
            return false;
        }
        if (config.isOTP) {
            return await this.sendOTP(options, config, template);
        }
        else {
            var msg = template.text;
            var inputs = template.inputs;
            for (let i = 0; i < inputs.length; i++) {
                msg = msg.replace("$" + inputs[i], options.parameters[inputs[i]]);
            }
            var data = {
                message: msg,
                receptor: options.receptor,
                sender: config.lineNumber,
            };
            try {
                switch (config.id) {
                    case model_1.SmsServices.kasbarg:
                        return await this.kasbarg(data, config);
                    case model_1.SmsServices.farapayamak:
                        break;
                    case model_1.SmsServices.sms:
                        return await this.sms(data, config);
                    case model_1.SmsServices.sabapayamak:
                        return await this.sabapayamak(data, config);
                    case model_1.SmsServices.mediapayamak:
                        return await this.mediapayamak(data, config);
                    case model_1.SmsServices.kavenegar:
                        return await this.kavenegar(data, config);
                    case model_1.SmsServices.parsgreen:
                        return await this.parsgreen(data, config);
                    case model_1.SmsServices["hiro-sms"]:
                        return await this.hiroSms(data, config);
                    case model_1.SmsServices.niksms:
                        return await this.niksms(data, config);
                    case model_1.SmsServices.smspanel:
                        return await this.smspanel(data, config);
                    case model_1.SmsServices["payam-resan"]:
                        return await this.payamResan(data, config);
                    case model_1.SmsServices.mellipayamak:
                        return await this.mellipayamak(data, config);
                        break;
                    default:
                        break;
                }
            }
            catch (error) {
                // console.log(error)
                throw error;
            }
        }
        return false;
    }
    static async sendOTP(options, config, template) {
        // return true
        // console.log(options)
        // return true
        // for (const key in object) {
        //     if (Object.prototype.hasOwnProperty.call(object, key)) {
        //         const element = object[key];
        //     }
        // }
        var data = {
            template: options.template,
            type: 1,
            receptor: options.receptor
        };
        var text = template.text;
        var inputs = template.inputs;
        var indeces = [];
        for (let i = 0; i < inputs.length; i++) {
            var index = text.indexOf("$" + inputs[i]);
            if (index != -1) {
                indeces.push({
                    input: inputs[i],
                    index: index
                });
            }
        }
        indeces.sort((a, b) => a.index - b.index);
        for (let i = 0; i < indeces.length; i++) {
            if (options.parameters[indeces[i].input] != undefined) {
                if (typeof options.parameters[indeces[i].input] == "string")
                    data["param" + (i + 1)] = options.parameters[indeces[i].input].split(" ").join("/");
                else
                    data["param" + (i + 1)] = options.parameters[indeces[i].input];
            }
        }
        return new Promise((resolve, reject) => {
            var _a;
            request_1.default.post('http://api.iransmsservice.com/v2/send/verify', {
                'headers': {
                    'apikey': (_a = config === null || config === void 0 ? void 0 : config.config) === null || _a === void 0 ? void 0 : _a.apikey,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: data,
                proxy: false
            }, function (error, response) {
                if (error)
                    return reject(error);
                var responseData = JSON.parse(response.body);
                if (responseData.result == "success" &&
                    parseInt(responseData.messageids) > 1000) {
                    return resolve(responseData.messageids);
                }
                console.log(responseData);
                // resolve(false)
                reject(JSON.stringify(responseData));
            });
        });
    }
    static async sendWithConfig(options, config) {
        var template = await new repository_2.default().findOne({
            title: options.template
        }, {
            fromDb: true
        });
        if (template == null) {
            return false;
        }
        if (config.isOTP) {
            var data = {
                template: options.template,
                type: 1,
                receptor: options.receptor
            };
            var text = template.text;
            var inputs = template.inputs;
            var indeces = [];
            for (let i = 0; i < inputs.length; i++) {
                var index = text.indexOf("$" + inputs[i]);
                if (index != -1) {
                    indeces.push({
                        input: inputs[i],
                        index: index
                    });
                }
            }
            indeces.sort((a, b) => a.index - b.index);
            for (let i = 0; i < indeces.length; i++) {
                data["param" + (i + 1)] = options.parameters[indeces[i].input];
            }
            return new Promise((resolve, reject) => {
                var _a;
                request_1.default.post('http://api.iransmsservice.com/v2/send/verify', {
                    'headers': {
                        'apikey': (_a = config === null || config === void 0 ? void 0 : config.config) === null || _a === void 0 ? void 0 : _a.apikey,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    form: data,
                }, function (error, response) {
                    if (error)
                        return reject(error);
                    var responseData = JSON.parse(response.body);
                    if (responseData.result == "success" &&
                        parseInt(responseData.messageids) > 1000) {
                        return resolve(true);
                    }
                    return resolve(false);
                });
            });
        }
        else {
            var msg = template.text;
            var inputs = template.inputs;
            for (let i = 0; i < inputs.length; i++) {
                msg = msg.replace("$" + inputs[i], options.parameters[inputs[i]]);
            }
            var data = {
                message: msg,
                receptor: options.receptor,
                sender: config.lineNumber,
            };
            try {
                switch (config.id) {
                    case model_1.SmsServices.kasbarg:
                        return await this.kasbarg(data, config);
                    case model_1.SmsServices.farapayamak:
                        break;
                    case model_1.SmsServices.sms:
                        return await this.sms(data, config);
                    case model_1.SmsServices.sabapayamak:
                        return await this.sabapayamak(data, config);
                    case model_1.SmsServices.mediapayamak:
                        return await this.mediapayamak(data, config);
                    case model_1.SmsServices.kavenegar:
                        return await this.kavenegar(data, config);
                    case model_1.SmsServices.parsgreen:
                        return await this.parsgreen(data, config);
                    case model_1.SmsServices["hiro-sms"]:
                        return await this.hiroSms(data, config);
                    case model_1.SmsServices.niksms:
                        return await this.niksms(data, config);
                    case model_1.SmsServices.smspanel:
                        return await this.smspanel(data, config);
                    case model_1.SmsServices["payam-resan"]:
                        return await this.payamResan(data, config);
                    case model_1.SmsServices.mellipayamak:
                        return await this.mellipayamak(data, config);
                    default:
                        break;
                }
            }
            catch (error) {
                console.log("error");
                throw error;
            }
        }
        return false;
    }
    static async send2(options) {
        var smsRepository = new repository_1.default();
        try {
            var config = await smsRepository.getDefualt();
        }
        catch (error) {
            return false;
        }
        if (config == null) {
            return false;
        }
        if (config.isOTP) {
            request_1.default.post('http://api.iransmsservice.com/v2/send/verify', {
                'headers': {
                    'apikey': config.apikey,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: options,
            }, function (error, response) {
                if (error)
                    throw new Error(error);
                // console.log(response.body);
            });
        }
        return true;
    }
    static async editTemplate(editData) {
        var text = editData.text;
        var inputs = editData.template.inputs;
        var indeces = [];
        for (let i = 0; i < inputs.length; i++) {
            var index = text.indexOf("$" + inputs[i]);
            if (index != -1) {
                indeces.push({
                    input: inputs[i],
                    index: index
                });
            }
        }
        if (indeces.length == 0) {
            return EditTemplateResult.extenalError;
        }
        indeces.sort((a, b) => a.index - b.index);
        var textToEdit = text;
        for (let i = 0; i < indeces.length; i++) {
            textToEdit = textToEdit.replace("$" + indeces[i].input, "%param" + (i + 1) + "%");
        }
        try {
            var config = await new repository_1.default().getOTP();
        }
        catch (error) {
            throw error;
        }
        if (config == null) {
            return EditTemplateResult.internalError;
        }
        var data = {
            template: editData.template.title,
            message: textToEdit,
            templateid: editData.template.id
        };
        return new Promise((resolve, reject) => {
            var _a;
            request_1.default.post('http://api.iransmsservice.com/v2/sms/otp/edit', {
                'headers': {
                    'apikey': (_a = config === null || config === void 0 ? void 0 : config.config) === null || _a === void 0 ? void 0 : _a.apikey,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: data,
            }, function (error, response) {
                if (error)
                    return reject(error);
                var responseData = JSON.parse(response.body);
                if (responseData.result == "success " || responseData.result == "success") {
                    return resolve(EditTemplateResult.success);
                }
                return resolve(EditTemplateResult.internalError);
            });
        });
    }
    static async addTemplate(editData) {
        var text = editData.text;
        var inputs = editData.template.inputs;
        var indeces = [];
        for (let i = 0; i < inputs.length; i++) {
            var index = text.indexOf("$" + inputs[i]);
            if (index != -1) {
                indeces.push({
                    input: inputs[i],
                    index: index
                });
            }
        }
        if (indeces.length == 0) {
            throw Error("invalid template");
        }
        indeces.sort((a, b) => a.index - b.index);
        var textToEdit = text;
        for (let i = 0; i < indeces.length; i++) {
            textToEdit = textToEdit.replace("$" + indeces[i].input, "%param" + (i + 1) + "%");
        }
        try {
            var config = await new repository_1.default().getOTP();
        }
        catch (error) {
            throw error;
        }
        if (config == null) {
            throw Error("otp not found");
        }
        var data = {
            template: editData.template.title,
            message: textToEdit
            // templateid: editData.template.id
        };
        // console.log(data)
        return new Promise((resolve, reject) => {
            var _a;
            request_1.default.post('http://api.ghasedaksms.com/v2/sms/otp/create', {
                'headers': {
                    'apikey': (_a = config === null || config === void 0 ? void 0 : config.config) === null || _a === void 0 ? void 0 : _a.apikey,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: data,
            }, function (error, response) {
                // console.log(error)
                if (error)
                    return reject(error);
                var responseData = JSON.parse(response.body);
                if (responseData.result == "success " || responseData.result == "success") {
                    return resolve(responseData.templateid);
                }
                return reject(new Error(responseData.message));
            });
        });
    }
    static async getTemplateStatus(id) {
        try {
            var config = await new repository_1.default().getOTP();
        }
        catch (error) {
            throw error;
        }
        if (config == null) {
            return EditTemplateResult.internalError;
        }
        return new Promise((resolve, reject) => {
            var _a;
            request_1.default.post('http://api.iransmsservice.com/v2/sms/otp/status', {
                'headers': {
                    'apikey': (_a = config === null || config === void 0 ? void 0 : config.config) === null || _a === void 0 ? void 0 : _a.apikey,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                    templateid: id
                },
            }, function (error, response) {
                if (error)
                    return reject(error);
                var responseData = JSON.parse(response.body);
                if (responseData.result == "success " || responseData.result == "success") {
                    return resolve(responseData.status);
                }
                return resolve(EditTemplateResult.internalError);
            });
        });
        return 0;
    }
    static async getOTPSMSStatus(id) {
        try {
            var config = await new repository_1.default().getOTP();
        }
        catch (error) {
            throw error;
        }
        if (config == null) {
            return EditTemplateResult.internalError;
        }
        return new Promise((resolve, reject) => {
            var _a;
            request_1.default.post('http://api.iransmsservice.com/v2/sms/status', {
                'headers': {
                    'apikey': (_a = config === null || config === void 0 ? void 0 : config.config) === null || _a === void 0 ? void 0 : _a.apikey,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                    messageids: id
                },
            }, function (error, response) {
                if (error)
                    return reject(error);
                var responseData = JSON.parse(response.body);
                if (responseData.result == "success " || responseData.result == "success") {
                    return resolve(responseData.list);
                }
                return resolve(EditTemplateResult.internalError);
            });
        });
    }
    static async kasbarg(data, config) {
        // console.log(data,config)
        return new Promise((resolve, reject) => {
            var _a;
            request_1.default.post('http://api.iransmsservice.com/v2/sms/send/simple', {
                'headers': {
                    'apikey': (_a = config.config) === null || _a === void 0 ? void 0 : _a.apikey,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: data,
            }, function (error, response) {
                if (error) {
                    // console.log(error)
                    return reject(error);
                }
                try {
                    var responseData = JSON.parse(response.body);
                    // console.log(responseData)
                    if (responseData.result == "success" &&
                        parseInt(responseData.messageids) > 1000) {
                        return resolve(true);
                    }
                    return resolve(false);
                }
                catch (error) {
                    return reject(error);
                }
            });
        });
    }
    static async farapayamak(data, config) {
        return new Promise((resolve, reject) => {
            request_1.default.post('http://rest.payamak-panel.com/api/SendSMS/SendSMS', {
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                    userName: config.config.userName,
                    password: config.config.password,
                    to: data.receptor,
                    from: config.lineNumber,
                    text: data.message,
                    isflash: 'false'
                },
            }, function (error, response) {
                if (error) {
                    // console.log(error)
                    return reject(error);
                }
                var responseData = JSON.parse(response.body);
                if (responseData.result == "success" &&
                    parseInt(responseData.messageids) > 1000) {
                    return resolve(true);
                }
                return resolve(false);
            });
        });
    }
    static async mellipayamak(data, config) {
        // console.log(data, config)
        return new Promise((resolve, reject) => {
            request_1.default.post('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                    userName: config.config.userName,
                    password: config.config.password,
                    to: data.receptor,
                    from: config.lineNumber,
                    text: data.message,
                    isflash: 'false'
                },
            }, function (error, response) {
                if (error) {
                    // console.log(error)
                    return reject(error);
                }
                var responseData = JSON.parse(response.body);
                if (responseData["RetStatus"] == 1) {
                    return resolve(true);
                }
                try {
                    var err = new Error(JSON.stringify(responseData));
                    // console.log(err)
                    return reject(err);
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    static async sabapayamak(data, config) {
        if (config.config.token) {
            try {
                if (await new Promise((resolve, reject) => {
                    request_1.default.post('https://api.sabapayamak.com/api/v1/message', {
                        'headers': {
                            'Authorization': config.config.token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text: data.message,
                            numbers: [
                                data.receptor
                            ]
                        }),
                    }, function (error, response) {
                        if (error) {
                            return reject(error);
                        }
                        var responseData = JSON.parse(response.body);
                        if (responseData.status == 200) {
                            return resolve(true);
                        }
                        true;
                        return resolve(false);
                    });
                })) {
                    return true;
                }
                else {
                    try {
                        var result = await new Promise((resolve, reject) => {
                            request_1.default.post('https://api.sabapayamak.com/api/v1/user/authenticate', {
                                'headers': {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    username: config.config.userName,
                                    password: config.config.password,
                                    virtualNumber: config.lineNumber,
                                    tokenValidDay: 10
                                }),
                            }, function (error, response) {
                                if (error) {
                                    return reject(error);
                                }
                                var responseData = JSON.parse(response.body);
                                if (responseData["status"] != 200) {
                                    return reject(new Error(JSON.stringify(responseData)));
                                }
                                return resolve(responseData);
                            });
                        });
                    }
                    catch (error) {
                        throw error;
                    }
                    await new repository_1.default().findByIdAndUpdate(config._id, {
                        $set: {
                            "config.token": result.data["token"]
                        }
                    });
                    try {
                        return await new Promise((resolve, reject) => {
                            request_1.default.post('https://api.sabapayamak.com/api/v1/message', {
                                'headers': {
                                    'Authorization': result.data["token"],
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    text: data.message,
                                    numbers: [
                                        data.receptor
                                    ]
                                }),
                            }, function (error, response) {
                                if (error) {
                                    return resolve(false);
                                }
                                var responseData = JSON.parse(response.body);
                                // console.log(responseData)
                                if (responseData.status == 200) {
                                    return resolve(true);
                                }
                                return reject(new Error(JSON.stringify(responseData)));
                            });
                        }) == true;
                    }
                    catch (error) {
                        throw error;
                    }
                }
            }
            catch (error) {
                throw error;
            }
        }
        else {
            try {
                var result = await new Promise((resolve, reject) => {
                    request_1.default.post('https://api.sabapayamak.com/api/v1/user/authenticate', {
                        'headers': {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            username: config.config.userName,
                            password: config.config.password,
                            virtualNumber: config.lineNumber,
                            tokenValidDay: 10
                        }),
                    }, function (error, response) {
                        if (error) {
                            return reject(error);
                        }
                        var responseData = JSON.parse(response.body);
                        if (responseData["status"] != 200) {
                            return reject(new Error(JSON.stringify(responseData)));
                        }
                        return resolve(true);
                    });
                });
            }
            catch (error) {
                throw error;
            }
            await new repository_1.default().findByIdAndUpdate(config._id, {
                $set: {
                    "config.token": result.data["token"]
                }
            });
            try {
                return await new Promise((resolve, reject) => {
                    request_1.default.post('https://api.sabapayamak.com/api/v1/message', {
                        'headers': {
                            'Authorization': result.data["token"],
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text: data.message,
                            numbers: [
                                data.receptor
                            ]
                        }),
                    }, function (error, response) {
                        if (error) {
                            return reject(error);
                        }
                        var responseData = JSON.parse(response.body);
                        if (responseData.status == 200) {
                            return resolve(true);
                        }
                        return reject(new Error(JSON.stringify(responseData)));
                    });
                }) == true;
            }
            catch (error) {
                throw error;
            }
        }
    }
    static async kavenegar(data, config) {
        var api = kavenegar.KavenegarApi({ apikey: config.config.apikey });
        return new Promise((resolve, reject) => {
            api.Send({ message: data.message, sender: config.lineNumber, receptor: data.receptor }, function (response, status) {
                // if (response) {
                //     return resolve(response)
                // }
                if (status != 200) {
                    reject(new Error(status));
                }
                resolve(true);
            });
        });
    }
    static async payamResan(data, config) {
        var createClient = (0, util_1.promisify)(soap.createClient);
        try {
            var client = await createClient("https://www.payam-resan.com/ws/v2/ws.asmx?WSDL");
            return new Promise((resolve, reject) => {
                client.SendMessage({
                    'Username': config.config.userName,
                    'PassWord': config.config.password,
                    'SenderNumber': config.lineNumber,
                    'RecipientNumbers': [data.receptor],
                    'MessageBodie': data.message,
                    'Type': 1,
                    'AllowedDelay': 0
                }, function (error, response) {
                    if (error) {
                        return reject(error);
                    }
                    return resolve(response);
                });
            });
        }
        catch (error) {
            return false;
        }
    }
    static async sms(data, config) {
        if (config.config.token) {
            try {
                if (await new Promise((resolve, reject) => {
                    request_1.default.post('https://RestfulSms.com/api/MessageSend', {
                        'headers': {
                            'x-sms-ir-secure-token': config.config.token,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            Messages: [data.message],
                            MobileNumbers: [
                                data.receptor
                            ],
                            LineNumber: config.lineNumber,
                            SendDateTime: "",
                            CanContinueInCaseOfError: "false"
                        }),
                    }, function (error, response) {
                        if (error) {
                            throw error;
                        }
                        var responseData = JSON.parse(response.body);
                        try {
                            responseData = JSON.parse(responseData);
                        }
                        catch (error) {
                        }
                        // console.log(responseData)
                        if (responseData.IsSuccessful == true) {
                            return resolve(true);
                        }
                        return resolve(false);
                    });
                })) {
                    return true;
                }
                else {
                    try {
                        var result = await new Promise((resolve, reject) => {
                            request_1.default.post('https://RestfulSms.com/api/Token', {
                                'headers': {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    UserApiKey: config.config.apikey,
                                    SecretKey: config.config.secretkey
                                }),
                            }, function (error, response) {
                                if (error) {
                                    return reject(error);
                                }
                                var responseData = JSON.parse(response.body);
                                if (responseData["IsSuccessful"] != true) {
                                    return reject(new Error(JSON.stringify(responseData)));
                                }
                                return resolve(true);
                            });
                        });
                    }
                    catch (error) {
                        throw error;
                    }
                    await new repository_1.default().findByIdAndUpdate(config._id, {
                        $set: {
                            "config.token": result.TokenKey
                        }
                    });
                    try {
                        return await new Promise((resolve, reject) => {
                            request_1.default.post('https://RestfulSms.com/api/MessageSend', {
                                'headers': {
                                    'x-sms-ir-secure-token': result.TokenKey,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    text: data.message,
                                    numbers: [
                                        data.receptor
                                    ]
                                }),
                            }, function (error, response) {
                                if (error) {
                                    return resolve(false);
                                }
                                var responseData = JSON.parse(response.body);
                                if (responseData["IsSuccessful"] != true) {
                                    return reject(new Error(JSON.stringify(responseData)));
                                }
                                return resolve(true);
                            });
                        }) == true;
                    }
                    catch (error) {
                        throw error;
                    }
                }
            }
            catch (error) {
                throw error;
            }
        }
        else {
            try {
                var result = await new Promise((resolve, reject) => {
                    request_1.default.post('https://RestfulSms.com/api/Token', {
                        'headers': {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            UserApiKey: config.config.apikey,
                            SecretKey: config.config.secretkey
                        }),
                    }, function (error, response) {
                        if (error) {
                            return reject(error);
                        }
                        var responseData = JSON.parse(response.body);
                        if (responseData["IsSuccessful"] != true) {
                            return reject(new Error(JSON.stringify(responseData)));
                        }
                        return resolve(true);
                    });
                });
            }
            catch (error) {
                throw error;
            }
            await new repository_1.default().findByIdAndUpdate(config._id, {
                $set: {
                    "config.token": result.TokenKey
                }
            });
            try {
                return await new Promise((resolve, reject) => {
                    request_1.default.post('https://RestfulSms.com/api/MessageSend', {
                        'headers': {
                            'x-sms-ir-secure-token': result.TokenKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text: data.message,
                            numbers: [
                                data.receptor
                            ]
                        }),
                    }, function (error, response) {
                        if (error) {
                            return reject(error);
                        }
                        var responseData = JSON.parse(response.body);
                        if (responseData["IsSuccessful"] != true) {
                            return reject(new Error(JSON.stringify(responseData)));
                        }
                        return resolve(true);
                    });
                }) == true;
            }
            catch (error) {
                throw error;
            }
        }
    }
    static async mediapayamak(data, config) {
        return new Promise((resolve, reject) => {
            request_1.default.post('http://tablig724.ir/SMSInOutBox/Send', {
                'headers': {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserName: config.config.userName,
                    Password: config.config.password,
                    To: data.receptor,
                    From: config.lineNumber,
                    Message: data.message
                }),
            }, function (error, response) {
                if (error) {
                    return reject(error);
                }
                var responseData = response.body;
                if (responseData > 1000) {
                    return resolve(true);
                }
                return resolve(false);
            });
        });
    }
    static async parsgreen(data, config) {
        return new Promise((resolve, reject) => {
            request_1.default.post('https://sms.parsgreen.ir/Apiv2/Message/SendSms', {
                'headers': {
                    'Content-Type': 'application/json',
                    'Authorization': 'basic apikey:' + config.config.apikey
                },
                body: JSON.stringify({
                    Mobiles: [data.receptor],
                    SmsNumber: config.lineNumber,
                    SmsBody: data.message
                }),
            }, function (error, response) {
                if (error) {
                    return reject(error);
                }
                var responseData = response.body;
                try {
                    responseData = JSON.parse(responseData);
                }
                catch (error) {
                }
                if (responseData["R_Success"]) {
                    return resolve(true);
                }
                return reject(new Error(JSON.stringify(responseData)));
            });
        });
    }
    static async hiroSms(data, config) {
        return new Promise((resolve, reject) => {
            request_1.default.post('http://ippanel.com/api/select', {
                'headers': {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    op: "send",
                    uname: config.config.userName,
                    pass: config.config.password,
                    to: [data.receptor],
                    from: config.lineNumber,
                    message: data.message
                }),
            }, function (error, response) {
                if (error) {
                    return reject(error);
                }
                var responseData = response.body;
                if (responseData["R_Success"]) {
                    return resolve(true);
                }
                try {
                    var err = new Error(JSON.stringify(responseData));
                    return reject(err);
                }
                catch (error) {
                    return reject(error);
                }
            });
        });
    }
    static async niksms(data, config) {
        return new Promise((resolve, reject) => {
            soap.createClient("http://niksms.com:1370/NiksmsWebservice.svc?wsdl", async function (err, client) {
                if (err) {
                    return resolve(false);
                }
                var ptpModel = {
                    "security": {
                        "Username": config.config.userName,
                        "Password": config.config.password
                    },
                    "model": {
                        "Message": [{ "string": data.message }],
                        "SenderNumber": config.lineNumber,
                        "Numbers": [{ "string": data.receptor }],
                        "SendType": "Normal",
                        "YourMessageId": [{ "long": "1" }],
                        //"SendOn": "2016-06-22T15:01:00.000Z" in parameter optional ast
                    }
                };
                try {
                    await new Promise((resolve, reject) => {
                        client.PtpSms(ptpModel, function (err, result, body) {
                            if (err) {
                                return reject(err);
                            }
                            if (result.PtpSmsResult.Status == "Successful") {
                                return resolve(true);
                            }
                            return reject(new Error(JSON.stringify(result.PtpSmsResult)));
                        });
                    });
                }
                catch (error) {
                    return reject(error);
                }
            });
        });
    }
    static async smspanel(data, config) {
        return new Promise((resolve, reject) => {
            request_1.default.post('http://www.smspanel.trez.ir/api/smsAPI/SendMessage', {
                'headers': {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + Buffer.from(config.config.userName + ":" + config.config.password).toString("base64")
                },
                body: JSON.stringify({
                    PhoneNumber: config.lineNumber,
                    Message: data.message,
                    UserGroupID: Date.now().toString(),
                    Mobiles: [
                        data.receptor
                    ]
                }),
            }, function (error, response) {
                if (error) {
                    return reject(error);
                }
                var responseData = response.body;
                try {
                    responseData = JSON.parse(responseData);
                }
                catch (error) {
                }
                if (responseData["Code"] == 0) {
                    return resolve(true);
                }
                return reject(new Error(responseData));
            });
        });
    }
};
__decorate([
    SMSLog(OTPHelper),
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "kasbarg",
                error: err,
                type: "OTP"
            }
        };
    })
], SmsMessager, "sendOTP", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "kasbarg",
                error: err,
                type: "OTP"
            }
        };
    })
], SmsMessager, "sendWithConfig", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "kasbarg",
                error: err
            }
        };
    })
], SmsMessager, "kasbarg", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "farapayamak",
                error: err
            }
        };
    })
], SmsMessager, "farapayamak", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "mellipayamak",
                error: err
            }
        };
    })
], SmsMessager, "mellipayamak", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "sabapayamak",
                error: err
            }
        };
    })
], SmsMessager, "sabapayamak", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "kavenegar",
                error: err
            }
        };
    })
], SmsMessager, "kavenegar", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "payamResan",
                error: err
            }
        };
    })
], SmsMessager, "payamResan", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "sms",
                error: err
            }
        };
    })
], SmsMessager, "sms", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "mediapayamak",
                error: err
            }
        };
    })
], SmsMessager, "mediapayamak", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "parsgreen",
                error: err
            }
        };
    })
], SmsMessager, "parsgreen", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "hiroSms",
                error: err
            }
        };
    })
], SmsMessager, "hiroSms", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "niksms",
                error: err
            }
        };
    })
], SmsMessager, "niksms", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "smspanel",
                error: err
            }
        };
    })
], SmsMessager, "smspanel", null);
SmsMessager = __decorate([
    (0, baseMessager_1.staticImplements)()
], SmsMessager);
exports.default = SmsMessager;
