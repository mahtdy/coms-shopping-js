// import BaseController from "./controller";
import axios from "axios";
import Controller, { RouteMeta } from "../controller"

interface Mapper {
    index: number,
    to: "query" | "body",
    name?: string
}

interface ProxyAgent {
    url: string,
    routes: {
        method: "get" | "post" | "delete" | "put",
        url: string,
        routeMeta: RouteMeta,
        mapper: Mapper[],
        exec ?: Function
    }[]
}


export default class ProxyController extends Controller {
    agent: ProxyAgent
    constructor(
        baseRoute: string,
        agent: ProxyAgent
    ) {
        super(baseRoute)


        this.agent = agent

        for (const route of this.agent.routes) {
            const handler = async function (...args: any[]) {

                const {query , body} = this.resolveData(args, route.mapper)

                const targetUrl = this.agent.url + this.baseRoute + route.url
                try {
                    const response = await axios.request({
                        url: targetUrl,
                        method: route.method,
                        params: query,
                        data: body
                    })
                    var data = response.data
                    if(route.exec != undefined){
                        data = await route.exec(data)
                    }

                    return {
                        status: response.status,
                        data
                    }
                } catch (error: any) {
                    return {
                        status: error.response?.status || 500,
                        message: error.message,
                        data: error.response?.data
                    }
                }
            };

            Object.defineProperty(handler, 'name', { value: `proxy_${route.method}_${route.url}`, configurable: true });

            this.addRouteWithMeta(route.url, route.method, handler.bind(this), route.routeMeta);
        }


    }


    resolveData(args: any[],mapper : Mapper[]) {
        let body: any = {}
        let query : any = {}
        for (let i = 0; i < mapper.length; i++) {
            if (mapper[i].index < args.length){
                if(mapper[i].name != undefined){
                    mapper[i].to == "query"? query[mapper[i].name || ""] = args[mapper[i].index] :body[mapper[i].name || ""]   =args[mapper[i].index]
                }
                else if(args[mapper[i].index]){
                    mapper[i].to == "query"? query = args[mapper[i].index] :body =args[mapper[i].index]
                }
            }
            
        }

        return {
            body,
            query
        }
    }


}