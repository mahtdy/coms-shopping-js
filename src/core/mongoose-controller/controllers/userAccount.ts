import { Body, Query, Session, User } from "../../decorators/parameters";
import { Response } from "../../controller";
import BaseController, { ControllerOptions } from "../controller";
import BaseUser from "../repositories/user/model";
import UserRepository from "../repositories/user/repository";
import { UserInfo } from "../auth/user/userAuthenticator";
import { Get, Post,Put } from "../../decorators/method";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { z } from "zod"
import RandomGenarator from "../../random";
import SmsMessager from "../../messaging/smsMessager";
import EmailMessager from "../../messaging/emailMessager";
import ConfigService from "../../services/config";
import CacheService from "../../cache";



export default class AccountController extends BaseController<BaseUser>{
    cacheService: CacheService
    constructor(baseRoute: string, repo: UserRepository<BaseUser>, options?: ControllerOptions) {
        super(baseRoute, repo, options)
        this.cacheService = new CacheService("socket_data")
    }


    @Get("/info", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async getInfo(
        @User() user: UserInfo
    ): Promise<Response> {
        return this.findById(user.id || "", {
            projection: {
                _id : 1,
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
        })
    }





    @Post("/towFactor/refresh", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async refreshTowFactor(
        @User() userInfo: UserInfo
    ): Promise<Response> {
        try {
            var user = await this.repository.findById(userInfo.id)
        } catch (error) {
            throw error
        }
        if (user == null) {
            return {
                status: 404,
                message: "موردی یافت نشد"
            }
        }
        var secret = speakeasy.generateSecret({ length: 20 });

        try {

            var result = await this.repository.findByIdAndUpdate(userInfo.id, {
                $set: {
                    towFactorTocken: secret.ascii
                }
            })
        } catch (error) {
            throw error
        }

        return new Promise((resolve, reject) => {
            qrcode.toDataURL(secret.otpauth_url as string, function (err, image_data) {
                if (err) {
                    return reject(err)
                }
                return {
                    status: 200,
                    data: image_data
                }
            })
        })


    }

    // verify tow factor change
    @Post("/towFactor/verify", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async verifyTowFactor(
        @Body({
            destination: "code",
            schema: BaseController.totp
        }) code: string,
        @User() userInfo: UserInfo,
        @Session() session: any
    ): Promise<Response> {
        var ascii = session['account']
        try {
            var user = await this.repository.findById(userInfo.id || "")
        } catch (error) {
            throw error
        }
        //user exists
        if (user == null) {
            return {
                status: 404
                // data
            }
        }
        // check ascii of 2fA is in session 
        if (ascii == undefined) {
            return {
                status: 400,
                message: "ابتدا کد دوعاملی را بسازید"
            }
        }

        // is tow factor login enabled
        if (!user.towFactorLogIn) {
            return {
                status: 400,
                message: "ورود دو مرحله ای برای شما غیرفعال است"
            }
        }

        //check code is right
        let verifed = speakeasy.totp.verify({
            secret: ascii,
            encoding: "ascii",
            token: code
        })

        if (!verifed) {
            return {
                status: 400,
                message: "کد دوعاملی اشتباه است"
            }
        }
        return this.editById(user._id, {
            $set: {
                towFactorTocken: ascii
            }
        }, {
            ok: true
        })
    }


    @Post("/towFactor/enable", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async enableTowFactor(
        @User() userInfo: UserInfo
    ): Promise<Response> {
        try {
            var user = await this.repository.findById(userInfo.id)
        } catch (error) {
            // next(error)
            throw error
        }

        //user exists
        if (user == null) {
            return {
                status: 404
            }
        }

        // is tow factor login already enabled
        if (user.towFactorLogIn == true) {
            return {
                status: 400,
                message: "ورود دو مرحله ای برای شما فعال است"
            }
        }

        return this.editById(user._id, {
            $set: {
                towFactorLogIn: true
            }
        }, {
            ok: true
        })
    }


    @Post("/towFactor/disable", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async disableTowFactor(
        @User() userInfo: UserInfo,
        @Session() session: any,
        @Body({
            destination: "code",
            schema: BaseController.totp.optional()
        }) code?: string,
        @Body({
            destination: "code",
            schema: z.enum([""])
        }) way?: "phone" | "email",
    ): Promise<Response> {
        try {
            var user = await this.repository.findById(userInfo.id || "" ,{
                projection : {
                    password : 1
                }
            })
        } catch (error) {
            throw error
        }
        //user exists
        if (user == null) {
            return {
                status: 404
            }
        }

        // is tow factor login already disabled
        if (user.towFactorLogIn != true) {
            return {
                status: 400,
                message: "ورود دو مرحله ای برای شما غیرفعال است"
            }
        }

        // have tow factor tocken
        if (user.towFactorTocken) {
            //verify disable with 2f code
            if (code) {
                let verifed = speakeasy.totp.verify({
                    secret: user.towFactorTocken,
                    encoding: "ascii",
                    token: code
                })
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
                    })
                }
                else {
                    return {
                        status: 400,
                        message: "عملیات غیر مجاز"
                    }
                }
            }

            //verify disable with sending sms or email
            else if (way) {
                let random = RandomGenarator.randomNumber()

                try {
                    var result: boolean = false
                    if (way == "phone") {
                        result = await SmsMessager.send({
                            template: "disableTowFactorCodeUser",
                            receptor: user.phoneNumber,
                            parameters: {
                                name: user.name,
                                random: random
                            }
                        })

                    }
                    if (way == "email") {
                        result = await EmailMessager.send({
                            template: "disableTowFactorCodeUser",
                            receptor: user.email,
                            parameters: {
                                random: random
                            }
                        })



                    }
                    if (result) {
                        session["disableTowFactorRandom"] = random
                        session["disableTowFactorExpire"] = new Date(Date.now() + 120000)
                        return {
                            status: 200,
                            message: "کد ارسال شد",
                            session
                        }
                    }
                    return {
                        status: 500,
                        message: "مشکلی رخ داده است لطفا بعدا دوباره امتحان کنید"
                    }
                } catch (error) {
                    throw error
                }


            }

            else {
                return {
                    status: 400,
                    message: "عملیات غیر مجاز"
                }
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
            })
        }
    }

    @Post("/towFactor/disable/verify", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async verifyDisableTowFactor(
        @Body({ destination: "code", schema: BaseController.random }) code: number,
        @Session() session: any,
        @User() userInfo: UserInfo
    ): Promise<Response> {
        try {
            var user = await this.repository.findById(userInfo.id || "")
        } catch (error) {
            throw error
        }
        //user exists
        if (user == null) {
            return {
                status: 404
            }
        }

        // check random sent from sms or email
        var random = session["disableTowFactorRandom"]
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
            })
        }
        else {
            return {
                status: 400,
                message: "عملیات غیر مجاز"
            }
        }
    }



    @Put("/password", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async changePassword(
        @Body({
            destination : "oldPassword",
            schema :  z.string().min(8)
        }) oldPassword : string,
        @Body({
            destination: "password",
            schema: z.string().min(8)
        }) password: string,
        @User() userInfo: UserInfo
    ): Promise<Response> {
        try {
            var user = await this.repository.findOne({
                _id : userInfo.id
            }, {
                projection: {
                    password: 1,
                    name: 1,
                    family: 1,
                    email: 1,
                    phoneNumber: 1,
                    changePassword : 1
                },
                fromDb: true
            }
            )
            if (user == null) {
                return {
                    status: 404
                }
            }
            
            let isPasswordCorrect = await this.repository.comparePassword(user , oldPassword)
            if(isPasswordCorrect != true){
                return {
                    status : 400,
                    message : "رمز قبلی اشتباه است"
                }
            }
            //change password (and hash)
            await this.repository.changePassword(user._id, password)
        } catch (error) {
            throw error
        }
        return {
            status: 200,
            message: "رمز شما با موفقیت تغییر یافت"
        }
    }


    @Post("/password/check", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async checkPassword(
        @Body({
            destination: "password",
            schema: z.string().min(8)
        }) password: string,
        @User() userInfo: UserInfo
    ): Promise<Response> {
        try {
            // var user = await this.repository.findById(userInfo.id || "")
            var user = await this.repository.findOne({
                _id : userInfo.id
            }, {
                projection: {
                    password: 1,
                    name: 1,
                    family: 1,
                    email: 1,
                    phoneNumber: 1,
                    changePassword : 1
                },
                fromDb: true
            }
            )
            if (user == null) {
                return {
                    status: 404
                }
            }
       
            let isPasswordCorrect = await this.repository.comparePassword(user , password)
            if(isPasswordCorrect != true){
                return {
                    status : 400,
                    message : "رمز قبلی اشتباه است"
                }
            }
            
            return {
                status : 200,
                data: {}
            }
        } catch (error) {
            throw error
        }
    }


    @Put("/email", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async editEmail(
        @Body({
            destination: "email",
            schema: BaseController.email
        }) email: string,
        @User() userInfo: UserInfo,
        @Session() session : any
    ): Promise<Response> {
        try {
            var user = await this.repository.findById(userInfo.id || "")
            //user exists
            if (user == null) {
                return {
                    status: 404
                }
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
                }
            }
            var query: any = {}

            var code = RandomGenarator.randomNumber()
            var parameters: any = {}

            parameters["name"] = user.name
            parameters["random"] = code

            var template = "submitEmailUser"

            session['userNewRandom'] = code
            session['userExpiresRandom'] = new Date(Date.now() + 120000)
            session["updateEmail"] = email
            

            try {
                var result = await EmailMessager.send({
                    template,
                    parameters,
                    receptor : user.email
                })
                if (result == false) {
                    return {
                        status: 500,
                        message: "مشکلی در سرور رخ داده"
                    }
                }
                return {
                    status : 200
                }

            } catch (error) {
                throw error
            }
        } catch (error) {
            throw error
        }
    }

    @Post("/email/confirm", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async submitEmail(
        @User() userInfo : UserInfo,
        @Body({
            destination : "code",
            schema : BaseController.random
        }) random : number,
        @Session() session :any
    ): Promise<Response> {
        try {
            var user = await this.repository.findById(userInfo.id)
        } catch (error) {
            throw error
        }
        //user exists
        if (user == null) {
            return {
                status : 404
            }
        }
        var userRandom = session["userNewRandom"]

        if (!userRandom || new Date() > session["userExpiresRandom"]) {
            return {
                status : 400,
                message : "سشن شما از بین رفته لطفا دوباره امتحان کنید"
            }
        }


        var query: any = {}

       
        if (random != userRandom) {
            return {
                status : 400 ,
                message : "کد وارد شده اشتباه است"
            }
        }

        session["confirmedEmail"] =  session["updateEmail"]

        return {
            status : 200,
            data : {},
            session
        }

    }


    @Put("/phoneNumber", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async editPhoneNumber(
        @Body({
            destination : "phoneNumber",
            schema : BaseController.phone
        }) phoneNumber : string,
        @Session() session : any,
        @User() userInfo : UserInfo
    ): Promise<Response> {

        try {
            var user = await this.repository.findById(userInfo.id || "")
           
            if (user == null) {
                return{
                    status : 404 ,
                    message : "موردی یافت نشد"
                }
            }

            //check is phoneNumber exists in another accounts
            if (await this.repository.isExists({
                _id: {
                    $ne: user._id
                },
                phoneNumber
            })) {
                return {
                    status : 400, 
                    message : "شماره تلفن تکراری است"
                }
            }

            var random = RandomGenarator.randomNumber()


            var result = await SmsMessager.send({
                parameters: {
                    name: user.name,
                    random,
                    phoneNumber
                },
                receptor: user.phoneNumber,
                template: "changePhoneChekUser"
            })

            if (result) {
                session['userNewPhoneNumber'] = phoneNumber,
                session['userNewRandom'] = random,
                session['userExpiresRandom'] = new Date(Date.now() + 120000)

                return {
                    status : 200,
                    session,
                    message : "عملیات موفق"
                }
            }
            return {
                status : 500,
                message : "مشکلی در سرور رخ داده"
            }

        } catch (error) {
            throw error
        }
    }

    @Post("/phoneNumber/confirm", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async confirmPhoneNumber(
        @Body({
            destination : "random",
            schema : BaseController.random
        }) random : number,
        @Session() session : any,
        @User() userInfo : UserInfo
    ): Promise<Response> {
        var userRandom = session["userNewRandom"]

        var user = await this.repository.findById(userInfo.id || "")
        //user exists
        if (user == null) {
            return {
                status : 404,
                message : "موردی یافت نشد"
            }
        }
        //check user expiration
        if (!userRandom || new Date() > session["userExpiresRandom"]) {
            return {
                status : 400,
                message : "سشن شما از بین رفته لطفا دوباره امتحان کنید"
            }
        }

        // check random 
        if (random != userRandom) {
            return {
                status : 400 ,
                message : "کد وارد شده اشتباه است"
            }
        }

        session["confirmedPhoneNumber"] =  session["userNewPhoneNumber"]

        return {
            status : 200,
            data : {},
            session
        }

        // return this.editById(user._id, {
        //     $set: {
        //         phoneNumber: session["userNewPhoneNumber"]
        //     }
        // }, {
        //     ok: true
        // })
    }


   
    @Put("/profile", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async profileSetting(
        @Body({
            schema : z.object({
                phoneNumber : BaseController.phone,
                email : BaseController.email,
                name : z.string(),
                family : z.string()
                
            }) 
        }) data : any,
        @Session() session : any,
        @User() userInfo : UserInfo
    ) {
        try {
            if(session["confirmedPhoneNumber"] ==undefined || session["confirmedPhoneNumber"] !=data.phone ){
                delete data["phone"]
            }
            if(session["confirmedEmail"] ==undefined || session["confirmedEmail"] !=data.email){
                delete data["email"]
            }
            else{
                data["isEmailRegistered"] = true
            }
            console.log(session["confirmedPhoneNumber"] , data)
            return await this.editById(userInfo.id , {
                $set : data
            },{
                ok : true
            })
        } catch (error) {
            throw error
        }
    }

    

    @Get("/email", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async checkEmail(
        @Query({
            destination : "email",
            schema : BaseController.email
        }) email : string,
        @User() userInfo : UserInfo
    ): Promise<Response> {
        return this.checkExists({
            "_id": {
                $ne: userInfo.id
            },
            email
        })
    }


    @Post("/chat/token", {
        apiDoc: {
            security: [{
                BasicAuth: []
            }]
        }
    })
    async getChatToken(
        @User() userInfo : UserInfo
    ): Promise<Response> {
        try {
            var user = await this.repository.findById(userInfo.id)
            if (user != null) {
                var token = await RandomGenarator.generateToken()
                await this.cacheService.setWithTtl(token, {
                    name: user.name,
                    family: user.family,
                    phoneNumber: user.phoneNumber
                }, 2 * 60)
                return {
                    status : 200,
                    data : token
                }
            }
            else {
                return {
                    status : 400,
                    message: "دیتای نامعتبر"
                }
            }
        } catch (error) {
            throw error
        }


    }
    initApis(): void {
        
    }
}

// Swageer.getInstance().addComponent()