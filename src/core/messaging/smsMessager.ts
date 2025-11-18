import Messager, { staticImplements, MyMessager } from "./baseMessager";
import SmsConfigRepository from "../mongoose-controller/repositories/smsConfig/repository";
import SmsTemplateRepository from "../mongoose-controller/repositories/smsTemplate/repository";
import SmsTemplate from "../mongoose-controller/repositories/smsTemplate/model"
import SmsConfig, { SmsServices } from "../mongoose-controller/repositories/smsConfig/model"
import request from "request"
import { Types } from "mongoose"
import * as  soap from "soap"
import { promisify } from "util"
import logSystemError from "../errorLogger";
import SmsMessageLogRepository from "../mongoose-controller/repositories/smsMessageLog/repository";

var kavenegar = require("kavenegar")

var smsMessageLogReo = new SmsMessageLogRepository()
function SMSLog(helper: Function) {
    return (target: any,
        propertyKey: string,
        propertyDescriptor: PropertyDescriptor
    ):
        PropertyDescriptor => {
        propertyDescriptor = propertyDescriptor;

        const originalMethod = propertyDescriptor.value;

        propertyDescriptor.value = async function (...args: any[]) {

            try {
                var result = await originalMethod.apply(this, args);
                await smsMessageLogReo.insert(helper(args, result))
                // console.log(result);
                // console.log(args)
                return result
            } catch (err) {
                throw err;
            }
        };
        return propertyDescriptor;
    }
}

function OTPHelper(args: any[], id: string) {

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
    }
}



interface smsDataOptions {
    template: string,
    receptor: string | string[],
    parameters: any,
    id?: string
}

interface MultiSMSDataOptions {
    template: string,
    data: {
        receptor: string,
        parameters: any,
        ids?: string[]
    }[]
}
interface EditTemplate {
    template: SmsTemplate
    text: string
}
export enum EditTemplateResult {
    "extenalError" = 400,
    "internalError" = 500,
    "success" = 200
}




@staticImplements<Messager>()
export default class SmsMessager implements MyMessager {
    constructor() {

    }

    static async sendMulti(options: MultiSMSDataOptions): Promise<boolean> {
        var template = await new SmsTemplateRepository().findOne({
            title: options.template
        }, {
            fromDb: true
        })
        if (template == null) {
            return false
        }

        try {
            var config: SmsConfig | null;
            if (template.defaultSmsConfig) {
                config = await new SmsConfigRepository().findById(new Types.ObjectId(template.defaultSmsConfig as string), {
                    fromDb: true
                })
            }
            else {
                config = await new SmsConfigRepository().getDefault()
            }
        } catch (error) {
            return false
        }

        if (config == null) {
            return false
        }

        if (config.isOTP) {
            for (let i = 0; i < options.data.length; i++) {
                await this.sendOTP({
                    receptor: options.data[i].receptor as string,
                    parameters: options.data[i].parameters,
                    template: options.template
                }, config, template)
            }
            return false
        }

        else {

            try {
                for (let i = 0; i < options.data.length; i++) {
                    var msg = template.text
                    var inputs = template.inputs
                    for (let j = 0; j < inputs.length; j++) {
                        msg = msg.replace("$" + inputs[i], options.data[i].parameters[inputs[j]])
                    }

                    var data: any = {
                        message: msg,
                        receptor: options.data[i].receptor,
                        sender: config.lineNumber,
                    }


                    switch (config.id) {

                        case SmsServices.kasbarg:
                            await this.kasbarg(data, config)
                        case SmsServices.farapayamak:
                            break;
                        case SmsServices.sms:
                            await this.sms(data, config)
                        case SmsServices.sabapayamak:
                            await this.sabapayamak(data, config)
                        case SmsServices.mediapayamak:
                            await this.mediapayamak(data, config);
                        case SmsServices.kavenegar:
                            await this.kavenegar(data, config);
                        case SmsServices.parsgreen:
                            await this.parsgreen(data, config);
                        case SmsServices["hiro-sms"]:
                            await this.hiroSms(data, config);
                        case SmsServices.niksms:
                            await this.niksms(data, config);
                        case SmsServices.smspanel:
                            await this.smspanel(data, config);
                        case SmsServices["payam-resan"]:
                            await this.payamResan(data, config);
                        case SmsServices.mellipayamak:
                            await this.mellipayamak(data, config);

                            break;

                        default:
                            break;

                    }
                }
            } catch (error) {
                // console.log(error)
                throw error
            }

        }

        return false;
    }

    
    static async send(options: smsDataOptions): Promise<boolean> {
        
        var template = await new SmsTemplateRepository().findOne({
            title: options.template
        }, {
            fromDb: true
        })
        if (template == null) {
            return false
        }
        try {
            var config: SmsConfig | null = null;
            if (template.sendOTP) {
                config = await new SmsConfigRepository().getOTP()
            }
            if (template.defaultSmsConfig && config == null) {
                config = await new SmsConfigRepository().findById(new Types.ObjectId(template.defaultSmsConfig as string), {
                    fromDb: true
                })
            }
            else if (config == null) {
                config = await new SmsConfigRepository().getDefault()
            }
        } catch (error) {
            return false
        }
        if (config == null) {
            return false
        }

        if (config.isOTP) {
            return await this.sendOTP(options, config, template)
        }

        else {
            var msg = template.text
            var inputs = template.inputs
            for (let i = 0; i < inputs.length; i++) {
                msg = msg.replace("$" + inputs[i], options.parameters[inputs[i]])
            }

            var data: any = {
                message: msg,
                receptor: options.receptor,
                sender: config.lineNumber,
            }
            try {

                switch (config.id) {

                    case SmsServices.kasbarg:
                        return await this.kasbarg(data, config)
                    case SmsServices.farapayamak:
                        break;
                    case SmsServices.sms:
                        return await this.sms(data, config)
                    case SmsServices.sabapayamak:
                        return await this.sabapayamak(data, config)
                    case SmsServices.mediapayamak:
                        return await this.mediapayamak(data, config);
                    case SmsServices.kavenegar:
                        return await this.kavenegar(data, config);
                    case SmsServices.parsgreen:
                        return await this.parsgreen(data, config);
                    case SmsServices["hiro-sms"]:
                        return await this.hiroSms(data, config);
                    case SmsServices.niksms:
                        return await this.niksms(data, config);
                    case SmsServices.smspanel:
                        return await this.smspanel(data, config);
                    case SmsServices["payam-resan"]:
                        return await this.payamResan(data, config);
                    case SmsServices.mellipayamak:
                        return await this.mellipayamak(data, config);

                        break;

                    default:
                        break;

                }
            } catch (error) {
                // console.log(error)
                throw error
            }

        }
        return false;
    }



    @SMSLog(OTPHelper)
    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "kasbarg",
                error: err,
                type: "OTP"
            }
        } as unknown as any
    })
    static async sendOTP(options: smsDataOptions, config: any, template: SmsTemplate): Promise<boolean> {
        // return true
        // console.log(options)
        // return true
        // for (const key in object) {
        //     if (Object.prototype.hasOwnProperty.call(object, key)) {
        //         const element = object[key];

        //     }
        // }
        var data: any = {
            template: options.template,
            type: 1,
            receptor: options.receptor
        }

        var text = template.text
        var inputs = template.inputs

        var indeces: {
            input: string,
            index: number
        }[] = []

        for (let i = 0; i < inputs.length; i++) {
            var index = text.indexOf("$" + inputs[i])
            if (index != -1) {
                indeces.push({
                    input: inputs[i],
                    index: index
                })
            }
        }
        indeces.sort((a, b) => a.index - b.index)

        for (let i = 0; i < indeces.length; i++) {
            if (options.parameters[indeces[i].input] != undefined) {
                if (typeof options.parameters[indeces[i].input] == "string")
                    data["param" + (i + 1)] = options.parameters[indeces[i].input].split(" ").join("/")
                else
                    data["param" + (i + 1)] = options.parameters[indeces[i].input]
            }
        }
        return new Promise((resolve, reject) => {
            request.post('http://api.iransmsservice.com/v2/send/verify',
                {
                    'headers': {
                        'apikey': config?.config?.apikey,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    form: data,
                    proxy :false
                    
                }, function (error, response) {

                    if (error){
                        console.log(error)
                        return reject(error);
                    }
                    var responseData = JSON.parse(response.body)
                    if ( 
                        responseData.result == "success" &&
                        parseInt(responseData.messageids) > 1000
                    ) {
                        return resolve(responseData.messageids);
                    }
                    // resolve(false)
                    reject(JSON.stringify(responseData))
                })
        })
    }

    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "kasbarg",
                error: err,
                type: "OTP"
            }
        } as unknown as any
    })


    static async sendWithConfig(options: smsDataOptions, config: any): Promise<boolean> {
        var template = await new SmsTemplateRepository().findOne({
            title: options.template
        }, {
            fromDb: true
        })
        if (template == null) {
            return false
        }


        if (config.isOTP) {
            var data: any = {
                template: options.template,
                type: 1,
                receptor: options.receptor
            }

            var text = template.text
            var inputs = template.inputs

            var indeces: {
                input: string,
                index: number
            }[] = []

            for (let i = 0; i < inputs.length; i++) {
                var index = text.indexOf("$" + inputs[i])
                if (index != -1) {
                    indeces.push({
                        input: inputs[i],
                        index: index
                    })
                }
            }
            indeces.sort((a, b) => a.index - b.index)

            for (let i = 0; i < indeces.length; i++) {
                data["param" + (i + 1)] = options.parameters[indeces[i].input]
            }
            return new Promise((resolve, reject) => {
                request.post('http://api.iransmsservice.com/v2/send/verify',
                    {
                        'headers': {
                            'apikey': config?.config?.apikey,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        form: data,
                    }, function (error, response) {
                        if (error) return reject(error);

                        var responseData = JSON.parse(response.body)

                        if (
                            responseData.result == "success" &&
                            parseInt(responseData.messageids) > 1000
                        ) {
                            return resolve(true);
                        }

                        return resolve(false);
                    })
            })

        }

        else {
            var msg = template.text
            var inputs = template.inputs
            for (let i = 0; i < inputs.length; i++) {
                msg = msg.replace("$" + inputs[i], options.parameters[inputs[i]])
            }

            var data: any = {
                message: msg,
                receptor: options.receptor,
                sender: config.lineNumber,
            }
            try {


                switch (config.id) {
                    case SmsServices.kasbarg:
                        return await this.kasbarg(data, config)
                    case SmsServices.farapayamak:
                        break;
                    case SmsServices.sms:
                        return await this.sms(data, config)
                    case SmsServices.sabapayamak:
                        return await this.sabapayamak(data, config)
                    case SmsServices.mediapayamak:
                        return await this.mediapayamak(data, config);
                    case SmsServices.kavenegar:
                        return await this.kavenegar(data, config);
                    case SmsServices.parsgreen:
                        return await this.parsgreen(data, config);
                    case SmsServices["hiro-sms"]:
                        return await this.hiroSms(data, config);
                    case SmsServices.niksms:
                        return await this.niksms(data, config);
                    case SmsServices.smspanel:
                        return await this.smspanel(data, config);
                    case SmsServices["payam-resan"]:
                        return await this.payamResan(data, config);
                    case SmsServices.mellipayamak:
                        return await this.mellipayamak(data, config);
                    default:
                        break;
                }
            } catch (error) {
                console.log("error")
                throw error
            }

        }
        return false;
    }

    static async send2(options: smsDataOptions): Promise<boolean> {
        var smsRepository = new SmsConfigRepository();
        try {
            var config = await smsRepository.getDefualt()
        } catch (error) {
            return false
        }

        if (config == null) {
            return false
        }
        if (config.isOTP) {
            request.post('http://api.iransmsservice.com/v2/send/verify',
                {
                    'headers': {
                        'apikey': config.apikey,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    form: options,
                }, function (error, response) {
                    if (error) throw new Error(error);
                    // console.log(response.body);
                })
        }



        return true
    }

    static async editTemplate(editData: EditTemplate): Promise<EditTemplateResult> {
    
        var text: string = editData.text
        var inputs = editData.template.inputs

        var indeces: {
            input: string,
            index: number
        }[] = []

        for (let i = 0; i < inputs.length; i++) {
            var index = text.indexOf("$" + inputs[i])
            if (index != -1) {
                indeces.push({
                    input: inputs[i],
                    index: index
                })
            }
        }

        if (indeces.length == 0) {
            return EditTemplateResult.extenalError
        }
        indeces.sort((a, b) => a.index - b.index)

        var textToEdit = text
        for (let i = 0; i < indeces.length; i++) {
            textToEdit = textToEdit.replace("$" + indeces[i].input, "%param" + (i + 1) + "%")
        }

        try {
            var config = await new SmsConfigRepository().getOTP()
        } catch (error) {
            throw error
        }

        if (config == null) {
            return EditTemplateResult.internalError
        }
        var data = {
            template: editData.template.title,
            message: textToEdit,
            templateid: editData.template.id
        }

        return new Promise((resolve, reject) => {
            request.post('http://api.iransmsservice.com/v2/sms/otp/edit',
                {
                    'headers': {
                        'apikey': config?.config?.apikey,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    form: data,
                }, function (error, response) {

                    if (error) return reject(error);

                    var responseData = JSON.parse(response.body)
                    if (
                        responseData.result == "success " || responseData.result == "success"
                    ) {
                        return resolve(EditTemplateResult.success);
                    }

                    return resolve(EditTemplateResult.internalError);
                })
        })

    }

    static async addTemplate(editData: EditTemplate): Promise<number> {
        var text: string = editData.text
        var inputs = editData.template.inputs

        var indeces: {
            input: string,
            index: number
        }[] = []

        for (let i = 0; i < inputs.length; i++) {
            var index = text.indexOf("$" + inputs[i])
            if (index != -1) {
                indeces.push({
                    input: inputs[i],
                    index: index
                })
            }
        }

        if (indeces.length == 0) {
            throw Error("invalid template")
        }
        indeces.sort((a, b) => a.index - b.index)

        var textToEdit = text
        for (let i = 0; i < indeces.length; i++) {
            textToEdit = textToEdit.replace("$" + indeces[i].input, "%param" + (i + 1) + "%")
        }

        try {
            var config = await new SmsConfigRepository().getOTP()
        } catch (error) {
            throw error
        }

        if (config == null) {
            throw Error("otp not found")
        }
        var data = {
            template: editData.template.title,
            message: textToEdit
            // templateid: editData.template.id
        }

       
        // console.log(data)
        return new Promise((resolve, reject) => {
            request.post('http://api.ghasedaksms.com/v2/sms/otp/create',
                {
                    'headers': {
                        'apikey': config?.config?.apikey,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    form: data,
                }, function (error, response) {
                    if (error) return reject(error);

                    var responseData = JSON.parse(response.body)
                    console.log(response.body ,data)
                    console.log(config?.config?.apikey)
                    if (
                        responseData.result == "success " || responseData.result == "success"
                    ) {
                        return resolve(responseData.templateid);
                    }

                    return reject(new Error(responseData.message));
                })
        })

    }

    static async getTemplateStatus(id: number): Promise<number> {

        try {
            var config = await new SmsConfigRepository().getOTP()
        } catch (error) {
            throw error
        }

        if (config == null) {
            return EditTemplateResult.internalError
        }

        return new Promise((resolve, reject) => {
            request.post('http://api.iransmsservice.com/v2/sms/otp/status',

                {
                    'headers': {
                        'apikey': config?.config?.apikey,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    form: {
                        templateid: id
                    },
                }, function (error, response) {
                    if (error) return reject(error);

                    var responseData = JSON.parse(response.body)

                    if (
                        responseData.result == "success " || responseData.result == "success"
                    ) {
                        return resolve(responseData.status);
                    }

                    return resolve(EditTemplateResult.internalError);
                })
        })


        return 0
    }




    static async getOTPSMSStatus(id: string): Promise<number> {
        try {
            var config = await new SmsConfigRepository().getOTP()
        } catch (error) {
            throw error
        }

        if (config == null) {
            return EditTemplateResult.internalError
        }

        return new Promise((resolve, reject) => {
            request.post('http://api.iransmsservice.com/v2/sms/status',

                {
                    'headers': {
                        'apikey': config?.config?.apikey,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    form: {
                        messageids: id
                    },
                }, function (error, response) {
                    if (error) return reject(error);

                    var responseData = JSON.parse(response.body)

                    if (
                        responseData.result == "success " || responseData.result == "success"
                    ) {
                        return resolve(responseData.list);
                    }

                    return resolve(EditTemplateResult.internalError);
                })
        })

    }

    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "kasbarg",
                error: err
            }
        } as unknown as any
    })
    static async kasbarg(data: {}, config: any): Promise<boolean> {
        // console.log(data,config)

        return new Promise((resolve, reject) => {
            request.post('http://api.iransmsservice.com/v2/sms/send/simple',
                {
                    'headers': {
                        'apikey': config.config?.apikey,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    form: data,
                }, function (error, response) {

                    if (error) {
                        // console.log(error)
                        return reject(error);
                    }

                    try {


                        var responseData = JSON.parse(response.body)
                        // console.log(responseData)

                        if (
                            responseData.result == "success" &&
                            parseInt(responseData.messageids) > 1000
                        ) {
                            return resolve(true);
                        }

                        return resolve(false);
                    } catch (error) {
                        return reject(error)
                    }
                })
        })
    }

    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "farapayamak",
                error: err
            }
        } as unknown as any
    })
    static async farapayamak(data: any, config: any) {

        return new Promise((resolve, reject) => {
            request.post('http://rest.payamak-panel.com/api/SendSMS/SendSMS',
                {
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
                    var responseData = JSON.parse(response.body)

                    if (
                        responseData.result == "success" &&
                        parseInt(responseData.messageids) > 1000
                    ) {
                        return resolve(true);
                    }

                    return resolve(false);
                })
        })
    }

    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "mellipayamak",
                error: err
            }
        } as unknown as any
    })
    static async mellipayamak(data: any, config: any): Promise<boolean> {
        // console.log(data, config)
        return new Promise((resolve, reject) => {
            request.post('https://rest.payamak-panel.com/api/SendSMS/SendSMS',
                {
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
                    var responseData = JSON.parse(response.body)

                    if (
                        responseData["RetStatus"] == 1
                    ) {
                        return resolve(true);
                    }
                    try {
                        var err = new Error(JSON.stringify(responseData))
                        // console.log(err)
                        return reject(err);

                    } catch (error) {
                        reject(error)
                    }
                })
        })
    }

    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "sabapayamak",
                error: err
            }
        } as unknown as any
    })
    static async sabapayamak(data: any, config: any): Promise<boolean> {
        if (config.config.token) {
            try {
                if (await new Promise((resolve, reject) => {
                    request.post('https://api.sabapayamak.com/api/v1/message',
                        {
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
                            var responseData = JSON.parse(response.body)

                            if (
                                responseData.status == 200
                            ) {
                                return resolve(true);
                            }
                            true
                            return resolve(false);
                        })
                })) {
                    return true
                }
                else {
                    try {
                        var result: any = await new Promise((resolve, reject) => {
                            request.post('https://api.sabapayamak.com/api/v1/user/authenticate',
                                {
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
                                    var responseData = JSON.parse(response.body)

                                    if (responseData["status"] != 200) {
                                        return reject(new Error(JSON.stringify(responseData)));
                                    }

                                    return resolve(responseData);
                                })
                        })
                    } catch (error) {
                        throw error
                    }
                    await new SmsConfigRepository().findByIdAndUpdate(config._id, {
                        $set: {
                            "config.token": result.data["token"]
                        }
                    })
                    try {
                        return await new Promise((resolve, reject) => {
                            request.post('https://api.sabapayamak.com/api/v1/message',
                                {
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
                                    var responseData = JSON.parse(response.body)
                                    // console.log(responseData)

                                    if (
                                        responseData.status == 200
                                    ) {
                                        return resolve(true);
                                    }

                                    return reject(new Error(JSON.stringify(responseData)));
                                })
                        }) == true
                    } catch (error) {
                        throw error
                    }

                }
            } catch (error) {
                throw error
            }
        }
        else {
            try {
                var result: any = await new Promise((resolve, reject) => {
                    request.post('https://api.sabapayamak.com/api/v1/user/authenticate',
                        {
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
                            var responseData = JSON.parse(response.body)
                            if (responseData["status"] != 200) {
                                return reject(new Error(JSON.stringify(responseData)));
                            }

                            return resolve(true);
                        })
                })
            } catch (error) {
                throw error
            }
            await new SmsConfigRepository().findByIdAndUpdate(config._id, {
                $set: {
                    "config.token": result.data["token"]
                }
            })
            try {
                return await new Promise((resolve, reject) => {
                    request.post('https://api.sabapayamak.com/api/v1/message',
                        {
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
                            var responseData = JSON.parse(response.body)

                            if (
                                responseData.status == 200
                            ) {
                                return resolve(true);
                            }

                            return reject(new Error(JSON.stringify(responseData)));
                        })
                }) == true
            } catch (error) {
                throw error
            }
        }
    }

    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "kavenegar",
                error: err
            }
        } as unknown as any
    })
    static async kavenegar(data: any, config: any): Promise<boolean> {
        var api = kavenegar.KavenegarApi({ apikey: config.config.apikey })
        return new Promise((resolve, reject) => {
            api.Send({ message: data.message, sender: config.lineNumber, receptor: data.receptor }
                , function (response: any, status: any) {
                    // if (response) {
                    //     return resolve(response)
                    // }
                    if (status != 200) {
                        reject(new Error(status))
                    }
                    resolve(true)
                })
        })

    }

    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "payamResan",
                error: err
            }
        } as unknown as any
    })
    static async payamResan(data: any, config: any): Promise<boolean> {
        var createClient = promisify(soap.createClient)
        try {
            var client: soap.Client = await createClient("https://www.payam-resan.com/ws/v2/ws.asmx?WSDL") as soap.Client
            return new Promise((resolve, reject) => {
                client.SendMessage({
                    'Username': config.config.userName,
                    'PassWord': config.config.password,
                    'SenderNumber': config.lineNumber,
                    'RecipientNumbers': [data.receptor],
                    'MessageBodie': data.message,
                    'Type': 1,
                    'AllowedDelay': 0
                }, function (error: any, response: any) {
                    if (error) {
                        return reject(error)
                    }
                    return resolve(response)
                })

            })
        } catch (error) {
            return false
        }

    }

    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "sms",
                error: err
            }
        } as unknown as any
    })
    static async sms(data: any, config: any) {
        if (config.config.token) {
            try {
                if (await new Promise((resolve, reject) => {
                    request.post('https://RestfulSms.com/api/MessageSend',
                        {
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
                            var responseData = JSON.parse(response.body)
                            try {
                                responseData = JSON.parse(responseData)
                            } catch (error) {

                            }
                            // console.log(responseData)
                            if (
                                responseData.IsSuccessful == true
                            ) {
                                return resolve(true);
                            }

                            return resolve(false);
                        })
                })) {
                    return true
                }
                else {
                    try {
                        var result: any = await new Promise((resolve, reject) => {
                            request.post('https://RestfulSms.com/api/Token',
                                {
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
                                    var responseData = JSON.parse(response.body)

                                    if (responseData["IsSuccessful"] != true) {
                                        return reject(new Error(JSON.stringify(responseData)));
                                    }

                                    return resolve(true);
                                })
                        })
                    } catch (error) {
                        throw error
                    }
                    await new SmsConfigRepository().findByIdAndUpdate(config._id, {
                        $set: {
                            "config.token": result.TokenKey
                        }
                    })
                    try {
                        return await new Promise((resolve, reject) => {
                            request.post('https://RestfulSms.com/api/MessageSend',
                                {
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
                                    var responseData = JSON.parse(response.body)

                                    if (responseData["IsSuccessful"] != true) {
                                        return reject(new Error(JSON.stringify(responseData)));
                                    }

                                    return resolve(true);
                                })
                        }) == true
                    } catch (error) {
                        throw error
                    }

                }
            } catch (error) {
                throw error
            }
        }
        else {
            try {
                var result: any = await new Promise((resolve, reject) => {
                    request.post('https://RestfulSms.com/api/Token',
                        {
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
                            var responseData = JSON.parse(response.body)

                            if (responseData["IsSuccessful"] != true) {
                                return reject(new Error(JSON.stringify(responseData)));
                            }

                            return resolve(true);
                        })
                })
            } catch (error) {
                throw error
            }
            await new SmsConfigRepository().findByIdAndUpdate(config._id, {
                $set: {
                    "config.token": result.TokenKey
                }
            })
            try {
                return await new Promise((resolve, reject) => {
                    request.post('https://RestfulSms.com/api/MessageSend',
                        {
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
                            var responseData = JSON.parse(response.body)


                            if (responseData["IsSuccessful"] != true) {
                                return reject(new Error(JSON.stringify(responseData)));
                            }

                            return resolve(true);
                        })
                }) == true
            } catch (error) {
                throw error
            }
        }
    }

    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "mediapayamak",
                error: err
            }
        } as unknown as any
    })
    static async mediapayamak(data: any, config: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            request.post('http://tablig724.ir/SMSInOutBox/Send',
                {
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
                    var responseData = response.body
                    if (
                        responseData > 1000
                    ) {
                        return resolve(true);
                    }

                    return resolve(false);
                })
        })
    }

    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "parsgreen",
                error: err
            }
        } as unknown as any
    })
    static async parsgreen(data: any, config: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            request.post('https://sms.parsgreen.ir/Apiv2/Message/SendSms',
                {
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
                    var responseData = response.body
                    try {
                        responseData = JSON.parse(responseData)
                    } catch (error) {

                    }

                    if (
                        responseData["R_Success"]
                    ) {
                        return resolve(true);
                    }

                    return reject(new Error(JSON.stringify(responseData)));
                })
        })
    }

    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "hiroSms",
                error: err
            }
        } as unknown as any
    })
    static async hiroSms(data: any, config: any): Promise<boolean> {

        return new Promise((resolve, reject) => {
            request.post('http://ippanel.com/api/select',
                {
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
                    var responseData = response.body

                    if (
                        responseData["R_Success"]
                    ) {
                        return resolve(true);
                    }
                    try {
                        var err = new Error(JSON.stringify(responseData))
                        return reject(err);

                    } catch (error) {
                        return reject(error)
                    }

                })
        })
    }

    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "niksms",
                error: err
            }
        } as unknown as any
    })
    static async niksms(data: any, config: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            soap.createClient("http://niksms.com:1370/NiksmsWebservice.svc?wsdl", async function (err, client) {
                if (err) {
                    return resolve(false)
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
                        client.PtpSms(ptpModel, function (err: any, result: any, body: any) {
                            if (err) {
                                return reject(err)
                            }
                            if (result.PtpSmsResult.Status == "Successful") {
                                return resolve(true)
                            }

                            return reject(new Error(JSON.stringify(result.PtpSmsResult)))
                        })
                    })
                } catch (error) {
                    return reject(error)
                }

            })
        })
    }

    @logSystemError((err: Error) => {
        return {
            part: "sms",
            error: err.message,
            isCritical: false,
            otherInfo: {
                service: "smspanel",
                error: err
            }
        } as unknown as any
    })
    static async smspanel(data: any, config: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            request.post('http://www.smspanel.trez.ir/api/smsAPI/SendMessage',
                {
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
                    var responseData = response.body
                    try {
                        responseData = JSON.parse(responseData)
                    } catch (error) {

                    }
                    if (
                        responseData["Code"] == 0
                    ) {

                        return resolve(true);
                    }

                    return reject(new Error(responseData));
                })
        })
    }

}