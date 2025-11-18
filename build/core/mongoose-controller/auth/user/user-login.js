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
const logInController_1 = __importDefault(require("../../../logInController"));
const repository_1 = __importDefault(require("../../repositories/blocklist/repository"));
const repository_2 = __importDefault(require("../../repositories/system/repository"));
const parameters_1 = require("../../../decorators/parameters");
const controller_1 = __importDefault(require("../../controller"));
const smsMessager_1 = __importDefault(require("../../../messaging/smsMessager"));
const userAuthenticator_1 = __importDefault(require("./userAuthenticator"));
const repository_3 = __importDefault(require("../../repositories/loginHistory/repository"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const zod_1 = require("zod");
const random_1 = __importDefault(require("../../../random"));
function checkNeedCaptcha(index) {
    return (target, propertyKey, propertyDescriptor) => {
        propertyDescriptor = propertyDescriptor;
        const originalMethod = propertyDescriptor.value;
        propertyDescriptor.value = async function (...args) {
            var session = args[index];
            try {
                if (session["sendCaptcha"]) {
                    var secret_key = "";
                    try {
                        return await new Promise((resolve, reject) => {
                            // request.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${args[0].body.token}`,
                            //     {
                            //         'headers': {
                            //             'Content-Type': 'application/json'
                            //         },
                            //         body: JSON.stringify({}),
                            //     }, async function (error: any, response: any) {
                            //         if (error) {
                            //             return resolve(await originalMethod.apply(this, args))
                            //         }
                            //         var responseData = JSON.parse(response.body)
                            //         if (responseData.success) {
                            //             return resolve(await originalMethod.apply(this, args))
                            //         }
                            //         else {
                            //             return resolve(new ApiResponse.BadRequestResponse("کپتچا ارسال شود", {
                            //                 sendCaptch: true
                            //             }).send(args[1]))
                            //         }
                            //     })
                        });
                    }
                    catch (error) {
                    }
                }
                else {
                    var result = await originalMethod.apply(this, args);
                    return result;
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
        // propertyDescriptor.value = originalMethod.name
        return propertyDescriptor;
    };
}
class LogInController extends logInController_1.default {
    constructor(baseRoute, repo) {
        super(baseRoute);
        this.userRepository = repo;
        this.sessionExpires = 1200000;
        this.initApis();
    }
    async checkLogin(phoneNumber, session) {
        try {
            var user = await this.userRepository.findOne({
                phoneNumber
            }, {
                fromDb: true,
                projection: {}
            });
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
        var blockList = await new repository_1.default().findOne({
            id: user._id,
            expireDate: {
                $gte: new Date()
            },
            owner: "user"
        });
        if (blockList != null) {
            return {
                status: 403,
                data: { expireDate: blockList.expireDate }
            };
        }
        if (user.towFactorTocken && await new repository_2.default().isExists({
            key: "user-2f-status",
            value: true
        })) {
            session["towFactorTocken"] = user.towFactorTocken;
        }
        session['phoneNumber'] = phoneNumber;
        session['canLogIn'] = true;
        session['userId'] = user._id;
        if (session['cookie']) {
            session['cookie'] = {};
        }
        session.cookie.expires = new Date(Date.now() + this.sessionExpires);
        return {
            status: 200,
            message: "رمز خود را وارد کنید",
            session
        };
    }
    async logIn(password, session) {
        try {
            var user = await this.userRepository.findOne({
                phoneNumber: session["phoneNumber"]
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
        if (await this.userRepository.comparePassword(user, password) == false) {
            this.sendWrongPhoneAlert(user);
            this.checkBlock(user);
            var checkCaptcha = await this.checkCaptcha(session);
            if (checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.captcha) {
                return {
                    status: 401,
                    message: "کد وارد شده اشتباه است",
                    data: {
                        captcha: true,
                        type: checkCaptcha.type
                    }
                };
            }
            return {
                status: 401,
                message: "رمز وارد شده نادرست است"
            };
        }
        if (user.changePassword) {
            session["canChangePassword"] = true;
            session["userId"] = user._id;
            return {
                status: 200,
                message: "لطفا ابتدا رمز خود را عوض کنید",
                data: { changePassword: true },
                session
            };
        }
        var conf = await new repository_2.default().getConf("password-days-limit");
        if (conf != null) {
            try {
                if (await this.userRepository.isExists({
                    _id: user._id,
                    $or: [
                        {
                            passwordLastChange: {
                                $lte: new Date(Date.now() - (1000 * 24 * 60 * 60 * conf.value))
                            }
                        }, {
                            changePassword: true
                        }
                    ]
                })) {
                    session["canChangePassword"] = true;
                    session["userId"] = user._id;
                    return {
                        status: 200,
                        message: "لطفا ابتدا رمز خود را عوض کنید",
                        data: { changePassword: true },
                        session
                    };
                }
            }
            catch (error) {
                throw error;
            }
        }
        if (session["towFactorTocken"]) {
            session["logInWithTowFactor"] = true;
            session["user"] = user;
            if (session['cookie']) {
                session['cookie'] = {};
            }
            session.cookie.expires = new Date(Date.now() + this.sessionExpires);
            return {
                status: 200,
                message: "کد دو عاملی خود را وارد کنید",
                data: { towFactor: true }
            };
        }
        var token = await this.authenticate(user);
        if (session['cookie']) {
            session['cookie'] = {};
        }
        session.cookie.expires = new Date(Date.now() - 1);
        return {
            status: 200,
            message: "با موفقیت وارد شدید",
            session,
            responseHeader: {
                "auth-token": token
            }
        };
    }
    async towFactor(code, session) {
        if (session["logInWithTowFactor"] != true) {
            return {
                status: 400,
                message: "ابتدا رمز خود را وارد کنید"
            };
        }
        let isVerified = speakeasy_1.default.totp.verify({
            secret: session["towFactorTocken"],
            encoding: "ascii",
            token: code
        });
        if (!isVerified) {
            this.sendWrongPhoneAlert(session["user"]);
            this.checkBlock(session["user"]);
            var checkCaptcha = await this.checkCaptcha(session);
            if (checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.captcha) {
                return {
                    status: 401,
                    message: "کد وارد شده اشتباه است",
                    data: {
                        captcha: true,
                        type: checkCaptcha.type
                    }
                };
            }
            return {
                status: 401,
                message: "کد وارد شده اشتباه است"
            };
        }
        var token = await this.authenticate(session["user"]);
        if (session['cookie']) {
            session['cookie'] = {};
        }
        session.cookie.expires = new Date(Date.now() - 1);
        return {
            status: 200,
            message: "با موفقیت وارد شدید",
            session,
            responseHeader: {
                "auth-token": token
            }
        };
    }
    checkPhone(session) {
        if (session["canLogIn"] != true) {
            return {
                status: 400,
                message: "ابتدا شماره تلفن خود را وارد کنید"
            };
        }
        return {
            next: true
        };
    }
    async checkRandom(random, session) {
        if (session["random"] != random || random == undefined) {
            this.sendWrongPhoneAlert(await this.userRepository.findOne({
                phoneNumber: session["phoneNumber"]
            }));
            this.checkBlock(await this.userRepository.findOne({
                phoneNumber: session["phoneNumber"]
            }));
            var checkCaptcha = await this.checkCaptcha(session);
            if (checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.captcha) {
                return {
                    status: 401,
                    message: "کد وارد شده اشتباه است",
                    data: {
                        captcha: true,
                        type: checkCaptcha.type
                    }
                };
            }
            return {
                status: 401,
                message: "کد وارد شده اشتباه است"
            };
        }
        if (session["isForget"]) {
            session["canChangePassword"] = true;
            if (session['cookie']) {
                session['cookie'] = {};
            }
            session.cookie.expires = new Date(Date.now() + this.sessionExpires);
            return {
                status: 200,
                message: "رمز جدید خود را وارد کنید",
                session
            };
        }
        try {
            var user = await this.userRepository.findOne({
                phoneNumber: session["phoneNumber"]
            });
        }
        catch (error) {
            throw error;
        }
        if (user == null) {
            return {
                status: 404,
                message: "شماره تلفن شما یافت نشد"
            };
        }
        var conf = await new repository_2.default().getConf("password-days-limit");
        if (conf != null) {
            try {
                if (await this.userRepository.isExists({
                    _id: user._id,
                    $or: [
                        {
                            passwordLastChange: {
                                $lte: new Date(Date.now() - (1000 * 24 * 60 * 60 * conf.value))
                            }
                        }, {
                            changePassword: true
                        }
                    ]
                })) {
                    session["canChangePassword"] = true;
                    session["userId"] = user._id;
                    return {
                        status: 200,
                        message: "لطفا ابتدا رمز خود را عوض کنید",
                        data: { changePassword: true },
                        session
                    };
                }
            }
            catch (error) {
                throw error;
            }
        }
        // console.log(user)
        var token = await this.authenticate(user);
        if (session['cookie']) {
            session['cookie'] = {};
        }
        session.cookie.expires = new Date(Date.now() - 1);
        return {
            status: 200,
            message: "با موفقیت وارد شدید",
            session,
            responseHeader: {
                "auth-token": token
            }
        };
    }
    async sendRandom(way, isForget, session) {
        var random = random_1.default.randomNumber();
        if (way == "email") {
            if (await new repository_2.default().isExists({
                key: "user-2f-email",
                value: false
            })) {
                return {
                    status: 400,
                    message: "این قابلیت در حال حاضر غیرفعال است"
                };
            }
            var result = true;
        }
        else {
            if (await new repository_2.default().isExists({
                key: "user-2f-sms",
                value: false
            })) {
                return {
                    status: 400,
                    message: "این قابلیت در حال حاضر غیرفعال است"
                };
            }
            try {
                var result = await smsMessager_1.default.send({
                    receptor: session['phoneNumber'],
                    template: 'rigisterPhoneNumber',
                    parameters: {
                        random: random,
                    }
                });
            }
            catch (error) {
                throw error;
            }
        }
        if (result == false) {
            return {
                status: 500,
                message: "مشکلی در سرویس پیامکی رخ داده است"
            };
        }
        if (isForget) {
            session["isForget"] = true;
        }
        session["random"] = random;
        if (session['cookie']) {
            session['cookie'] = {};
        }
        session.cookie.expires = new Date(Date.now() + this.sessionExpires);
        return {
            status: 200,
            message: "کد ورود با موفقیت برای شما ارسال شد",
            session
        };
    }
    async changePassword(password, session) {
        if (session["canChangePassword"] != true) {
            return {
                status: 400,
                message: "شما مجاز به تغییر رمز عبور نیستید"
            };
        }
        try {
            var admin = await this.userRepository.changePassword(session["userId"], password);
        }
        catch (error) {
            throw error;
        }
        if (admin == null) {
            return {
                status: 404,
                message: "کاربری با اطلاعات وارد شده یافت نشد"
            };
        }
        if (session['cookie']) {
            session['cookie'] = {};
        }
        session.cookie.expires = new Date(Date.now() - 1);
        return {
            status: 200,
            message: "رمز شما با موفقیت تغییر کرد",
            session
        };
    }
    async sendWrongPhoneAlert(user) {
        var systemConfig = new repository_2.default();
        if (await systemConfig.isExists({
            key: "user-wrong-login-send-sms",
            value: true
        })) {
            try {
                await smsMessager_1.default.send({
                    parameters: {
                        date: new Date().toLocaleString("fa-IR")
                    },
                    receptor: user.phoneNumber,
                    template: "alertWrongLogIn"
                });
            }
            catch (error) {
            }
        }
        if (await systemConfig.isExists({
            key: "user-wrong-login-send-email",
            value: true
        })) {
        }
    }
    async authenticate(user) {
        var userAuthenticator = new userAuthenticator_1.default();
        return userAuthenticator.authenticate({
            name: user.name,
            family: user.family,
            id: user._id,
            phoneNumber: user.phoneNumber,
            email: user.email
        });
    }
    async checkBlock(user) {
        var systemConfigRepo = new repository_2.default();
        var blockListRepo = new repository_1.default();
        var loginHistoryRepo = new repository_3.default();
        if (await systemConfigRepo.isExists({
            key: "user-wrong-login-status",
            value: true
        })) {
            try {
                var blockList = await blockListRepo.findOne({
                    id: user.id,
                    owner: "user",
                    expireDate: {
                        $gte: new Date()
                    }
                });
            }
            catch (error) {
                return;
            }
            var step = 1;
            if (blockList != null) {
                step = blockList.step + 1;
            }
            try {
                var loginHistory = await loginHistoryRepo.findOne({
                    owner: "user",
                    id: user._id
                });
            }
            catch (error) {
                return;
            }
            if (loginHistory == null) {
                try {
                    await loginHistoryRepo.insert({
                        owner: "user",
                        id: user._id,
                        count: 1
                    });
                    return;
                }
                catch (error) {
                    return;
                }
            }
            try {
                var blockCount = await systemConfigRepo.findOne({
                    key: "user-wrong-login-blockcount" + step
                });
            }
            catch (error) {
                return;
            }
            if ((blockCount === null || blockCount === void 0 ? void 0 : blockCount.value) <= loginHistory.count) {
                await loginHistoryRepo.deleteById(loginHistory._id);
                if (blockList != null) {
                    await blockListRepo.deleteById(blockList._id);
                }
                var blockTime = await systemConfigRepo.findOne({
                    key: "user-wrong-login-blocktime" + step
                });
                await blockListRepo.insert({
                    expireDate: new Date(Date.now() + 1000 * 60 * (blockTime === null || blockTime === void 0 ? void 0 : blockTime.value)),
                    id: user._id,
                    owner: "user",
                    step: step
                });
            }
            else {
                await loginHistoryRepo.updateOne({
                    _id: loginHistory._id
                }, {
                    $inc: {
                        "count": 1
                    }
                });
                return;
            }
        }
    }
    async checkCaptcha(session) {
        var systemConfig = new repository_2.default();
        try {
            if (await systemConfig.isExists({
                key: "user-wrong-login-captch",
                value: true
            })) {
                var wrongLoginCount = session["wrongLogInCount"];
                if (wrongLoginCount == undefined) {
                    session["wrongLogInCount"] = 1;
                    return {
                        captcha: false
                    };
                }
                wrongLoginCount += 1;
                var wrongCount = await systemConfig.getConf("user-wrong-login-captch-count");
                if (wrongCount != null && wrongCount.value <= wrongLoginCount) {
                    session["sendCaptcha"] = true;
                    return {
                        captcha: true,
                        type: "1"
                    };
                }
                else {
                    session["wrongLogInCount"] = wrongLoginCount;
                    return {
                        captcha: false
                    };
                }
            }
        }
        catch (error) {
            return {
                captcha: false
            };
        }
    }
    initApis() {
        this.addRoute("/logIn/check", "post", this.checkLogin.bind(this));
        this.addRoute("/logIn", "post", this.logIn.bind(this));
        this.addRoute("/logIn/towFactor", "post", this.towFactor.bind(this));
        this.addRoute("/logIn/sendRandom", "post", this.sendRandom.bind(this));
        this.addRoute("/logIn/random", "post", this.checkRandom.bind(this));
        this.addRoute("/logIn/password", "put", this.changePassword.bind(this));
    }
}
exports.default = LogInController;
__decorate([
    checkNeedCaptcha(1),
    __param(0, (0, parameters_1.Body)({
        destination: "phoneNumber",
        schema: controller_1.default.phone
    })),
    __param(1, (0, parameters_1.Session)())
], LogInController.prototype, "checkLogin", null);
__decorate([
    checkNeedCaptcha(1),
    __param(0, (0, parameters_1.Body)({
        destination: "password",
        schema: zod_1.z.string().min(8)
    })),
    __param(1, (0, parameters_1.Session)())
], LogInController.prototype, "logIn", null);
__decorate([
    checkNeedCaptcha(1),
    __param(0, (0, parameters_1.Body)({
        destination: "code",
        schema: controller_1.default.totp
    })),
    __param(1, (0, parameters_1.Session)())
], LogInController.prototype, "towFactor", null);
__decorate([
    __param(0, (0, parameters_1.Session)())
], LogInController.prototype, "checkPhone", null);
__decorate([
    checkNeedCaptcha(1),
    __param(0, (0, parameters_1.Body)({
        destination: "random",
        schema: controller_1.default.random
    })),
    __param(1, (0, parameters_1.Session)())
], LogInController.prototype, "checkRandom", null);
__decorate([
    checkNeedCaptcha(2),
    __param(0, (0, parameters_1.Body)({
        destination: "way",
        schema: zod_1.z.enum(["email", "phone"])
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "isForget",
        schema: zod_1.z.boolean()
    })),
    __param(2, (0, parameters_1.Session)())
], LogInController.prototype, "sendRandom", null);
__decorate([
    checkNeedCaptcha(1),
    __param(0, (0, parameters_1.Body)({
        destination: "password",
        schema: zod_1.z.string().min(8)
    })),
    __param(1, (0, parameters_1.Session)())
], LogInController.prototype, "changePassword", null);
