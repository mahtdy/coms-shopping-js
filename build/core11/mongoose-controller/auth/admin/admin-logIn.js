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
const parameters_1 = require("../../../decorators/parameters");
const logInController_1 = __importDefault(require("../../../logInController"));
const repository_1 = __importDefault(require("../../repositories/blocklist/repository"));
const adminAuthenticator_1 = __importDefault(require("./adminAuthenticator"));
const repository_2 = __importDefault(require("../../repositories/system/repository"));
const smsMessager_1 = __importDefault(require("../../../messaging/smsMessager"));
const random_1 = __importDefault(require("../../../random"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const zod_1 = require("zod");
const decorators_1 = require("./decorators");
const method_1 = require("../../../decorators/method");
const controller_1 = __importDefault(require("../../controller"));
const repository_3 = __importDefault(require("../../repositories/refreshToken/repository"));
class LogInController extends logInController_1.default {
    constructor(baseRoute, repo) {
        super(baseRoute);
        this.adminRepository = repo;
        this.authenticator = new adminAuthenticator_1.default();
        this.sessionExpires = 120000;
        this.sessionDuretion = 6000000;
        this.refreshTokenRepo = new repository_3.default();
        this.initApis();
    }
    async logInAdmin(username, password, ip, session) {
        try {
            var admin = await this.adminRepository.checkLogin(username, ip);
        }
        catch (error) {
            throw error;
        }
        if (admin == null) {
            var condAdmin = await this.adminRepository.findOne({
                $or: [
                    {
                        userName: username
                    },
                    {
                        email: username
                    },
                    {
                        phoneNumber: username
                    }
                ]
            });
            if (condAdmin != null) {
                var blockList = await new repository_1.default().findOne({
                    id: condAdmin._id,
                    expireDate: {
                        $gte: new Date()
                    },
                    owner: "admin"
                }, {
                    fromDb: true
                });
                if (blockList != null) {
                    return {
                        status: 403,
                        data: {
                            expireDate: blockList.expireDate
                        },
                        message: "شما بلاک شدید"
                    };
                }
                this.authenticator.alertWrongLogIn(condAdmin);
                var checkBlock = await this.authenticator.checkBlock(condAdmin);
                if (checkBlock.isBlocked) {
                    return {
                        status: 403,
                        data: {
                            expireDate: checkBlock.expireDate
                        },
                        message: "شما بلاک شدید"
                    };
                }
                var checkCaptcha = await this.authenticator.checkCaptcha(condAdmin);
                session = checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.session;
                if ((checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.captcha) == true) {
                    return {
                        status: 401,
                        session,
                        data: {
                            captcha: true,
                            type: checkCaptcha.type
                        },
                        message: "رمز عبور یا نام کاربری اشتباه است"
                    };
                }
            }
            return {
                status: 401,
                message: "رمز عبور یا نام کاربری اشتباه است"
            };
        }
        if (await this.adminRepository.comparePassword(admin, password) == false) {
            var blockList = await new repository_1.default().findOne({
                id: admin._id,
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
                    message: "شما بلاک شدید"
                };
            }
            this.authenticator.alertWrongLogIn(admin);
            var checkBlock = await this.authenticator.checkBlock(admin);
            if (checkBlock.isBlocked) {
                return {
                    status: 403,
                    data: {
                        expireDate: checkBlock.expireDate
                    },
                    message: "شما بلاک شدید"
                };
            }
            var checkCaptcha = await this.authenticator.checkCaptcha(admin, session);
            session = checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.session;
            if ((checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.captcha) == true) {
                return {
                    status: 401,
                    data: {
                        captcha: true,
                        type: checkCaptcha.type
                    },
                    session,
                    message: "رمز عبور یا نام کاربری اشتباه است"
                };
            }
            return {
                status: 401,
                message: "رمز عبور یا نام کاربری اشتباه است"
            };
        }
        var blockList = await new repository_1.default().findOne({
            id: admin._id,
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
                message: "شما بلاک شدید"
            };
        }
        else {
            var conf = await new repository_2.default().getConf("password-days-limit");
            if (conf != null) {
                try {
                    if (await this.adminRepository.isExists({
                        _id: admin._id,
                        passwordLastChange: {
                            $lte: new Date(Date.now() - (1000 * 24 * 60 * 60 * conf.value))
                        }
                    })) {
                        session["changePassword"] = true;
                        session["adminId"] = admin._id;
                        return {
                            status: 200,
                            data: {
                                changePassword: true
                            },
                            message: "لطفا ابتدا رمز خود را عوض کنید",
                            session
                        };
                    }
                }
                catch (error) {
                    throw error;
                }
            }
            if (admin.changePassword) {
                try {
                    session["changePassword"] = true;
                    session["adminId"] = admin._id;
                    return {
                        status: 200,
                        data: {
                            changePassword: true
                        },
                        message: "لطفا ابتدا رمز خود را عوض کنید",
                        session
                    };
                }
                catch (error) {
                    throw error;
                }
            }
            //tow factor
            var isExists = await new repository_2.default().isExists({
                key: "admin-2f-status",
                value: false
            });
            if (!isExists && admin.towFactorEnable) {
                var towFactor = false;
                session['towFactor'] = true;
                session['tocken'] = admin.towFactorTocken;
                session['adminId'] = admin._id;
                if (session['cookie']) {
                    // session['cookie'] = {}
                }
                session.cookie.expires = new Date(Date.now() + 600000);
                if (admin.towFactorLogIn) {
                    towFactor = true;
                }
                else {
                    var random = random_1.default.randomNumber();
                    var result = await smsMessager_1.default.send({
                        parameters: {
                            random: random,
                            name: admin.name,
                        },
                        receptor: admin.phoneNumber,
                        template: "adminLogInWithRandom"
                    });
                    if (result == false) {
                        towFactor = true;
                    }
                    else {
                        session['AdminRandom'] = random;
                        if (session['cookie']) {
                            // session['cookie'] = {}
                        }
                        session.cookie.expires = new Date(Date.now() + this.sessionExpires);
                    }
                }
                return {
                    status: 200,
                    data: {
                        phoneNumber: admin.phoneNumber,
                        email: admin.email,
                        towFactor: true,
                        oauth: towFactor
                    },
                    session,
                    message: "کد دو عاملی را وارد کنید"
                };
            }
            else {
                try {
                    await this.adminRepository.logIn(admin._id);
                }
                catch (error) {
                    throw error;
                }
                try {
                    var isExists = await new repository_2.default().isExists({
                        key: "admin-2f-all",
                        value: true
                    });
                    if (isExists) {
                        session['towFactor'] = true;
                        session['tocken'] = admin.towFactorTocken;
                        session['adminId'] = admin._id;
                        session['checkTowFactor'] = admin._id;
                        if (session['cookie']) {
                            // session['cookie'] = {}
                        }
                        session.cookie.expires = new Date(Date.now() + 600000);
                        var towFactor = false;
                        if (admin.towFactorLogIn) {
                            towFactor = true;
                        }
                        else {
                            var random = random_1.default.randomNumber();
                            var result = await smsMessager_1.default.send({
                                parameters: {
                                    random: random,
                                    name: admin.name,
                                },
                                receptor: admin.phoneNumber,
                                template: "adminLogInWithRandom"
                            });
                            if (result == false) {
                                towFactor = true;
                            }
                            else {
                                session['AdminRandom'] = random;
                                if (session['cookie']) {
                                    // session['cookie'] = {}
                                }
                                session.cookie.expires = new Date(Date.now() + this.sessionExpires);
                            }
                        }
                        return {
                            status: 200,
                            data: {
                                phoneNumber: admin.phoneNumber,
                                email: admin.email,
                                towFactor: true,
                                oauth: towFactor
                            },
                            session,
                            message: "کد دو عاملی را وارد کنید"
                        };
                    }
                    var hash = random_1.default.generateHashStr(30);
                    session = await this.authenticator.authenticate(session, admin, {
                        // expire: req.sessionDuretion
                        expire: this.sessionDuretion,
                        hash
                    });
                }
                catch (error) {
                    throw error;
                }
                return {
                    status: 200,
                    data: {
                        name: admin.name,
                        family: admin.familyName,
                        phoneNumber: admin.phoneNumber,
                        email: admin.email,
                        hash
                    },
                    session,
                    message: "عملیات موفق"
                };
            }
        }
    }
    async getLoginInfo(session) {
        try {
            // var adminId = SessionHandler.get(req, 'adminId')
            var adminId = session['adminId'];
            var admin = await this.adminRepository.findById(adminId, {
                projection: {
                    phoneNumber: 1,
                    email: 1,
                    isEmailRegistered: 1,
                    towFactorLogIn: 1,
                    securityQuestion: 1
                }
            });
            return {
                session,
                data: {
                    admin
                },
                message: "موفق"
            };
        }
        catch (error) {
            throw error;
        }
    }
    async logOutAdmin(session) {
        session.destroy((err) => {
        });
        return {
            session,
            message: "موفق"
        };
    }
    async checkTowFactorCode(code, session) {
        let isVerified = speakeasy_1.default.totp.verify({
            secret: session.tocken,
            encoding: "ascii",
            token: code
        });
        if (!isVerified) {
            var admin = await this.adminRepository.findById(session.adminId);
            var checkBlock = await this.authenticator.checkBlock(admin);
            if (checkBlock.isBlocked) {
                return {
                    status: 403,
                    message: "شما بلاک شدید",
                    data: {}
                };
            }
            var checkCaptcha = await this.authenticator.checkCaptcha(session, admin);
            session = checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.session;
            if ((checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.captcha) == true) {
                return {
                    status: 401,
                    data: {
                        captcha: true,
                        type: checkCaptcha.type
                    },
                    message: "رمز عبور یا نام کاربری اشتباه است",
                    session
                };
            }
            return {
                status: 401,
                data: {},
                message: "کد دو عاملی اشتباه است",
                session
            };
        }
        try {
            var admin = await this.adminRepository.getAdminAndLogIn(session["adminId"]);
        }
        catch (error) {
            throw error;
        }
        if (admin == null) {
            return {
                status: 404,
                data: {},
                message: "کاربر یافت نشد",
                session
            };
        }
        try {
            var hash = random_1.default.generateHashStr(30);
            session = await this.authenticator.authenticate(session, admin, {
                expire: this.sessionDuretion,
                hash: hash
            });
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200,
            data: {
                name: admin.name,
                family: admin.familyName,
                hash
            },
            session
        };
    }
    async logInWithOtherWay(way, session) {
        var adminId = session.adminId;
        try {
            var admin = await this.adminRepository.findById(adminId, {
                fromDb: true,
                projection: {
                    phoneNumber: 1,
                    email: 1,
                    name: 1
                }
            });
        }
        catch (error) {
            throw error;
        }
        if (admin == null) {
            return {
                status: 404,
                message: "اطلاعات کاربری یافت نشد"
            };
        }
        var random = random_1.default.randomNumber();
        var result = true;
        if (way == "phone") {
            //send to phone
            var isExists = true;
            await new repository_2.default().isExists({
                key: "admin-2f-sms",
                value: false
            });
            if (!isExists) {
                return {
                    status: 400,
                    message: "ورود با این روش در حال حاضر غیرفعال است",
                    data: {}
                };
            }
            try {
                result = await smsMessager_1.default.send({
                    parameters: {
                        random: random,
                        name: admin.name,
                    },
                    receptor: admin.phoneNumber,
                    template: "adminLogInWithRandom"
                });
            }
            catch (error) {
                throw error;
            }
        }
        else if (way == 'email') {
            if (await new repository_2.default().isExists({
                key: "admin-2f-email",
                value: false
            })) {
                return {
                    status: 400,
                    message: "ورود با این روش در حال حاضر غیرفعال است",
                    data: {}
                };
            }
            result = true;
            //send to email
        }
        if (result) {
            session['AdminRandom'] = random;
            if (!session['cookie']) {
                // session['cookie'] = {}
            }
            session.cookie.expires = new Date(Date.now() + this.sessionExpires);
            return {
                status: 200,
                data: {},
                message: "کد برای شما ارسال شد",
                session
            };
        }
        return {
            status: 500,
            message: "مشکلی در ارسال کد پیش آمده است"
        };
    }
    async verifyCode(candRandom, session) {
        var random = session['AdminRandom'];
        if (random == undefined) {
            return {
                status: 403,
                data: {},
                message: "سشن شما از بین رفته است"
            };
        }
        if (random != candRandom) {
            var admin = await this.adminRepository.findById(session["adminId"]);
            var checkBlock = await this.authenticator.checkBlock(admin);
            if (checkBlock.isBlocked) {
                return {
                    status: 403,
                    data: {},
                    message: "شما بلاک شدید"
                };
            }
            var checkCaptcha = await this.authenticator.checkCaptcha(session, admin);
            session = checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.session;
            if ((checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.captcha) == true) {
                return {
                    status: 401,
                    data: {
                        captcha: true,
                        type: checkCaptcha.type
                    },
                    session,
                    message: "کد وارد شده نامعتبر است"
                };
            }
            return {
                status: 401,
                data: {},
                session,
                message: "کد وارد شده نامعتبر است"
            };
        }
        try {
            var admin = await this.adminRepository.getAdminAndLogIn(session["adminId"]);
        }
        catch (error) {
            throw error;
        }
        if (admin == null) {
            return {
                status: 404,
                session,
                data: {},
                message: "کاربر یافت نشد"
            };
        }
        try {
            var hash = random_1.default.generateHashStr(30);
            await this.authenticator.authenticate(session, admin, {
                expire: this.sessionDuretion,
                hash
            });
            if (admin.towFactorTocken == undefined && await new repository_2.default().isExists({
                key: "admin-2f-all",
                value: true
            })) {
                session['checkTowFactor'] = true;
            }
        }
        catch (error) {
            throw error;
        }
        return {
            status: 200,
            data: {
                name: admin.name,
                family: admin.familyName,
                hash: hash
            },
            session,
            message: "عملیات موفق"
        };
    }
    async forgetPassword(way, input, session, ip) {
        var query = {};
        if (way == 'phone') {
            query.phoneNumber = input;
        }
        else if (way == 'email') {
            query.email = input;
        }
        try {
            var admin = await this.adminRepository.checkLogin(input, ip);
        }
        catch (error) {
            throw error;
        }
        if (admin == null) {
            return {
                status: 404,
                data: {},
                message: "کاربری با اطلاعات وارد وجود ندارد"
            };
        }
        var random = random_1.default.randomNumber();
        var result = true;
        if (way == "phone") {
            //send to phone
            try {
                result = await smsMessager_1.default.send({
                    parameters: {
                        random: random,
                        name: admin.name
                    },
                    receptor: admin.phoneNumber,
                    template: "adminLogInWithRandom"
                });
            }
            catch (error) {
                throw error;
            }
        }
        else if (way == 'email') {
            result = true;
            //send to email
        }
        if (result) {
            session["AdminForgetRandom"] = random;
            session["adminId"] = admin._id;
            // session["AdminForgetRandom"] = way
            if (!session["cookie"]) {
                session["cookie"] = {};
            }
            session.cookie.expires = new Date(Date.now() + this.sessionExpires);
            return {
                status: 200,
                message: "کد برای شما ارسال شد",
                session
            };
        }
        return {
            status: 500,
            message: "مشکلی در ارسال کد پیش آمده است"
        };
    }
    async forgetWithSecurityQuestion(answer, session) {
        try {
            var adminId = session["adminId"];
            var isExists = await this.adminRepository.isExists({
                _id: adminId,
                "securityQuestion.answer": answer
            });
            if (isExists) {
                session["changePassword"] = true;
                if (!session["cookie"]) {
                    session["cookie"] = {};
                }
                session.cookie.expires = new Date(Date.now() + this.sessionExpires);
                return {
                    status: 200,
                    data: {
                        forget: true
                    },
                    message: "رمز جدید را وارد کنید",
                    session
                };
            }
            return {
                status: 400,
                message: "جواب نادرست",
                data: {}
            };
        }
        catch (error) {
            throw error;
        }
    }
    async forgetWithTowFactor(code, session) {
        try {
            var admin = await this.adminRepository.findById(session["adminId"]);
        }
        catch (error) {
            throw error;
        }
        if (admin == null) {
            return {
                status: 404,
                message: "کاربری با اطلاعات وارد وجود ندارد"
            };
        }
        if (admin.towFactorLogIn && admin.towFactorTocken) {
            var isVerified = speakeasy_1.default.totp.verify({
                secret: admin.towFactorTocken,
                encoding: "ascii",
                token: code
            });
            if (isVerified) {
                session["changePassword"] = true;
                if (!session["cookie"]) {
                    session["cookie"] = {};
                }
                session.cookie.expires = new Date(Date.now() + this.sessionExpires);
                return {
                    status: 200,
                    data: {
                        forget: true
                    },
                    session
                };
            }
        }
        var admin = await this.adminRepository.findById(session["adminId"]);
        var checkBlock = await this.authenticator.checkBlock(admin);
        if (checkBlock.isBlocked) {
            return {
                status: 403,
                message: "شما بلاک شدید",
                session
            };
        }
        var checkCaptcha = await this.authenticator.checkCaptcha(session, admin);
        session = checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.session;
        if ((checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.captcha) == true) {
            return {
                status: 401,
                data: {
                    captcha: true,
                    type: checkCaptcha.type
                },
                message: "رمز عبور یا نام کاربری اشتباه است",
                session
            };
        }
        return {
            status: 401,
            message: "کد وارد شده اشتباه است",
            session
        };
    }
    async verifyForgetPassword(candRandom, session) {
        var random = session["AdminForgetRandom"];
        if (random == undefined) {
            return {
                status: 403,
                message: "سشن شما از بین رفته است",
            };
        }
        if (random == candRandom) {
            session["changePassword"] = true;
            if (!session["cookie"]) {
                session["cookie"] = {};
            }
            session.cookie.expires = new Date(Date.now() + this.sessionExpires);
            return {
                status: 200,
                message: "رمز جدید را وارد کنید",
                session,
                data: {
                    forget: true
                }
            };
        }
        var admin = await this.adminRepository.findById(session["adminId"]);
        var checkBlock = await this.authenticator.checkBlock(admin);
        if (checkBlock.isBlocked) {
            return {
                status: 403,
                data: {},
                message: "شما بلاک شدید",
                session
            };
        }
        var checkCaptcha = await this.authenticator.checkCaptcha(session, admin);
        session = checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.session;
        if ((checkCaptcha === null || checkCaptcha === void 0 ? void 0 : checkCaptcha.captcha) == true) {
            return {
                status: 401,
                data: {
                    captcha: true,
                    type: checkCaptcha.type
                },
                session,
                message: "کد وارد شده اشتباه است"
            };
        }
        return {
            status: 401,
            data: {},
            session,
            message: "کد وارد شده اشتباه است"
        };
    }
    async changePassword(password, session) {
        if (session["changePassword"] == undefined) {
            return {
                status: 403,
                message: "سشن شما از بین رفته است"
            };
        }
        try {
            var admin = await this.adminRepository.changePassword(session["adminId"], password);
        }
        catch (error) {
            throw error;
        }
        if (admin == null) {
            return {
                status: 404,
                data: {},
                message: "کاربری با اطلاعات وارد شده یافت نشد"
            };
        }
        session.destroy((err) => {
        });
        return {
            status: 200,
            data: {},
            message: "رمز شما با موفقیت تغییر یافت",
        };
    }
    async relogin(password, refreshToken, session) {
        try {
            var tokenData = await this.refreshTokenRepo.findOne({
                refresh: refreshToken,
                expire: {
                    $gte: new Date()
                },
                tries: {
                    $lte: 2
                }
            });
            if (tokenData == null) {
                return {
                    status: 400,
                    data: {}
                };
            }
            const admin = await this.adminRepository.findById(tokenData.admin);
            if (admin == null) {
                return {
                    status: 400,
                    data: {}
                };
            }
            if (await this.adminRepository.comparePassword(admin, password) == false) {
                await this.refreshTokenRepo.updateOne({
                    _id: tokenData._id
                }, {
                    $set: {
                        tries: tokenData.tries + 1
                    }
                });
                return {
                    status: 400,
                    data: {}
                };
            }
            var hash = random_1.default.generateHashStr(30);
            session = await this.authenticator.authenticate(session, admin, {
                expire: this.sessionDuretion,
                hash
            });
            return {
                status: 200,
                data: {
                    name: admin.name,
                    family: admin.familyName,
                    phoneNumber: admin.phoneNumber,
                    email: admin.email,
                    hash
                },
                session
            };
        }
        catch (error) {
            throw error;
        }
    }
    async refreshLogin(refreshToken, session) {
        try {
            var tokenData = await this.refreshTokenRepo.findOne({
                refresh: refreshToken,
                expire: {
                    $gte: new Date()
                }
                // tries : {
                //     $lte : 2
                // }
            });
            if (tokenData == null) {
                return {
                    status: 400,
                    data: {}
                };
            }
            const admin = await this.adminRepository.findById(tokenData.admin);
            if (admin == null) {
                return {
                    status: 400,
                    data: {}
                };
            }
            var hash = random_1.default.generateHashStr(30);
            session = await this.authenticator.authenticate(session, admin, {
                expire: this.sessionDuretion,
                hash
            });
            return {
                status: 200,
                data: {
                    name: admin.name,
                    family: admin.familyName,
                    phoneNumber: admin.phoneNumber,
                    email: admin.email,
                    hash
                },
                session
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getLoginTimeout() {
        return {
            status: 200,
            data: {
                timeout: this.sessionDuretion,
                interval: 10000
            }
        };
    }
    initApis() {
        this.addRoute("/logIn", "post", this.logInAdmin.bind(this));
        this.addRoute("/logIn/info", "get", this.getLoginInfo.bind(this));
        this.addRoute("/logOut", "post", this.logOutAdmin.bind(this));
        this.addRoute("/logIn/towFactor", "post", this.checkTowFactorCode.bind(this));
        this.addRoute("/logIn/otherWay", "post", this.logInWithOtherWay.bind(this));
        this.addRoute("/logIn/verifyCode", "post", this.verifyCode.bind(this));
        this.addRoute("/logIn/forgetPassword", "post", this.forgetPassword.bind(this));
        this.addRoute("/logIn/forgetPassword/otherWay", "post", this.forgetPassword.bind(this));
        this.addRoute("/logIn/forgetPassword/securityQuestion", "post", this.forgetWithSecurityQuestion.bind(this));
        this.addRoute("/logIn/forgetPassword/towFactor", "post", this.forgetWithTowFactor.bind(this));
        this.addRoute("/logIn/forgetPassword/verify", "post", this.verifyForgetPassword.bind(this));
        this.addRoute("/logIn/password", "put", this.changePassword.bind(this));
        this.addRoute("/relogin", "post", this.relogin.bind(this));
    }
}
exports.default = LogInController;
__decorate([
    method_1.Log,
    (0, decorators_1.checkAdminNeedCaptcha)(3),
    __param(0, (0, parameters_1.Body)({
        destination: "username",
        schema: zod_1.z.string().min(8).default("hassan77")
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "password",
        schema: controller_1.default.password
    })),
    __param(2, (0, parameters_1.IP)()),
    __param(3, (0, parameters_1.Session)())
], LogInController.prototype, "logInAdmin", null);
__decorate([
    __param(0, (0, parameters_1.Session)())
], LogInController.prototype, "getLoginInfo", null);
__decorate([
    __param(0, (0, parameters_1.Session)())
], LogInController.prototype, "logOutAdmin", null);
__decorate([
    method_1.Log,
    (0, decorators_1.alertWrongLogIn)(1),
    (0, decorators_1.checkAdminBlock)(1),
    (0, decorators_1.checkAdminNeedCaptcha)(1),
    __param(0, (0, parameters_1.Body)({
        destination: "code",
        schema: zod_1.z.string().length(6).regex(/^[0-9]*$/)
    })),
    __param(1, (0, parameters_1.Session)())
], LogInController.prototype, "checkTowFactorCode", null);
__decorate([
    method_1.Log,
    (0, decorators_1.checkAdminBlock)(1),
    (0, decorators_1.checkAdminNeedCaptcha)(1),
    __param(0, (0, parameters_1.Body)({
        destination: "way",
        schema: zod_1.z.enum(["phone", "email"])
    })),
    __param(1, (0, parameters_1.Session)())
], LogInController.prototype, "logInWithOtherWay", null);
__decorate([
    method_1.Log,
    (0, decorators_1.alertWrongLogIn)(1),
    (0, decorators_1.checkAdminBlock)(1),
    (0, decorators_1.checkAdminNeedCaptcha)(1),
    __param(0, (0, parameters_1.Body)({
        destination: "random",
        schema: controller_1.default.random
    })),
    __param(1, (0, parameters_1.Session)())
], LogInController.prototype, "verifyCode", null);
__decorate([
    method_1.Log,
    (0, decorators_1.checkAdminBlock)(1),
    (0, decorators_1.checkAdminNeedCaptcha)(2),
    __param(0, (0, parameters_1.Body)({
        destination: "way",
        schema: zod_1.z.enum(["phone", "email"])
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "input",
        schema: zod_1.z.string().regex(/^([0][9][01239][0-9]{8,8})|([\w-\.]+@([\w-]+\.)+[\w-]{2,4})$/).default("09901415681").describe("email or phone")
    })),
    __param(2, (0, parameters_1.Session)()),
    __param(3, (0, parameters_1.IP)())
], LogInController.prototype, "forgetPassword", null);
__decorate([
    method_1.Log,
    (0, decorators_1.checkAdminBlock)(1),
    (0, decorators_1.checkAdminNeedCaptcha)(1),
    __param(0, (0, parameters_1.Body)({
        destination: "answer",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Session)())
], LogInController.prototype, "forgetWithSecurityQuestion", null);
__decorate([
    method_1.Log,
    (0, decorators_1.checkAdminBlock)(1),
    (0, decorators_1.checkAdminNeedCaptcha)(1),
    __param(0, (0, parameters_1.Body)({
        destination: "code",
        schema: zod_1.z.string().length(6).regex(/^[0-9]*$/)
    })),
    __param(1, (0, parameters_1.Session)())
], LogInController.prototype, "forgetWithTowFactor", null);
__decorate([
    method_1.Log,
    (0, decorators_1.alertWrongLogIn)(1),
    (0, decorators_1.checkAdminBlock)(1),
    (0, decorators_1.checkAdminNeedCaptcha)(1),
    __param(0, (0, parameters_1.Body)({
        destination: "random",
        schema: controller_1.default.random
    })),
    __param(1, (0, parameters_1.Session)())
], LogInController.prototype, "verifyForgetPassword", null);
__decorate([
    method_1.Log,
    (0, decorators_1.checkAdminBlock)(1),
    (0, decorators_1.checkAdminNeedCaptcha)(1),
    __param(0, (0, parameters_1.Body)({
        destination: "password",
        schema: controller_1.default.password
    })),
    __param(1, (0, parameters_1.Session)())
], LogInController.prototype, "changePassword", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "password",
        schema: controller_1.default.password
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "refreshToken",
        schema: zod_1.z.string()
    })),
    __param(2, (0, parameters_1.Session)())
], LogInController.prototype, "relogin", null);
__decorate([
    (0, method_1.Post)("/login/refresh"),
    __param(0, (0, parameters_1.Body)({
        destination: "hash",
        schema: zod_1.z.string()
    })),
    __param(1, (0, parameters_1.Session)())
], LogInController.prototype, "refreshLogin", null);
__decorate([
    (0, method_1.Get)("/timeout")
], LogInController.prototype, "getLoginTimeout", null);
