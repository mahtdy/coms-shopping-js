"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAdminNeedCaptcha = checkAdminNeedCaptcha;
exports.alertWrongLogIn = alertWrongLogIn;
exports.checkAdminBlock = checkAdminBlock;
const request_1 = __importDefault(require("request"));
const repository_1 = __importDefault(require("../../repositories/system/repository"));
const smsMessager_1 = __importDefault(require("../../../messaging/smsMessager"));
const repository_2 = __importDefault(require("../../repositories/blocklist/repository"));
function checkAdminNeedCaptcha(sessionIndex) {
    return (target, propertyKey, propertyDescriptor) => {
        propertyDescriptor = propertyDescriptor;
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            try {
                var session = args[sessionIndex];
                var result = await originalMethod.apply(this, args);
                return result;
                if (session["sendCaptcha"]) {
                    var secret_key = "";
                    try {
                        return await new Promise((resolve, reject) => {
                            request_1.default.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${args[0].body.token}`, {
                                'headers': {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({}),
                            }, async function (error, response) {
                                if (error) {
                                    return resolve(await originalMethod.apply(this, args));
                                }
                                var responseData = JSON.parse(response.body);
                                if (responseData.success) {
                                    return resolve(await originalMethod.apply(this, args));
                                }
                                else {
                                    return resolve({
                                        status: 400,
                                        message: "کپتچا ارسال شود",
                                        data: {
                                            sendCaptcha: true
                                        }
                                    });
                                }
                            });
                        });
                    }
                    catch (error) {
                    }
                }
                else {
                    return await originalMethod.apply(this, args);
                }
            }
            catch (err) {
                throw err;
            }
        };
        Object.defineProperty(propertyDescriptor.value, 'name', {
            writable: true,
            value: propertyKey
        });
        return propertyDescriptor;
    };
}
function alertWrongLogIn(sessionIndex) {
    return (target, propertyKey, propertyDescriptor) => {
        propertyDescriptor = propertyDescriptor;
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            try {
                var result = await originalMethod.apply(this, args);
                var session = args[sessionIndex];
                if (result != undefined) {
                    var systemConfig = new repository_1.default();
                    if (result.status == 401 || result.status == 403) {
                        if (await systemConfig.isExists({
                            key: "admin-wrong-login-send-sms",
                            value: true
                        })) {
                            var admin = await this.adminRepository.findById(session["adminId"], {
                                phoneNumber: 1
                            });
                            try {
                                smsMessager_1.default.send({
                                    parameters: {
                                        date: new Date().toLocaleString("fa-IR")
                                    },
                                    receptor: admin.phoneNumber,
                                    template: "alertWrongLogIn"
                                });
                            }
                            catch (error) {
                                // return
                            }
                        }
                        if (await systemConfig.isExists({
                            key: "admin-wrong-login-send-email",
                            value: true
                        })) {
                        }
                    }
                }
                return result;
            }
            catch (err) {
                throw err;
            }
        };
        Object.defineProperty(propertyDescriptor.value, 'name', {
            writable: true,
            value: propertyKey
        });
        return propertyDescriptor;
    };
}
function checkAdminBlock(sessionIndex) {
    return (target, propertyKey, propertyDescriptor) => {
        propertyDescriptor = propertyDescriptor;
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            try {
                var session = args[sessionIndex];
                var blockList = await new repository_2.default().findOne({
                    id: session["adminId"],
                    expireDate: {
                        $gte: new Date()
                    },
                    owner: "admin"
                });
                if (blockList != null) {
                    return {
                        status: 403,
                        data: {
                            expireDate: blockList.expireDate
                        },
                        message: "شما بلاک هستید"
                    };
                }
                var result = await originalMethod.apply(this, args);
                return result;
            }
            catch (err) {
                throw err;
            }
        };
        Object.defineProperty(propertyDescriptor.value, 'name', {
            writable: true,
            value: propertyKey
        });
        return propertyDescriptor;
    };
}
