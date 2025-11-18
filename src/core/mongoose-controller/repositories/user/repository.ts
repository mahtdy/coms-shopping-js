import { ClientSession, Model, Types } from "mongoose"
import BaseRepositoryService from "../../repository"
import BaseUser from "./model"
import bcrypt from "bcrypt";
import CacheService from "../../../cache"
import SystemConfigRepository from "../system/repository";

var SALT_LENGTH = 15
interface UserOptions<T> {
    salt?: string,
    cache?: CacheService,
    model: Model<T>
}

export default class UserRepository<T extends BaseUser> extends BaseRepositoryService<T> {
    salt?: string
    constructor(options: UserOptions<T>) {
        super(options.model, {
            cacheService: options.cache,
        })
        this.salt = options.salt
    }
    // constructor(cache?: CacheService) {
    //     super(UserModel, {
    //         cacheService: cache
    //     })
    // }

    async hashPassword(password: string): Promise<string> {
        try {
            var conf = await new SystemConfigRepository().getConf("password-minimum-length")
            if (conf != null && password.length < conf.value) {
                throw new Error(`minimum password length is ${conf?.value}`)
            }
        } catch (error) {
            throw error
        }
        try {
            return await bcrypt.hash(
                password,
                this.salt || await bcrypt.genSalt(15)
            )
        } catch (error) {
            throw error
        }
    }

    async insert(user: T): Promise<T> {
        try {
            user.password = await this.hashPassword(user.password)
        } catch (error) {
            throw error
        }

        return await super.insert(user)

        return {
            nama :user.name,
            family : user.family,
            _id : user._id,
            phoneNumber : user.phoneNumber,
            email : user.email,
        } as any
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

    async comparePassword(user: any, password: string): Promise<Boolean> {
        try {
            return await bcrypt.compare(password, user.password)
        } catch (error) {
            throw error
        }
    }

    async changePassword(id: Types.ObjectId, password: string): Promise<BaseUser | null> {
        try {
            password = await this.hashPassword(password)
        } catch (error) {
            throw error
        }

        try {
            if (await new SystemConfigRepository().isExists({
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
                        }]
                })) {
                    throw new Error("این رمز قبلا استفاده شده است. لطفا رمز جدید وارد کنید")
                }
            }

            var admin = await this.findById(id, {
                fromDb: true,
                projection: {
                    password: 1
                }
            })
            if (admin == null) {
                throw new Error("این ادمین یافت نشد")
            }
            var currentPassword = admin?.password
        } catch (error) {
            throw error
        }

        try {
            return await this.findByIdAndUpdate(id,
                {
                    $set: {
                        password: password,
                        passwordLastChange: new Date(Date.now()),
                        changePassword : false
                    },
                    $push: {
                        passwords: currentPassword
                    }
                })
        }
        catch (error) {
            throw error
        }

    }


    async increaseWallet(id : string | Types.ObjectId, amount : number , session :ClientSession) {
        console.log("id" ,amount )
        return this.findByIdAndUpdate(id , {
            $inc : {
                wallet : amount
            }
        })
    }

    async decreaseWallet(id : string  | Types.ObjectId, amount : number , session :ClientSession) {
        return this.findByIdAndUpdate(id , {
            $inc : {
                wallet : -amount
            }
        })
    }


    async getInfo(id : string) :Promise<any>{
        return this.findById(id , {
            projection : {
                password : 0 ,
                passwords : 0
            }

        })
    }


}