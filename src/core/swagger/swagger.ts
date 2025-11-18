import { Response } from "../controller";
import { Plugin } from "../plugin";
import { RouteMeta } from "../decorators/parameters";
import ExpressApplication from "../expressApplication";
import { Route } from "../application"
import { generateSchema } from '@anatine/zod-openapi';
import { z } from "zod"
import fs from "fs"

interface SwaggerConfig {
    openapi: string,
    info: {
        title: string,
        description: string,
        version: string,
        contact: {
            name: string,
            url: string,
            email: string
        }
    }
    servers: {
        url: string
    }[],
    paths: any[]
    components: any,
    docExpansion? : string
}


export default class Swageer implements Plugin {
    private static instance: Swageer;
    private _config?: SwaggerConfig

    constructor() {

    }

    async init() {
        // console.log(this._config)
    }

    addComponent(key: string, conf: any) {
        // console.log(this._config)
        // console.log(key)
        if (!this._config) {
            return
        }
        if (!this._config?.components?.key) {
            this._config.components[key] = {}
        }

        this._config.components[key] = Object.assign(this._config.components[key], conf)
    }

    setConfig(config: SwaggerConfig) {
        this._config = config
    }

    serve(): Route[] {
        var routes: Route[] = []
        routes.push({
            execs: this.getJSON.bind(this),
            method: "get",
            route: "/apis",
            meta: Reflect.getMetadata("getJSON" + this.constructor.name, this)
        })

        routes.push({
            execs: this.getHTML.bind(this),
            method: "get",
            route: "/docs",
            meta: Reflect.getMetadata("getJSON" + this.constructor.name, this)
        })
        return routes
    }


    getHTML(): Response {

        return {
            data: fs.readFileSync("src/core/swagger/index.html").toString(),
            html: true,
            status: 200

        }
    }

    getJSON(): Response {
        try {
            return {
                status: 200,
                justJson: true,
                // sent: true
                data: this.getApiJSON()
            }

        } catch (error) {
            console.log(error)
            throw error
        }
    }

    getStatics() {

    }



    getApiJSON() {
        try {


            var apis: any = this._config
            var routes = ExpressApplication.getInstance().getRoutes()
            var paths: any = {}
            var contentType
            for (let i = 0; i < routes.length; i++) {

                var contentType = undefined
                if (paths[routes[i].route] == undefined) {
                    paths[routes[i].route] = {}
                }

                paths[routes[i].route][routes[i].method] = Object.assign({

                    responses: {
                        "200": {
                            "description": "ok"
                        }
                    },

                }, routes[i].apiDoc || {})
                var zod: RouteMeta = routes[i].meta?.params
                var bodyObj = undefined
                for (const key in zod) {
                    if (routes[i].route == "/api/admin/systemConfigs/:lable" && routes[i].method == "post") {
                        // console.log(routes[i].route, routes[i].method, key, zod)
                    }
                    if (zod[key].source == "body") {

                        try {
                            var obj: any = generateSchema(zod[key].schema)

                        } catch (error) {
                            // console.log(routes[i].route ,routes[i].method,"err")
                            obj = {}
                        }

                        if (zod[key].destination != undefined) {
                            var k = (zod[key].destination || "")
                            if (bodyObj == undefined) {
                                bodyObj = {
                                    type: 'object',
                                    properties: {

                                    },
                                    required: []

                                }
                            }
                            bodyObj['properties'][k] = obj
                            try {
                                if (!zod[key].schema?.isOptional()) {
                                    bodyObj.required.push(k)
                                }
                            } catch (error) {

                            }

                        }
                        else {
                            bodyObj = obj
                        }


                    }
                    if (zod[key].source == "query") {
                        try {
                            // console.log(zod[key].schema)
                            if (paths[routes[i].route][routes[i].method]['parameters'] == undefined) {
                                paths[routes[i].route][routes[i].method]['parameters'] = []
                            }
                            if (zod[key].schema)
                                paths[routes[i].route][routes[i].method]['parameters'].push({
                                    in: "query",
                                    name: zod[key].destination || "params",
                                    schema: generateSchema(zod[key].schema)
                                }
                                )
                        } catch (error) {

                        }
                    }
                    if (zod[key].source == "param") {
                        try {
                            routes[i].route = routes[i].route.replace((":" + zod[key].destination) || "", `{${zod[key].destination}}` || "")

                            if (paths[routes[i].route] == undefined)
                                paths[routes[i].route] = {}
                            if (paths[routes[i].route][routes[i].method] == undefined) {
                                paths[routes[i].route][routes[i].method] = {}
                            }
                            if (paths[routes[i].route][routes[i].method]['parameters'] == undefined) {
                                paths[routes[i].route][routes[i].method]['parameters'] = []
                            }

                            paths[routes[i].route][routes[i].method]['parameters'].push({
                                in: "path",
                                name: zod[key].destination,
                                schema: generateSchema(zod[key].schema)
                            }
                            )
                        } catch (error:any) {
                            console.log(routes[i].route, error.message, "******",routes[i].method, paths[routes[i].route])
                        }
                    }
                    if (zod[key].source == "files") {
                        contentType = "multipart/form-data"
                        var obj: any = generateSchema(z.string())
                        obj['format'] = "binary"
                        if (zod[key].destination != undefined) {
                            var k = (zod[key].destination || "")
                            if (bodyObj == undefined) {
                                bodyObj = {
                                    type: 'object',
                                    properties: {

                                    },
                                    required: []

                                }
                            }
                            if (!zod[key].schema) {
                                zod[key].schema = z.any()
                            }
                            obj['required'] = !zod[key].schema.isOptional()
                            bodyObj['properties'][k] = obj
                            if (!zod[key].schema.isOptional()) {
                                bodyObj.required.push(k)
                            }
                            else {
                                var index = bodyObj.required.findIndex((value: any, i: any) => {
                                    return value == k
                                })
                                if (index != -1)
                                    bodyObj.required.splice(index, 1)
                            }
                        }
                        else {
                            bodyObj = obj
                        }

                    }


                    if (zod[key].source == "header") {
                        if (paths[routes[i].route][routes[i].method]['parameters'] == undefined) {
                            paths[routes[i].route][routes[i].method]['parameters'] = []
                        }
                        paths[routes[i].route][routes[i].method]['parameters'].push({
                            in: "header",
                            name: zod[key].destination || "params",
                            schema: generateSchema(z.string())
                        })
                    }


                }

                if (bodyObj != undefined) {
                    contentType = contentType == undefined ? routes[i].meta['contentType'] || "application/json" : contentType

                    if (paths[routes[i].route] == undefined) {
                        paths[routes[i].route] = {}
                    }

                    if (!paths[routes[i].route][routes[i].method]) {
                        paths[routes[i].route][routes[i].method] = {}
                    }
                    paths[routes[i].route][routes[i].method]['requestBody'] = {
                        content: {

                        }
                    }
                    paths[routes[i].route][routes[i].method]['requestBody']['content'][contentType] = {
                        "schema": bodyObj
                    }
                }
            }
            apis.paths = paths
            // var routes.
            // return Object.assign(this._config, ExpressApplication.getInstance().getRoutes())
            return apis

        } catch (error) {
            console.log("error")
            throw error
        }
    }

    public static getInstance(): Swageer {
        if (!Swageer.instance) {
            Swageer.instance = new Swageer();

        }
        else {
            console.log(this.instance)
        }
        return Swageer.instance;
    }

}