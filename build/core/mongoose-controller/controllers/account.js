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
const smsMessager_1 = __importDefault(require("../../messaging/smsMessager"));
const emailMessager_1 = __importDefault(require("../../messaging/emailMessager"));
const qrcode_1 = __importDefault(require("qrcode"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const controller_1 = __importDefault(require("../controller"));
const util_1 = require("util");
const random_1 = __importDefault(require("../../random"));
const parameters_1 = require("../../decorators/parameters");
const zod_1 = require("zod");
const method_1 = require("../../decorators/method");
const repository_1 = __importDefault(require("../repositories/language/repository"));
var toDataURL = (0, util_1.promisify)(qrcode_1.default.toDataURL);
class AdminAccount extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.languageRepo = new repository_1.default();
    }
    async setPaswword(password, admin, session) {
        try {
            var verifed = await this.repository.comparePassword(admin, password);
            if (verifed) {
                var expired = Date.now() + (1000 * 300);
                session["secirity_expired"] = [expired];
                return {
                    status: 200,
                    data: { expired },
                    message: "موفق",
                    session
                };
            }
            else {
                return {
                    status: 400,
                    message: "رمز غلط"
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
    checkPasswordExpired(session) {
        var expired = session["secirity_expired"];
        if (!expired || expired < Date.now()) {
            return {
                status: 403,
                data: { sendPassword: true },
                message: "عدم دسترسی"
            };
        }
        return {
            next: true
        };
    }
    getPasswordExpired(session) {
        var expired = session['secirity_expired'];
        if (!expired || expired < Date.now()) {
            return {
                status: 403,
                message: "عدم دسترسی",
                data: { sendPassword: true }
            };
        }
        return {
            status: 200,
            data: { expired }
        };
    }
    // async getAdminInfo(req: Request, res: Response, next: NextFunction): Promise<Response | undefined> {
    //     var adminInfo = SessionHandler.get(req, "admin")
    //     if (adminInfo != undefined && adminInfo["_id"] != undefined) {
    //         var admin = await this.repository.findById(adminInfo["_id"])
    //         if (admin == null) {
    //             return new ApiResponse.ForbiddenResponse("عدم دسترسی", {}).send(res)
    //         }
    //         req.adminInfo = admin
    //         next()
    //     } else {
    //         return new ApiResponse.ForbiddenResponse("عدم دسترسی", {}).send(res)
    //     }
    // }
    async getProfile(admin) {
        // console.log(admin)
        return super.findById(admin._id, {
            projection: {
                "_id": 1,
                "towFactorEnable": 1,
                "phoneNumber": 1,
                "phoneRegistered": 1,
                isSuperAdmin: 1,
                "email": 1,
                "isEmailRegistered": 1,
                "towFactorLogIn": 1,
                "name": 1,
                "familyName": 1,
                "image": 1,
                "passwordLastChange": 1,
                "securityQuestion": 1,
                "validIPList": 1
            }
        });
    }
    async setLanguage(session, language) {
        try {
            let isExists = await this.languageRepo.isExists({
                _id: language
            });
            if (!isExists) {
                return {
                    status: 404,
                    message: "زبان یافت نشد"
                };
            }
            session.language = language;
            return {
                session,
                status: 200,
                message: "عملیات موفق"
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getLanguage(session) {
        return {
            data: session.language
        };
    }
    async changePassword(password, admin) {
        try {
            var admin = await this.repository.changePassword(admin._id, password);
        }
        catch (error) {
            throw error;
        }
        if (admin == null) {
            return {
                status: 400,
                message: "کاربری با اطلاعات وارد شده یافت نشد"
            };
        }
        return {
            status: 200,
            message: "رمز شما با موفقیت تغییر یافت"
        };
    }
    async toggleTwoFactor(adminInfo) {
        try {
            var admin = await this.repository.findById(adminInfo._id, {
                projection: {
                    towFactorEnable: 1,
                    phoneRegistered: 1,
                    _id: 1
                }
            });
            if (admin == null) {
                return {
                    status: 400,
                    message: "کاربری با اطلاعات وارد شده یافت نشد"
                };
            }
            if (admin.towFactorEnable) {
                return super.editById(admin === null || admin === void 0 ? void 0 : admin._id, {
                    $set: {
                        towFactorEnable: false
                    }
                }, {
                    ok: true
                });
            }
            else {
                if (admin.phoneRegistered != true) {
                    return {
                        status: 400,
                        message: "ابتدا شماره تلفن خود را تایید کنید"
                    };
                }
                return super.editById(admin === null || admin === void 0 ? void 0 : admin._id, {
                    $set: {
                        towFactorEnable: true
                    }
                }, {
                    ok: true
                });
            }
        }
        catch (error) {
            throw error;
        }
    }
    async verifyPhoneNumber(phoneNumber, adminInfo, session) {
        try {
            var admin = await this.repository.findById(adminInfo._id);
            if (admin == null) {
                return {
                    status: 400,
                    message: "کاربری با اطلاعات وارد شده یافت نشد"
                };
            }
            if (phoneNumber) {
                var isExists = await this.repository.isExists({
                    _id: {
                        $ne: admin._id
                    },
                    phoneNumber: {
                        $eq: phoneNumber
                    }
                });
                if (isExists) {
                    return {
                        status: 400,
                        message: "شماره تلفن تکراری"
                    };
                }
            }
            else {
                if (admin.phoneRegistered) {
                    return {
                        status: 400,
                        message: "این شماره تلفن قبلا تایید شده است"
                    };
                }
                phoneNumber = admin.phoneNumber;
            }
            var random = random_1.default.randomNumber();
            var result = await smsMessager_1.default.send({
                template: "adminAddPhone",
                receptor: phoneNumber,
                parameters: {
                    random: random,
                    name: admin.name
                }
            });
            if (result == false) {
                throw new Error("sms error");
            }
            session["adminNewPhoneNumber"] = phoneNumber;
            session["phoneVerifyRandom"] = random;
            return {
                status: 200,
                message: "موفق"
            };
        }
        catch (error) {
            throw error;
        }
    }
    async confirmVerifyPhoneNumber(random, admin, session) {
        var adminRandom = session["phoneVerifyRandom"];
        if (random != adminRandom) {
            return {
                status: 400,
                message: "کد وارد شده اشتباه است"
            };
        }
        return super.editById(admin._id, {
            $set: {
                phoneNumber: session["adminNewPhoneNumber"],
                phoneRegistered: true
            }
        }, {
            ok: true
        });
    }
    async verifyEmail(email, admin, session) {
        try {
            if (email) {
                var isExists = await this.repository.isExists({
                    _id: {
                        $ne: admin._id
                    },
                    email: {
                        $eq: email
                    }
                });
                if (isExists) {
                    return {
                        status: 400,
                        message: "ایمیل تکراری"
                    };
                }
            }
            else {
                if (admin.isEmailRegistered) {
                    return {
                        status: 400,
                        message: "این ایمیل قبلا تایید شده است"
                    };
                }
                email = admin.email;
            }
            var random = random_1.default.randomNumber();
            var result = await emailMessager_1.default.send({
                receptor: email,
                parameters: {
                    random: random,
                    name: admin.name
                },
                template: "adminAddPhone"
            });
            if (result == false) {
                throw new Error("sms error");
            }
            session['adminNewEmail'] = email;
            session['emailVerifyRandom'] = random;
            return {
                status: 200,
                session,
                message: "موفق"
            };
        }
        catch (error) {
            throw error;
        }
    }
    async confirmVerifyEmail(random, admin, session) {
        var adminRandom = session["emailVerifyRandom"];
        if (random != adminRandom) {
            return {
                status: 400,
                message: "کد وارد شده اشتباه است"
            };
        }
        return super.editById(admin._id, {
            $set: {
                email: session["adminNewEmail"],
                isEmailRegistered: true
            }
        }, {
            ok: true
        });
    }
    async refreshTowFactor(session) {
        var secret = speakeasy_1.default.generateSecret({ length: 20 });
        var image = await toDataURL(secret.otpauth_url);
        session["ascii"] = secret.ascii;
        return {
            status: 200,
            message: "عملیات موفق",
            data: {
                image,
                ascii: secret.ascii
            }
        };
    }
    async verifyTowFactor(code, admin, session) {
        var ascii = session["ascii"];
        if (ascii == undefined) {
            return {
                status: 400,
                message: "ابتدا کد دوعاملی را بسازید"
            };
        }
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
        return super.editById(admin._id, {
            $set: {
                towFactorTocken: ascii,
                towFactorLogIn: true
            }
        }, {
            ok: true
        });
    }
    async disableTowFactor(admin) {
        return this.editById(admin._id, {
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
    async addSecurityQuestion(question, answer, admin) {
        return this.editById(admin._id, {
            $set: {
                securityQuestion: {
                    question,
                    answer
                }
            },
        }, {
            ok: true
        });
    }
    async addIP(ip, admin) {
        return super.editById(admin._id, {
            $addToSet: {
                validIPList: ip
            }
        }, {
            ok: true
        });
    }
    async changeIP(ip, newIp, admin) {
        try {
            var isExists = await this.repository.isExists({
                _id: admin._id,
                validIPList: newIp
            });
            if (isExists) {
                return {
                    status: 400,
                    message: "تکراری است"
                };
            }
        }
        catch (error) {
            throw error;
        }
        return this.editOne({
            _id: admin._id,
            validIPList: ip
        }, {
            $set: {
                "validIPList.$": newIp
            }
        }, {
            ok: true
        });
    }
    async deleteIP(ip, admin) {
        return super.editById(admin._id, {
            $pull: {
                validIPList: ip
            }
        }, {
            ok: true
        });
    }
    initApis() {
        this.addRoute("/profile", "get", this.getProfile.bind(this), {
        // preExecs: [{
        //     func: this.checkPasswordExpired.bind(this),
        // }],
        });
        this.addRoute("/password", "post", this.setPaswword.bind(this));
        this.addRoute("/password/expire", "get", this.getPasswordExpired.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
        this.addRoute("/password", "put", this.changePassword.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
        this.addRoute("/towFactor/toggle", "post", this.toggleTwoFactor.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
        this.addRoute("/phoneNumber/verify", "post", this.verifyPhoneNumber.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
        this.addRoute("/phoneNumber/confirm", "post", this.confirmVerifyPhoneNumber.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
        this.addRoute("/email/verify", "post", this.verifyEmail.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
        this.addRoute("/email/confirm", "post", this.confirmVerifyEmail.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
        this.addRoute("/oauth/refresh", "post", this.refreshTowFactor.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
        this.addRoute("/oauth/confirm", "post", this.verifyTowFactor.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
        this.addRoute("/oauth/disable", "post", this.disableTowFactor.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
        this.addRoute("/security/question", "post", this.addSecurityQuestion.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
        this.addRoute("/ip/add", "post", this.addIP.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
        this.addRoute("/ip/edit", "put", this.changeIP.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
        this.addRoute("/ip/delete", "post", this.deleteIP.bind(this), {
            preExecs: [{
                    func: this.checkPasswordExpired.bind(this),
                }],
        });
    }
}
exports.default = AdminAccount;
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "password",
        schema: zod_1.z.string().min(8)
    })),
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Session)())
], AdminAccount.prototype, "setPaswword", null);
__decorate([
    __param(0, (0, parameters_1.Session)())
], AdminAccount.prototype, "checkPasswordExpired", null);
__decorate([
    __param(0, (0, parameters_1.Session)())
], AdminAccount.prototype, "getPasswordExpired", null);
__decorate([
    __param(0, (0, parameters_1.Admin)())
], AdminAccount.prototype, "getProfile", null);
__decorate([
    (0, method_1.Post)("/language"),
    __param(0, (0, parameters_1.Session)()),
    __param(1, (0, parameters_1.Body)({
        destination: "language",
        schema: controller_1.default.id
    }))
], AdminAccount.prototype, "setLanguage", null);
__decorate([
    (0, method_1.Get)("/language"),
    __param(0, (0, parameters_1.Session)())
], AdminAccount.prototype, "getLanguage", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "password",
        schema: zod_1.z.string().min(8)
    })),
    __param(1, (0, parameters_1.Admin)())
], AdminAccount.prototype, "changePassword", null);
__decorate([
    __param(0, (0, parameters_1.Admin)())
], AdminAccount.prototype, "toggleTwoFactor", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "phoneNumber",
        schema: controller_1.default.phone
    })),
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Session)())
], AdminAccount.prototype, "verifyPhoneNumber", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "random",
        schema: controller_1.default.random
    })),
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Session)())
], AdminAccount.prototype, "confirmVerifyPhoneNumber", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "email",
        schema: controller_1.default.email.optional()
    })),
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Session)())
], AdminAccount.prototype, "verifyEmail", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "random",
        schema: controller_1.default.random
    })),
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Session)())
], AdminAccount.prototype, "confirmVerifyEmail", null);
__decorate([
    __param(0, (0, parameters_1.Session)())
], AdminAccount.prototype, "refreshTowFactor", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "code",
        schema: controller_1.default.totp
    })),
    __param(1, (0, parameters_1.Admin)()),
    __param(2, (0, parameters_1.Session)())
], AdminAccount.prototype, "verifyTowFactor", null);
__decorate([
    __param(0, (0, parameters_1.Admin)())
], AdminAccount.prototype, "disableTowFactor", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "question",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "answer",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Admin)())
], AdminAccount.prototype, "addSecurityQuestion", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "ip",
        schema: controller_1.default.ip
    })),
    __param(1, (0, parameters_1.Admin)())
], AdminAccount.prototype, "addIP", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "ip",
        schema: controller_1.default.ip
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "newIp",
        schema: controller_1.default.ip
    })),
    __param(2, (0, parameters_1.Admin)())
], AdminAccount.prototype, "changeIP", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "ip",
        schema: controller_1.default.ip
    })),
    __param(1, (0, parameters_1.Admin)())
], AdminAccount.prototype, "deleteIP", null);
