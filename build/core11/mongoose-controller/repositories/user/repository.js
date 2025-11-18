"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const repository_2 = __importDefault(require("../system/repository"));
var SALT_LENGTH = 15;
class UserRepository extends repository_1.default {
    constructor(options) {
        super(options.model, {
            cacheService: options.cache,
        });
        this.salt = options.salt;
    }
    // constructor(cache?: CacheService) {
    //     super(UserModel, {
    //         cacheService: cache
    //     })
    // }
    async hashPassword(password) {
        try {
            var conf = await new repository_2.default().getConf("password-minimum-length");
            if (conf != null && password.length < conf.value) {
                throw new Error(`minimum password length is ${conf === null || conf === void 0 ? void 0 : conf.value}`);
            }
        }
        catch (error) {
            throw error;
        }
        try {
            return await bcrypt_1.default.hash(password, this.salt || await bcrypt_1.default.genSalt(15));
        }
        catch (error) {
            throw error;
        }
    }
    async insert(user) {
        try {
            user.password = await this.hashPassword(user.password);
        }
        catch (error) {
            throw error;
        }
        return await super.insert(user);
        return {
            nama: user.name,
            family: user.family,
            _id: user._id,
            phoneNumber: user.phoneNumber,
            email: user.email,
        };
    }
    // async findByIdAndUpdate(id: Types.ObjectId, query: UpdateQuery<BaseUser>): Promise<BaseUser | null> {
    //     if (query.$set?.password != undefined) {
    //         try {
    //             query.$set?.password = await this.hashPassword(query.$set?.password)
    //         } catch (error) {
    //             throw error
    //         }
    //     }
    //     return await this.collection.findByIdAndUpdate(id, query)
    // }
    async comparePassword(user, password) {
        try {
            return await bcrypt_1.default.compare(password, user.password);
        }
        catch (error) {
            throw error;
        }
    }
    async changePassword(id, password) {
        try {
            password = await this.hashPassword(password);
        }
        catch (error) {
            throw error;
        }
        try {
            if (await new repository_2.default().isExists({
                key: "allow-repetitious-password",
                value: false
            })) {
                if (await this.isExists({
                    _id: id,
                    $or: [
                        {
                            passwords: password
                        }, {
                            password: password
                        }
                    ]
                })) {
                    throw new Error("این رمز قبلا استفاده شده است. لطفا رمز جدید وارد کنید");
                }
            }
            var admin = await this.findById(id, {
                fromDb: true,
                projection: {
                    password: 1
                }
            });
            if (admin == null) {
                throw new Error("این ادمین یافت نشد");
            }
            var currentPassword = admin === null || admin === void 0 ? void 0 : admin.password;
        }
        catch (error) {
            throw error;
        }
        try {
            return await this.findByIdAndUpdate(id, {
                $set: {
                    password: password,
                    passwordLastChange: new Date(Date.now()),
                    changePassword: false
                },
                $push: {
                    passwords: currentPassword
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    async increaseWallet(id, amount, session) {
        return this.findByIdAndUpdate(id, {
            $inc: {
                wallet: amount
            }
        });
    }
    async decreaseWallet(id, amount, session) {
        return this.findByIdAndUpdate(id, {
            $inc: {
                wallet: -amount
            }
        });
    }
    async getInfo(id) {
        return this.findById(id, {
            projection: {
                password: 0,
                passwords: 0
            }
        });
    }
}
exports.default = UserRepository;
