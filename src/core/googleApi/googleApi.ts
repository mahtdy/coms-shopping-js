
import { Route } from "../application";
import { Response } from "../controller";
import { Admin, Query, Session } from "../decorators/parameters";
import SystemConfigRepository from "../mongoose-controller/repositories/system/repository";
import { Plugin } from "../plugin";
import { google } from "googleapis";
import { z } from "zod"
import SeoServices from "../services/seo";
import { AdminInfo } from "../mongoose-controller/auth/admin/admin-logIn";
import DomainRepository from "../mongoose-controller/repositories/domain/repository";
import axios from "axios"
import GoogleApiTokenRepository from "../mongoose-controller/repositories/googleApiToken/repository";
import BaseController from "../mongoose-controller/controller";



export default class GoogleApi implements Plugin {
    systemConfigRepo: SystemConfigRepository
    domainRepo: DomainRepository
    googleApiTokenRepo: GoogleApiTokenRepository
    SCOPES_YOUTUBE =
        "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly";
    SCOPES_WEBMASTER =
        "https://www.googleapis.com/auth/indexing https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly";
    SCOPES_ANALYTICS =
        'https://www.googleapis.com/auth/analytics https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly'


    constructor() {
        this.systemConfigRepo = new SystemConfigRepository()
        this.domainRepo = new DomainRepository()
        this.googleApiTokenRepo = new GoogleApiTokenRepository()
    }

    async init(): Promise<void> {
        return
    }
    serve(...args: any[]): Route[] {
        var routes: Route[] = []
        routes.push({
            execs: this.youtubeAuth.bind(this),
            method: "get",
            route: "/api/admin/youtube/auth",
            meta: Reflect.getMetadata("youtubeAuth" + this.constructor.name, this)
        })
        routes.push({
            execs: this.webmasterAuth.bind(this),
            method: "get",
            route: "/api/admin/webmaster/auth",
            meta: Reflect.getMetadata("webmasterAuth" + this.constructor.name, this)
        })
        routes.push({
            execs: this.testWebmaster.bind(this),
            method: "get",
            route: "/api/admin/webmaster/test",
            meta: Reflect.getMetadata("testWebmaster" + this.constructor.name, this)
        })
        routes.push({
            execs: this.analyticsAuth.bind(this),
            method: "get",
            route: "/api/admin/analytics/auth",
            meta: Reflect.getMetadata("analyticsAuth" + this.constructor.name, this)
        })
        routes.push({
            execs: this.googleCallBack.bind(this),
            method: "get",
            route: "/google/callback",
            meta: Reflect.getMetadata("googleCallBack" + this.constructor.name, this)
        })
        return routes
    }

    async youtubeAuth(
        @Session() session: any,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            var conf = await this.systemConfigRepo.getConfigValue("google_credential")
            var redirectUri = await this.systemConfigRepo.getConfigValue("google_api_redirect_config")
            var oAuth2Client = new google.auth.OAuth2(
                {
                    redirectUri: redirectUri || conf.web.redirect_uris[0],
                    clientId: conf.web.client_id,
                    clientSecret: conf.web.client_secret
                }
            )
            var url = oAuth2Client.generateAuthUrl({
                access_type: "offline",
                scope: this.SCOPES_YOUTUBE,
            });

            session['google_type'] = "youtube"
            return {
                status: 300,
                redirect: url,
                session
            }

        } catch (error) {
            throw error
        }
    }

    async webmasterAuth(
        @Session() session: any,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            var conf = await this.systemConfigRepo.getConfigValue("google_credential")
            var redirectUri = await this.systemConfigRepo.getConfigValue("google_api_redirect_config")
            var oAuth2Client = new google.auth.OAuth2(
                {
                    redirectUri: redirectUri || conf.web.redirect_uris[0],
                    clientId: conf.web.client_id,
                    clientSecret: conf.web.client_secret
                }
            )
            var url = oAuth2Client.generateAuthUrl({
                access_type: "offline",
                scope: this.SCOPES_WEBMASTER,
            });
            session['google_type'] = "webmaster"
            return {
                status: 300,
                redirect: url,
                session
            }
        } catch (error) {
            throw error
        }
    }



    async analyticsAuth(
        @Session() session: any,
        @Admin() admin: AdminInfo
    ): Promise<Response> {
        try {
            if (admin == undefined) {
                return {
                    status: 403,
                }
            }
            var conf = await this.systemConfigRepo.getConfigValue("google_credential")
            var redirectUri = await this.systemConfigRepo.getConfigValue("google_api_redirect_config")
            var oAuth2Client = new google.auth.OAuth2(
                {
                    redirectUri: redirectUri || conf.web.redirect_uris[0],
                    clientId: conf.web.client_id,
                    clientSecret: conf.web.client_secret
                }
            )
            var url = oAuth2Client.generateAuthUrl({
                access_type: "offline",
                scope: this.SCOPES_ANALYTICS,
            });
            session['google_type'] = "analytics"
            return {
                status: 300,
                redirect: url,
                session
            }
        } catch (error) {
            throw error
        }
    }

    async testWebmaster(
        @Query({
            destination: "domain",
            schema: BaseController.id
        }) domainId: string
    ): Promise<Response> {

        try {
            // var webmaster_conf = await this.systemConfigRepo.getConfigValue("webmaster_conf")
            var conf = await this.systemConfigRepo.getConfigValue("google_credential")
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server")
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key")

            let webmasterToken = await this.googleApiTokenRepo.findOne({
                type: "webmaster",
                domains: domainId
            })
            if (webmasterToken == null) {
                return {
                    status: 404
                }
            }

            let domain = await this.domainRepo.findById(domainId)

            let webmaster_conf = webmasterToken.token

            var google_conf = await this.systemConfigRepo.getConfigValue("google_credential")
            if (!webmaster_conf || !google_conf) {
                return {
                    status: 404
                }
            }


            let response = await axios({
                method: 'post',
                url: apiServer + "users/webmaster/domains",
                headers: {
                    "x-api-key": apikey
                },
                data: {
                    credential: conf,
                    token: webmaster_conf
                }
            })

            let domains = response.data.siteEntry

            for (let i = 0; i < domains.length; i++) {
                if (domains[i].permissionLevel == "siteUnverifiedUser") {
                    continue
                }
                let domainName = domains[i].siteUrl.replace("sc-domain:", "")

                if (domain?.domain == domainName) {
                    return {
                        status: 200,
                        data: {
                            ok: true
                        }
                    }
                }
            }

            return {
                status: 400
            }
        } catch (error) {
            console.log(error)
            throw error
        }
    }



    async googleCallBack(
        @Query({
            destination: "code",
            schema: z.string()
        }) code: string,
        @Session() session: any
    ): Promise<Response> {
        try {
            var conf = await this.systemConfigRepo.getConfigValue("google_credential")
            var redirectUri = await this.systemConfigRepo.getConfigValue("google_api_redirect_config")
            var apiServer = await this.systemConfigRepo.getConfigValue("google_api_server")
            var apikey = await this.systemConfigRepo.getConfigValue("google_api_key")
            try {
                var res = await axios({
                    method: 'post',
                    url: apiServer + "users/callback",
                    headers: {
                        "x-api-key": apikey
                    },
                    data: {
                        conf,
                        redirect_url: redirectUri,
                        code
                    }
                })


                var data = res.data


                let config = await this.googleApiTokenRepo.findOne({
                    type: session['google_type'],
                    "token.gmail": data.gmail,
                })

                if (config == null) {
                    config = await this.googleApiTokenRepo.insert({
                        type: session['google_type'],
                        token: data,
                    } as any)
                }
                else {
                    if (data["token"]?.["refresh_token"] == undefined) {
                        try {

                            data["token"]["refresh_token"] = config.token?.token?.["refresh_token"]
                        } catch (error) {

                        }
                    }
                    await this.googleApiTokenRepo.updateOne({
                        _id: config._id
                    }, {
                        $set: {
                            token: data
                        }
                    })

                    config = await this.googleApiTokenRepo.findById(config._id)
                }


                if (session['google_type'] == "webmaster") {
                    try {
                        let response = await axios({
                            method: 'post',
                            url: apiServer + "users/webmaster/domains",
                            headers: {
                                "x-api-key": apikey
                            },
                            data: {
                                credential: conf,
                                token: data
                            }
                        })

                        let domains = response.data.siteEntry
                        let domainIds = []

                        for (let i = 0; i < domains.length; i++) {
                            if (domains[i].permissionLevel == "siteUnverifiedUser") {
                                continue
                            }
                            let domainName = domains[i].siteUrl.replace("sc-domain:", "")

                            let domain = await this.domainRepo.findOne({
                                domain: domainName
                            })
                            if (domain != null) {
                                domainIds.push(domain._id)
                            }
                        }

                        await this.googleApiTokenRepo.updateOne({
                            _id: config?._id
                        }, {
                            $addToSet: {
                                domains: domainIds
                            }
                        })
                    } catch (error) {

                    }

                    return {
                        status: 301,
                        redirect: `/admin/panel/setting/webmaster?gmail=${data?.gmail as string}&expire=${data.token.expiry_date}`
                    }
                }

                else if (session['google_type'] == "analytics") {
                    try {
                        let response = await axios({
                            method: 'post',
                            url: apiServer + "users/analytics/domains",
                            headers: {
                                "x-api-key": apikey
                            },
                            data: {
                                credential: conf,
                                token: data
                            }
                        })

                        let domains = response.data
                        let domainIds: string[] = []

                        for (const key in domains) {
                            let u = new URL(key)
                            let domainName = u.host

                            let domain = await this.domainRepo.findOne({
                                domain: domainName
                            })

                            if (domain != null) {
                                domainIds.push(domain._id)


                                let scripts: any[] = domain?.scripts as any[] || []

                                let exists = false
                                for (let i = 0; i < scripts.length; i++) {
                                    if (scripts[i]?.key == "analytics") {
                                        exists = true
                                        scripts[i] = {
                                            key: "analytics",
                                            content: domains[key]["script"],
                                        }
                                    }
                                }

                                if (!exists) {
                                    scripts.push({
                                        key: "analytics",
                                        content: domains[key]["script"],
                                    })
                                }

                                exists = false
                                for (let i = 0; i < scripts.length; i++) {
                                    if (scripts[i]?.key == "analytics-measurementId") {
                                        exists = true
                                        scripts[i] = {
                                            key: "analytics-measurementId",
                                            content: domains[key]["measurementId"],
                                        }
                                    }
                                }

                                if (!exists) {
                                    scripts.push({
                                        key: "analytics-measurementId",
                                        content: domains[key]["measurementId"],
                                    })
                                }


                                exists = false
                                for (let i = 0; i < scripts.length; i++) {
                                    if (scripts[i]?.key == "analytics-property") {
                                        exists = true
                                        scripts[i] = {
                                            key: "analytics-property",
                                            content: domains[key]["property"],
                                        }
                                    }
                                }

                                if (!exists) {
                                    scripts.push({
                                        key: "analytics-property",
                                        content: domains[key]["property"],
                                    })
                                }

                                await this.domainRepo.updateOne({
                                    _id: domain?._id
                                }, {
                                    $set: {
                                        scripts
                                    }
                                })
                            }
                        }

                        await this.googleApiTokenRepo.updateOne({
                            _id: config?._id
                        }, {
                            $addToSet: {
                                domains: domainIds
                            }
                        })
                    } catch (error) {
                        console.log(error)
                    }

                    return {
                        status: 301,
                        redirect: `/admin/panel/setting/analytics?gmail=${data?.gmail as string}&expire=${data.token.expiry_date}`
                    }
                }

                else {
                    var isExists = await this.systemConfigRepo.isExists({
                        key: "youtube_conf"
                    })
                    if (isExists) {
                        this.systemConfigRepo.updateOne({
                            key: "youtube_conf"
                        }, {
                            $set: {
                                value: data
                            }

                        })
                    }
                    else
                        var cc = await this.systemConfigRepo.insert({
                            key: "youtube_conf",
                            value: data,
                            lable: "google_conf",
                            type: "Object",
                        } as any)
                }

                return {
                    status: 200,
                    session,
                    data: {
                        ok: true
                    }
                }
            } catch (error) {
                throw error
            }

        } catch (error) {
            throw error

        }

    }




}
