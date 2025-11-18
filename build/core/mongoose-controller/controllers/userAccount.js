"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parameters_1 = require("../../decorators/parameters");
const controller_1 = __importDefault(require("../controller"));
const method_1 = require("../../decorators/method");
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const zod_1 = require("zod");
const random_1 = __importDefault(require("../../random"));
const smsMessager_1 = __importDefault(require("../../messaging/smsMessager"));
const emailMessager_1 = __importDefault(require("../../messaging/emailMessager"));
const cache_1 = __importDefault(require("../../cache"));
class AccountController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.cacheService = new cache_1.default("socket_data");
    }
    async getInfo(user) {
        return this.findById(user.id || "", {
            projection: {
                _id: 1,
                name: 1,
                family: 1,
                email: 1,
                phoneNumber: 1,
                towFactorLogIn: 1,
                address: 1,
                image: 1,
                isEmailRegistered: 1,
                wallet: 1
            }
        });
    }
    async refreshTowFactor(userInfo) {
        try {
            var user = await this.repository.findById(userInfo.id);
        }
        catch (error) {
            throw error;
        }
        if (user == null) {
            return {
                status: 404,
                message: "موردی یافت نشد"
            };
        }
        var secret = speakeasy_1.default.generateSecret({ length: 20 });
        try {
            var result = await this.repository.findByIdAndUpdate(userInfo.id, {
                $set: {
                    towFactorTocken: secret.ascii
                }
            });
        }
        catch (error) {
            throw error;
        }
        return new Promise((resolve, reject) => {
            qrcode_1.default.toDataURL(secret.otpauth_url, function (err, image_data) {
                if (err) {
                    return reject(err);
                }
                return {
                    status: 200,
                    data: image_data
                };
            });
        });
    }
    // verify tow factor change
    async verifyTowFactor(code, userInfo, session) {
        var ascii = session['account'];
        try {
            var user = await this.repository.findById(userInfo.id || "");
        }
        catch (error) {
            throw error;
        }
        //user exists
        if (user == null) {
            return {
                status: 404
                // data
            };
        }
        // check ascii of 2fA is in session 
        if (ascii == undefined) {
            return {
                status: 400,
                message: "ابتدا کد دوعاملی را بسازید"
            };
        }
        // is tow factor login enabled
        if (!user.towFactorLogIn) {
            return {
                status: 400,
                message: "ورود دو مرحله ای برای شما غیرفعال است"
            };
        }
        //check code is right
        let verifed = speakeasy_1.default.totp.verify({
            secret: ascii,
            encoding: "ascii",
            token: code
        });
        if (!verifed) {
            return {
                status: 400,
                message: "کد دوعاملی اشتباه است"
            };
        }
        return this.editById(user._id, {
            $set: {
                towFactorTocken: ascii
            }
        }, {
            ok: true
        });
    }
    async enableTowFactor(userInfo) {
        try {
            var user = await this.repository.findById(userInfo.id);
        }
        catch (error) {
            // next(error)
            throw error;
        }
        //user exists
        if (user == null) {
            return {
                status: 404
            };
        }
        // is tow factor login already enabled
        if (user.towFactorLogIn == true) {
            return {
                status: 400,
                message: "ورود دو مرحله ای برای شما فعال است"
            };
        }
        return this.editById(user._id, {
            $set: {
                towFactorLogIn: true
            }
        }, {
            ok: true
        });
    }
    async disableTowFactor(userInfo, session, code, way) {
        try {
            var user = await this.repository.findById(userInfo.id || "", {
                projection: {
                    password: 1
                }
            });
        }
        catch (error) {
            throw error;
        }
        //user exists
        if (user == null) {
            return {
                status: 404
            };
        }
        // is tow factor login already disabled
        if (user.towFactorLogIn != true) {
            return {
                status: 400,
                message: "ورود دو مرحله ای برای شما غیرفعال است"
            };
        }
        // have tow factor tocken
        if (user.towFactorTocken) {
            //verify disable with 2f code
            if (code) {
                let verifed = speakeasy_1.default.totp.verify({
                    secret: user.towFactorTocken,
                    encoding: "ascii",
                    token: code
                });
                if (verifed) {
                    return await this.editById(user._id, {
                        $set: {
                            towFactorLogIn: false
                        },
                        $unset: {
                            towFactorTocken: 1
                        }
                    }, {
                        ok: true
                    });
                }
                else {
                    return {
                        status: 400,
                        message: "عملیات غیر مجاز"
                    };
                }
            }
            //verify disable with sending sms or email
            else if (way) {
                let random = random_1.default.randomNumber();
                try {
                    var result = false;
                    if (way == "phone") {
                        result = await smsMessager_1.default.send({
                            template: "disableTowFactorCodeUser",
                            receptor: user.phoneNumber,
                            parameters: {
                                name: user.name,
                                random: random
                            }
                        });
                    }
                    if (way == "email") {
                        result = await emailMessager_1.default.send({
                            template: "disableTowFactorCodeUser",
                            receptor: user.email,
                            parameters: {
                                random: random
                            }
                        });
                    }
                    if (result) {
                        session["disableTowFactorRandom"] = random;
                        session["disableTowFactorExpire"] = new Date(Date.now() + 120000);
                        return {
                            status: 200,
                            message: "کد ارسال شد",
                            session
                        };
                    }
                    return {
                        status: 500,
                        message: "مشکلی رخ داده است لطفا بعدا دوباره امتحان کنید"
                    };
                }
                catch (error) {
                    throw error;
                }
            }
            else {
                return {
                    status: 400,
                    message: "عملیات غیر مجاز"
                };
            }
        }
        else {
            return this.editById(user._id, {
                $set: {
                    towFactorLogIn: false
                },
                $unset: {
                    towFactorTocken: 1
                }
            }, {
                ok: true
            });
        }
    }
    async verifyDisableTowFactor(code, session, userInfo) {
        try {
            var user = await this.repository.findById(userInfo.id || "");
        }
        catch (error) {
            throw error;
        }
        //user exists
        if (user == null) {
            return {
                status: 404
            };
        }
        // check random sent from sms or email
        var random = session["disableTowFactorRandom"];
        if (random == code) {
            return await this.editById(user._id, {
                $set: {
                    towFactorLogIn: false
                },
                $unset: {
                    towFactorTocken: 1
                }
            }, {
                ok: true
            });
        }
        else {
            return {
                status: 400,
                message: "عملیات غیر مجاز"
            };
        }
    }
    async changePassword(oldPassword, password, userInfo) {
        try {
            var user = await this.repository.findOne({
                _id: userInfo.id
            }, {
                projection: {
                    password: 1,
                    name: 1,
                    family: 1,
                    email: 1,
                    phoneNumber: 1,
                    changePassword: 1
                },
                fromDb: true
            });
            if (user == null) {
                return {
                    status: 404
                };
            }
            let isPasswordCorrect = await this.repository.comparePassword(user, oldPassword);
            if (isPasswordCorrect != true) {
                return {
                    status: 400,
                    message: "رمز قبلی اشتباه است"
                };
            }
            //change password (and hash)
            await this.repository.changePassword(user._id, password);
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200,
            message: "رمز شما با موفقیت تغییر یافت"
        };
    }
    async checkPassword(password, userInfo) {
        try {
            // var user = await this.repository.findById(userInfo.id || "")
            var user = await this.repository.findOne({
                _id: userInfo.id
            }, {
                projection: {
                    password: 1,
                    name: 1,
                    family: 1,
                    email: 1,
                    phoneNumber: 1,
                    changePassword: 1
                },
                fromDb: true
            });
            if (user == null) {
                return {
                    status: 404
                };
            }
            let isPasswordCorrect = await this.repository.comparePassword(user, password);
            if (isPasswordCorrect != true) {
                return {
                    status: 400,
                    message: "رمز قبلی اشتباه است"
                };
            }
            return {
                status: 200,
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async editEmail(email, userInfo, session) {
        try {
            var user = await this.repository.findById(userInfo.id || "");
            //user exists
            if (user == null) {
                return {
                    status: 404
                };
            }
            //check is email exists in another accounts
            if (await this.repository.isExists({
                _id: {
                    $ne: user._id
                },
                email
            })) {
                return {
                    status: 400,
                    message: "ایمیل وارد شده تکراری است"
                };
            }
            var query = {};
            var code = random_1.default.randomNumber();
            var parameters = {};
            parameters["name"] = user.name;
            parameters["random"] = code;
            var template = "submitEmailUser";
            session['userNewRandom'] = code;
            session['userExpiresRandom'] = new Date(Date.now() + 120000);
            session["updateEmail"] = email;
            try {
                var result = await emailMessager_1.default.send({
                    template,
                    parameters,
                    receptor: user.email
                });
                if (result == false) {
                    return {
                        status: 500,
                        message: "مشکلی در سرور رخ داده"
                    };
                }
                return {
                    status: 200
                };
            }
            catch (error) {
                throw error;
            }
        }
        catch (error) {
            throw error;
        }
    }
    async submitEmail(userInfo, random, session) {
        try {
            var user = await this.repository.findById(userInfo.id);
        }
        catch (error) {
            throw error;
        }
        //user exists
        if (user == null) {
            return {
                status: 404
            };
        }
        var userRandom = session["userNewRandom"];
        if (!userRandom || new Date() > session["userExpiresRandom"]) {
            return {
                status: 400,
                message: "سشن شما از بین رفته لطفا دوباره امتحان کنید"
            };
        }
        var query = {};
        if (random != userRandom) {
            return {
                status: 400,
                message: "کد وارد شده اشتباه است"
            };
        }
        session["confirmedEmail"] = session["updateEmail"];
        return {
            status: 200,
            data: {},
            session
        };
    }
    async editPhoneNumber(phoneNumber, session, userInfo) {
        try {
            var user = await this.repository.findById(userInfo.id || "");
            if (user == null) {
                return {
                    status: 404,
                    message: "موردی یافت نشد"
                };
            }
            //check is phoneNumber exists in another accounts
            if (await this.repository.isExists({
                _id: {
                    $ne: user._id
                },
                phoneNumber
            })) {
                return {
                    status: 400,
                    message: "شماره تلفن تکراری است"
                };
            }
            var random = random_1.default.randomNumber();
            var result = await smsMessager_1.default.send({
                parameters: {
                    name: user.name,
                    random,
                    phoneNumber
                },
                receptor: user.phoneNumber,
                template: "changePhoneChekUser"
            });
            if (result) {
                session['userNewPhoneNumber'] = phoneNumber,
                    session['userNewRandom'] = random,
                    session['userExpiresRandom'] = new Date(Date.now() + 120000);
                return {
                    status: 200,
                    session,
                    message: "عملیات موفق"
                };
            }
            return {
                status: 500,
                message: "مشکلی در سرور رخ داده"
            };
        }
        catch (error) {
            throw error;
        }
    }
    async confirmPhoneNumber(random, session, userInfo) {
        var userRandom = session["userNewRandom"];
        var user = await this.repository.findById(userInfo.id || "");
        //user exists
        if (user == null) {
            return {
                status: 404,
                message: "موردی یافت نشد"
            };
        }
        //check user expiration
        if (!userRandom || new Date() > session["userExpiresRandom"]) {
            return {
                status: 400,
                message: "سشن شما از بین رفته لطفا دوباره امتحان کنید"
            };
        }
        // check random 
        if (random != userRandom) {
            return {
                status: 400,
                message: "کد وارد شده اشتباه است"
            };
        }
        session["confirmedPhoneNumber"] = session["userNewPhoneNumber"];
        return {
            status: 200,
            data: {},
            session
        };
        // return this.editById(user._id, {
        //     $set: {
        //         phoneNumber: session["userNewPhoneNumber"]
        //     }
        // }, {
        //     ok: true
        // })
    }
    async profileSetting(data, session, userInfo) {
        try {
            if (session["confirmedPhoneNumber"] == undefined || session["confirmedPhoneNumber"] != data.phone) {
                delete data["phone"];
            }
            if (session["confirmedEmail"] == undefined || session["confirmedEmail"] != data.email) {
                delete data["email"];
            }
            else {
                data["isEmailRegistered"] = true;
            }
            console.log(session["confirmedPhoneNumber"], data);
            return await this.editById(userInfo.id, {
                $set: data
            }, {
                ok: true
            });
        }
        catch (error) {
            throw error;
        }
    }
    async checkEmail(email, userInfo) {
        return this.checkExists({
            "_id": {
                $ne: userInfo.id
            },
            email
        });
    }
    async getChatToken(userInfo) {
        try {
            var user = await this.repository.findById(userInfo.id);
            if (user != null) {
                var token = await random_1.default.generateToken();
                await this.cacheService.setWithTtl(token, {
                    name: user.name,
                    family: user.family,
                    phoneNumber: user.phoneNumber
                }, 2 * 60);
                return {
                    status: 200,
                    data: token
                };
            }
            else {
                return {
                    status: 400,
                    message: "دیتای نامعتبر"
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
    initApis() {
    }
}
exports.default = AccountController;
__decorate([
    (0, method_1.Get)("/info", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.User)())
], AccountController.prototype, "getInfo", null);
__decorate([
    (0, method_1.Post)("/towFactor/refresh", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.User)())
], AccountController.prototype, "refreshTowFactor", null);
__decorate([
    (0, method_1.Post)("/towFactor/verify", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "code",
        schema: controller_1.default.totp
    })),
    __param(1, (0, parameters_1.User)()),
    __param(2, (0, parameters_1.Session)())
], AccountController.prototype, "verifyTowFactor", null);
__decorate([
    (0, method_1.Post)("/towFactor/enable", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.User)())
], AccountController.prototype, "enableTowFactor", null);
__decorate([
    (0, method_1.Post)("/towFactor/disable", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.User)()),
    __param(1, (0, parameters_1.Session)()),
    __param(2, (0, parameters_1.Body)({
        destination: "code",
        schema: controller_1.default.totp.optional()
    })),
    __param(3, (0, parameters_1.Body)({
        destination: "code",
        schema: zod_1.z.enum([""])
    }))
], AccountController.prototype, "disableTowFactor", null);
__decorate([
    (0, method_1.Post)("/towFactor/disable/verify", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.Body)({ destination: "code", schema: controller_1.default.random })),
    __param(1, (0, parameters_1.Session)()),
    __param(2, (0, parameters_1.User)())
], AccountController.prototype, "verifyDisableTowFactor", null);
__decorate([
    (0, method_1.Put)("/password", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "oldPassword",
        schema: zod_1.z.string().min(8)
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "password",
        schema: zod_1.z.string().min(8)
    })),
    __param(2, (0, parameters_1.User)())
], AccountController.prototype, "changePassword", null);
__decorate([
    (0, method_1.Post)("/password/check", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "password",
        schema: zod_1.z.string().min(8)
    })),
    __param(1, (0, parameters_1.User)())
], AccountController.prototype, "checkPassword", null);
__decorate([
    (0, method_1.Put)("/email", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "email",
        schema: controller_1.default.email
    })),
    __param(1, (0, parameters_1.User)()),
    __param(2, (0, parameters_1.Session)())
], AccountController.prototype, "editEmail", null);
__decorate([
    (0, method_1.Post)("/email/confirm", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.User)()),
    __param(1, (0, parameters_1.Body)({
        destination: "code",
        schema: controller_1.default.random
    })),
    __param(2, (0, parameters_1.Session)())
], AccountController.prototype, "submitEmail", null);
__decorate([
    (0, method_1.Put)("/phoneNumber", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "phoneNumber",
        schema: controller_1.default.phone
    })),
    __param(1, (0, parameters_1.Session)()),
    __param(2, (0, parameters_1.User)())
], AccountController.prototype, "editPhoneNumber", null);
__decorate([
    (0, method_1.Post)("/phoneNumber/confirm", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "random",
        schema: controller_1.default.random
    })),
    __param(1, (0, parameters_1.Session)()),
    __param(2, (0, parameters_1.User)())
], AccountController.prototype, "confirmPhoneNumber", null);
__decorate([
    (0, method_1.Put)("/profile", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.z.object({
            phoneNumber: controller_1.default.phone,
            email: controller_1.default.email,
            name: zod_1.z.string(),
            family: zod_1.z.string()
        })
    })),
    __param(1, (0, parameters_1.Session)()),
    __param(2, (0, parameters_1.User)())
], AccountController.prototype, "profileSetting", null);
__decorate([
    (0, method_1.Get)("/email", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.Query)({
        destination: "email",
        schema: controller_1.default.email
    })),
    __param(1, (0, parameters_1.User)())
], AccountController.prototype, "checkEmail", null);
__decorate([
    (0, method_1.Post)("/chat/token", {
        apiDoc: {
            security: [{
                    BasicAuth: []
                }]
        }
    }),
    __param(0, (0, parameters_1.User)())
], AccountController.prototype, "getChatToken", null);
// Swageer.getInstance().addComponent()
