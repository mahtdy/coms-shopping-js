"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const smsMessager_1 = __importDefault(require("../../../messaging/smsMessager"));
const repository_1 = __importDefault(require("../../repositories/blocklist/repository"));
const repository_2 = __importDefault(require("../../repositories/loginHistory/repository"));
const repository_3 = __importDefault(require("../../repositories/refreshToken/repository"));
const repository_4 = __importDefault(require("../../repositories/system/repository"));
class AdminAuthenticator {
    constructor() {
        this.blockListRepository = new repository_1.default();
        this.refreshTokenRepo = new repository_3.default();
    }
    async authenticate(session, payload, options) {
        session['admin'] = payload;
        try {
            await this.refreshTokenRepo.insert({
                refresh: options.hash,
                expire: new Date(Date.now() + options.expire + 300000),
                admin: payload._id
            });
        }
        catch (error) {
            throw error;
        }
        session.cookie.expires = new Date(Date.now() + options.expire);
        return session;
    }
    isAuthenticate(session) {
        var admin = session["admin"];
        if (admin == undefined) {
            return false;
        }
        return true;
    }
    async checkBlock(admin) {
        var systemConfigRepo = new repository_4.default();
        var blockListRepo = new repository_1.default();
        var loginHistoryRepo = new repository_2.default();
        if (await systemConfigRepo.isExists({
            key: "admin-wrong-login-status",
            value: true
        })) {
            try {
                var blockList = await blockListRepo.findOne({
                    id: admin._id,
                    owner: "admin",
                    expireDate: {
                        $gte: new Date()
                    }
                });
            }
            catch (error) {
                return {
                    isBlocked: false
                };
            }
            var step = 1;
            if (blockList != null) {
                step = blockList.step + 1;
            }
            try {
                var loginHistory = await loginHistoryRepo.findOne({
                    owner: "admin",
                    id: admin._id
                });
            }
            catch (error) {
                return {
                    isBlocked: false
                };
            }
            if (loginHistory == null) {
                try {
                    await loginHistoryRepo.insert({
                        owner: "admin",
                        id: admin._id,
                        count: 1
                    });
                    return {
                        isBlocked: false
                    };
                }
                catch (error) {
                    return {
                        isBlocked: false
                    };
                }
            }
            try {
                var blockCount = await systemConfigRepo.findOne({
                    key: "admin-wrong-login-blockcount" + step
                });
            }
            catch (error) {
                return {
                    isBlocked: false
                };
            }
            if ((blockCount === null || blockCount === void 0 ? void 0 : blockCount.value) <= loginHistory.count) {
                await loginHistoryRepo.deleteById(loginHistory._id);
                if (blockList != null) {
                    await blockListRepo.deleteById(blockList._id);
                }
                var blockTime = await systemConfigRepo.findOne({
                    key: "admin-wrong-login-blocktime" + step
                });
                var expireDate = new Date(Date.now() + 1000 * 60 * (blockTime === null || blockTime === void 0 ? void 0 : blockTime.value));
                await blockListRepo.insert({
                    expireDate: expireDate,
                    id: admin._id,
                    owner: "admin",
                    step: step
                });
                // if (port() == 5000)
                return {
                    isBlocked: true,
                    expireDate: expireDate
                };
                // else
                //     return { isBlocked: false }
            }
            else {
                await loginHistoryRepo.updateOne({
                    _id: loginHistory._id
                }, {
                    $inc: {
                        "count": 1
                    }
                });
                return {
                    isBlocked: false
                };
            }
        }
        return {
            isBlocked: false
        };
    }
    async checkCaptcha(session, admin) {
        return {
            captcha: false,
            session
        };
        // var systemConfig = new SystemConfigRepository()
        // try {
        //     if (await systemConfig.isExists({
        //         key: "admin-wrong-login-captch",
        //         value: true
        //     })) {
        //         var wrongLoginCount = SessionHandler.get(req, "wrongLogInCount")
        //         if (wrongLoginCount == undefined) {
        //             SessionHandler.set(req, ["wrongLogInCount"], [1])
        //             return {
        //                 captcha: false
        //             }
        //         }
        //         wrongLoginCount += 1
        //         var wrongCount = await systemConfig.getConf("admin-wrong-login-captch-count")
        //         if (wrongCount != null && wrongCount.value <= wrongLoginCount) {
        //             SessionHandler.set(req, ["sendCaptcha"], [true])
        //             return {
        //                 captcha: true,checkBlockType
        //                 type: "1"
        //             }
        //         }
        //         else {
        //             SessionHandler.set(req, ["wrongLogInCount"], [wrongLoginCount])
        //             return {
        //                 captcha: false
        //             }
        //         }checkBlockType
        //     }
        // } catch (error) {
        //     return {
        //         captcha: false
        //     }
        // }
    }
    async alertWrongLogIn(admin) {
        var systemConfig = new repository_4.default();
        if (await systemConfig.isExists({
            key: "admin-wrong-login-send-sms",
            value: true
        })) {
            try {
                await smsMessager_1.default.send({
                    parameters: {
                        date: new Date().toLocaleString("fa-IR")
                    },
                    receptor: admin.phoneNumber,
                    template: "alertWrongLogIn"
                });
            }
            catch (error) {
            }
        }
        if (await systemConfig.isExists({
            key: "admin-wrong-login-send-email",
            value: true
        })) {
        }
    }
}
exports.default = AdminAuthenticator;
