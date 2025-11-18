"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const googleapis = __importStar(require("googleapis"));
const errorLogger_1 = __importDefault(require("../errorLogger"));
const HttpsProxyAgent = __importStar(require("https-proxy-agent"));
googleapis.google.options({
    agent: new HttpsProxyAgent.HttpsProxyAgent("http://fodev.org:8118")
});
// import SeoDataRepository from "./repository/seoData";
// import SeoData from "../database/models/seoData";
// import logSystemError from "../core/systemErrorLogger"
// import SystemErrorLog from "../database/models/systemErrorLog";
// var googleTrends = require("google-trends-api")
// import * as cheerio from "cheerio"
const proxyUrl = 'YOUR_PROXY_URL';
const proxyPort = 'YOUR_PROXY_PORT';
const proxyUsername = 'YOUR_PROXY_USERNAME';
const proxyPassword = 'YOUR_PROXY_PASSWORD';
class SeoServices {
    constructor() {
    }
    static async getPageSpeed(url, device) {
        // var pageSpeed = googleapis.google.pagespeedonline("v5")
        // try {
        //     var result = await pageSpeed.pagespeedapi.runpagespeed({
        //         url: url,
        //         strategy: device,
        //     })
        //     return result.data
        // } catch (error) {
        //     throw error
        // }
        const apiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    }
    //     static async getOnlineInf(): Promise<any> {
    //         try {
    //             var apis = googleapis.google.getSupportedAPIs()
    //             return apis
    //         } catch (error) {
    //             throw error
    //         }
    //     }
    static async getWebMasterInfo(credential, token, domain, startDate = "2023-12-13", endDate = "2024-03-06") {
        var oAuth2Client = new googleapis.google.auth.OAuth2({
            redirectUri: credential.web.redirect_uris[0],
            clientId: credential.web.client_id,
            clientSecret: credential.web.client_secret,
        });
        oAuth2Client.setCredentials(token.token);
        var webmaster = googleapis.google.webmasters({
            version: "v3",
            auth: oAuth2Client,
        });
        try {
            var result = await webmaster.searchanalytics.query({
                siteUrl: 'sc-domain:' + domain,
                requestBody: {
                    startDate: startDate,
                    endDate: endDate,
                    dimensions: ["query"],
                }
            });
            return result.data;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    static async getWebMasterDomains(credential, token) {
        var oAuth2Client = new googleapis.google.auth.OAuth2({
            redirectUri: credential.web.redirect_uris[0],
            clientId: credential.web.client_id,
            clientSecret: credential.web.client_secret,
        });
        oAuth2Client.setCredentials(token.token);
        let webmaster = googleapis.google.webmasters({
            version: "v3",
            auth: oAuth2Client
        });
        return (await webmaster.sites.list()).data;
    }
    static async getWebMasterAllInfo(credential, token, domain, startDate = "2021-04-03", endDate = "2021-07-05") {
        var oAuth2Client = new googleapis.google.auth.OAuth2({
            redirectUri: credential.web.redirect_uris[0],
            clientId: credential.web.client_id,
            clientSecret: credential.web.client_secret,
        });
        oAuth2Client.setCredentials(token.token);
        var webmaster = googleapis.google.webmasters({
            version: "v3",
            auth: oAuth2Client,
        });
        try {
            var result = await webmaster.searchanalytics.query({
                siteUrl: 'sc-domain:' + domain,
                requestBody: {
                    startDate: startDate,
                    endDate: endDate
                },
            });
            return result.data;
        }
        catch (error) {
            throw error;
        }
        return;
    }
    static async saveWebMasterDataToDB(credential, token, domain, startDate) {
        var fromDate = new Date(startDate);
        var insertData = [];
        while (fromDate < new Date()) {
            var toDate = new Date(fromDate.getTime());
            toDate.setMonth(toDate.getMonth() + 1);
            try {
                var startRow = 1;
                while (startRow == 1 || (dataList && dataList.rows)) {
                    console.log(domain, this.getValidDateForWM(fromDate), this.getValidDateForWM(toDate));
                    var dataList = await this.getWebMasterInfoByDimension(credential, token, domain, [
                        // "query",
                        "page",
                        // "country",
                        // "device",
                        // "date",
                    ], "2024-03-12", "2024-03-14", startRow);
                    console.log("dataList", dataList.rows.length);
                    if (dataList.rows) {
                        for (let i = 0; i < dataList.rows.length; i++) {
                            if (dataList.rows[i].clicks > 3000) {
                                console.log(dataList.rows[i]);
                            }
                            if (decodeURI(dataList.rows[i].keys[0]) == "https://medirence.com/تجهیزات-پزشکی-برنا-طب-ایساتیس") {
                                console.log(dataList.rows[i]);
                            }
                            insertData.push({
                                // query: dataList.rows[i].keys[0],
                                page: dataList.rows[i].keys[0],
                                // country: dataList.rows[i].keys[2],
                                // device: dataList.rows[i].keys[3],
                                // date: dataList.rows[i].keys[4],
                                clicks: dataList.rows[i].clicks,
                                // impressions: dataList.rows[i].impressions,
                                // ctr: dataList.rows[i].ctr,
                                // position: dataList.rows[i].position
                            });
                        }
                        // try {
                        //     await seoDataRepo.insertMany(insertData as SeoData[])
                        // } catch (error) {
                        //     console.log(error)
                        // }
                    }
                    startRow += 1000;
                }
            }
            catch (error) {
            }
            fromDate.setMonth(fromDate.getMonth() + 1);
        }
        return insertData;
    }
    static async getWebMasterInfoByDimension(credential, token, domain, dimensions, startDate = "2021-04-03", endDate = "2021-07-05", startRow = 0) {
        var oAuth2Client = new googleapis.google.auth.OAuth2({
            redirectUri: credential.web.redirect_uris[0],
            clientId: credential.web.client_id,
            clientSecret: credential.web.client_secret,
        });
        oAuth2Client.setCredentials(token.token);
        var webmaster = googleapis.google.webmasters({
            version: "v3",
            auth: oAuth2Client
        });
        try {
            var result = await webmaster.searchanalytics.query({
                siteUrl: 'sc-domain:' + domain,
                requestBody: {
                    startDate: startDate,
                    endDate: endDate,
                    dimensions: dimensions,
                    startRow: startRow
                },
            });
            // console.log(result)
            return result.data;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    static listNotIndexedUrls(credential, token) {
        var oAuth2Client = new googleapis.google.auth.OAuth2({
            redirectUri: credential.web.redirect_uris[0],
            clientId: credential.web.client_id,
            clientSecret: credential.web.client_secret,
        });
        const webmasters = googleapis.google.searchconsole({
            version: "v1",
            auth: oAuth2Client
        });
        webmasters.searchanalytics.query({
            requestBody: {}
        });
        // webmasters.searchanalytics.query({
        //     requestBody:{
        //     }
        // }, (err, res) => {
        //   if (err) return console.error('The API returned an error:', err.message);
        //   const errors = res.data.urlCrawlErrorCounts;
        //   if (!errors || errors.length === 0) {
        //     console.log('No errors found.');
        //   } else {
        //     console.log('Not Indexed URLs:');
        //     errors.forEach(error => {
        //       console.log(`- ${error['count']} ${error['resolutionMethod']} ${error['first_detected']}`);
        //     });
        //   }
        // });
    }
    static async indexUrl(credential, token, url) {
        var oAuth2Client = new googleapis.google.auth.OAuth2({
            redirectUri: credential.web.redirect_uris[0],
            clientId: credential.web.client_id,
            clientSecret: credential.web.client_secret,
        });
        oAuth2Client.setCredentials(token.token);
        var indexUrl = new googleapis.indexing_v3.Indexing({
            auth: oAuth2Client
        });
        try {
            var result = await indexUrl.urlNotifications.publish({
                auth: oAuth2Client,
                requestBody: {
                    url: url,
                    type: "URL_UPDATED"
                }
            });
            return result.data;
        }
        catch (error) {
            throw error;
        }
    }
    static async getUrlMetaData(credential, token, url) {
        var oAuth2Client = new googleapis.google.auth.OAuth2({
            redirectUri: credential.web.redirect_uris[0],
            clientId: credential.web.client_id,
            clientSecret: credential.web.client_secret,
        });
        oAuth2Client.setCredentials(token.token);
        var indexUrl = new googleapis.indexing_v3.Indexing({
            auth: oAuth2Client
        });
        try {
            var result = await indexUrl.urlNotifications.getMetadata({
                auth: oAuth2Client,
                url: url
            });
            return result.data;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    // static async
    //     @logSystemError((err: Error) => {
    //         return {
    //             part: "google analytics",
    //             error: err.message,
    //             isCritical: false,
    //             otherInfo: "getAnalyticsReports"
    //         } as unknown as SystemErrorLog
    //     })
    //     static async getAnalyticsReports(
    //         credential: any,
    //         token: any,
    //         viewId: string,
    //         startDate: string = "2021-04-03",
    //         endDate: string = "2021-07-05"
    //     ): Promise<any> {
    //         var oAuth2Client = new googleapis.google.auth.OAuth2(
    //             {
    //                 redirectUri: credential.web.redirect_uris[0],
    //                 clientId: credential.web.client_id,
    //                 clientSecret: credential.web.client_secret,
    //             },
    //         )
    //         oAuth2Client.setCredentials(token.token);
    //         var analyticsReporting = new googleapis.analyticsreporting_v4.Analyticsreporting({});
    //         try {
    //             var data = await analyticsReporting.reports.batchGet({
    //                 auth: oAuth2Client,
    //                 requestBody: {
    //                     reportRequests: [
    //                         {
    //                             viewId: viewId,
    //                             dateRanges: [
    //                                 {
    //                                     startDate: startDate,
    //                                     endDate: endDate,
    //                                 },
    //                                 {
    //                                     startDate: '14daysAgo',
    //                                     endDate: '7daysAgo',
    //                                 },
    //                             ],
    //                             metrics: [
    //                                 {
    //                                     expression: 'ga:users',
    //                                 },
    //                             ],
    //                         },
    //                     ],
    //                 },
    //             })
    //             return data.data
    //         } catch (error) {
    //             throw error
    //         }
    //     }
    //     @logSystemError((err: Error) => {
    //         return {
    //             part: "google analytics",
    //             error: err.message,
    //             isCritical: false,
    //             otherInfo: "getAnalyticGoals"
    //         } as unknown as SystemErrorLog
    //     })
    //     static async getAnalyticGoals(
    //         credential: any,
    //         token: any,
    //         viewId: string,
    //         propertyId: string,
    //         accountId: string,
    //         page: number,
    //         limit: number
    //     ): Promise<any> {
    //         var analyticsReporting = new googleapis.analytics_v3.Analytics({});
    //         var oAuth2Client = new googleapis.google.auth.OAuth2(
    //             {
    //                 redirectUri: credential.web.redirect_uris[0],
    //                 clientId: credential.web.client_id,
    //                 clientSecret: credential.web.client_secret,
    //             },
    //         )
    //         oAuth2Client.setCredentials(token.token);
    //         try {
    //             var data = await analyticsReporting.management.goals.list({
    //                 auth: oAuth2Client,
    //                 accountId: accountId,
    //                 profileId: viewId,
    //                 webPropertyId: propertyId,
    //                 "start-index": (page - 1) * limit + 1,
    //                 "max-results": limit
    //             })
    //             return data.data
    //         } catch (error) {
    //             throw error
    //         }
    //     }
    //     @logSystemError((err: Error) => {
    //         return {
    //             part: "google analytics",
    //             error: err.message,
    //             isCritical: false,
    //             otherInfo: "getGoalDeatail"
    //         } as unknown as SystemErrorLog
    //     })
    //     static async getGoalDeatail(
    //         credential: any,
    //         token: any,
    //         viewId: string,
    //         goalId: string,
    //         start: string,
    //         end: string,
    //         dimensions: string[]
    //     ): Promise<any> {
    //         var dimensionList = []
    //         for (let i = 0; i < dimensions.length; i++) {
    //             dimensionList.push({
    //                 name: dimensions[i]
    //             })
    //         }
    //         var analyticsReporting = new googleapis.analyticsreporting_v4.Analyticsreporting({});
    //         var oAuth2Client = new googleapis.google.auth.OAuth2(
    //             {
    //                 redirectUri: credential.web.redirect_uris[0],
    //                 clientId: credential.web.client_id,
    //                 clientSecret: credential.web.client_secret,
    //             },
    //         )
    //         oAuth2Client.setCredentials(token.token);
    //         try {
    //             // var end = new Date()
    //             // console.log(`${end.getFullYear()}-${end.getMonth()}-${end.getDay()}`)
    //             var data = await analyticsReporting.reports.batchGet({
    //                 auth: oAuth2Client,
    //                 requestBody: {
    //                     reportRequests: [
    //                         {
    //                             viewId: viewId,
    //                             dateRanges: [
    //                                 {
    //                                     startDate: start,
    //                                     endDate: end,
    //                                 },
    //                             ],
    //                             metrics: [
    //                                 {
    //                                     expression: 'ga:goal' + goalId + 'Completions',
    //                                 },
    //                             ],
    //                             dimensions: dimensionList
    //                         },
    //                     ],
    //                 },
    //             })
    //             return data.data
    //         } catch (error) {
    //             console.log(error)
    //             throw error
    //         }
    //     }
    //     @logSystemError((err: Error) => {
    //         return {
    //             part: "google analytics",
    //             error: err.message,
    //             isCritical: false,
    //             otherInfo: "getGoalDeatail"
    //         } as unknown as SystemErrorLog
    //     })
    //     static async getGoalValueDetail(
    //         credential: any,
    //         token: any,
    //         viewId: string,
    //         goalId: string,
    //         start: string,
    //         end: string,
    //         dimensions: string[]
    //     ): Promise<any> {
    //         var analyticsReporting = new googleapis.analyticsreporting_v4.Analyticsreporting({});
    //         var dimensionList = []
    //         for (let i = 0; i < dimensions.length; i++) {
    //             dimensionList.push({
    //                 name: dimensions[i]
    //             })
    //         }
    //         var oAuth2Client = new googleapis.google.auth.OAuth2(
    //             {
    //                 redirectUri: credential.web.redirect_uris[0],
    //                 clientId: credential.web.client_id,
    //                 clientSecret: credential.web.client_secret,
    //             },
    //         )
    //         oAuth2Client.setCredentials(token.token);
    //         try {
    //             // var end = new Date()
    //             // console.log(`${end.getFullYear()}-${end.getMonth()}-${end.getDay()}`)
    //             var data = await analyticsReporting.reports.batchGet({
    //                 auth: oAuth2Client,
    //                 requestBody: {
    //                     reportRequests: [
    //                         {
    //                             viewId: viewId,
    //                             dateRanges: [
    //                                 {
    //                                     startDate: start,
    //                                     endDate: end,
    //                                 },
    //                             ],
    //                             metrics: [
    //                                 {
    //                                     expression: 'ga:goal' + goalId + 'Completions',
    //                                 },
    //                             ],
    //                             dimensions: dimensionList
    //                         },
    //                     ],
    //                 },
    //             })
    //             return data.data
    //         } catch (error) {
    //             console.log(error)
    //             throw error
    //         }
    //     }
    //     @logSystemError((err: Error) => {
    //         return {
    //             part: "google analytics",
    //             error: err.message,
    //             isCritical: false,
    //             otherInfo: "getGoalDeatail"
    //         } as unknown as SystemErrorLog
    //     })
    //     static async getGoalAllDeatail( 
    //         credential: any,
    //         token: any,
    //         viewId: string,
    //         start: string,
    //         end: string,
    //         dimensions: string[]
    //     ): Promise<any> {
    //         var dimensionList = []
    //         for (let i = 0; i < dimensions.length; i++) {
    //             dimensionList.push({
    //                 name: dimensions[i]
    //             })
    //         }
    //         var analyticsReporting = new googleapis.analyticsreporting_v4.Analyticsreporting({});
    //         var oAuth2Client = new googleapis.google.auth.OAuth2(
    //             {
    //                 redirectUri: credential.web.redirect_uris[0],
    //                 clientId: credential.web.client_id,
    //                 clientSecret: credential.web.client_secret,
    //             },
    //         )
    //         oAuth2Client.setCredentials(token.token);
    //         try {
    //             var data = await analyticsReporting.reports.batchGet({
    //                 auth: oAuth2Client,
    //                 requestBody: {
    //                     reportRequests: [
    //                         {
    //                             viewId: viewId,
    //                             dateRanges: [
    //                                 {
    //                                     startDate: start,
    //                                     endDate: end,
    //                                 },
    //                             ],
    //                             metrics: [
    //                                 {
    //                                     expression: 'ga:goalCompletionsAll',
    //                                 },
    //                             ],
    //                             dimensions: dimensionList
    //                         },
    //                     ],
    //                 },
    //             })
    //             return data.data
    //         } catch (error) {
    //             console.log(error)
    //             throw error
    //         }
    //     }
    //     @logSystemError((err: Error) => {
    //         return {
    //             part: "google analytics",
    //             error: err.message,
    //             isCritical: false,
    //             otherInfo: "getGoalDeatail"
    //         } as unknown as SystemErrorLog
    //     })
    //     static async getGoalValueAllDeatail(
    //          credential: any,
    //         token: any,
    //         viewId: string,
    //         start: string,
    //         end: string,
    //         dimensions: string[]
    //     ): Promise<any> {
    //         var dimensionList = []
    //         for (let i = 0; i < dimensions.length; i++) {
    //             dimensionList.push({
    //                 name: dimensions[i]
    //             })
    //         }
    //         var analyticsReporting = new googleapis.analyticsreporting_v4.Analyticsreporting({});
    //         var oAuth2Client = new googleapis.google.auth.OAuth2(
    //             {
    //                 redirectUri: credential.web.redirect_uris[0],
    //                 clientId: credential.web.client_id,
    //                 clientSecret: credential.web.client_secret,
    //             },
    //         )
    //         oAuth2Client.setCredentials(token.token);
    //         try {
    //             var data = await analyticsReporting.reports.batchGet({
    //                 auth: oAuth2Client,
    //                 requestBody: {
    //                     reportRequests: [
    //                         {
    //                             viewId: viewId,
    //                             dateRanges: [
    //                                 {
    //                                     startDate: start,
    //                                     endDate: end,
    //                                 },
    //                             ],
    //                             metrics: [
    //                                 {
    //                                     expression: 'ga:goalCompletionsAll',
    //                                 },
    //                             ],
    //                             dimensions: dimensionList
    //                         },
    //                     ],
    //                 },
    //             })
    //             return data.data
    //         } catch (error) {
    //             console.log(error)
    //             throw error
    //         }
    //     }
    //     @logSystemError((err: Error) => {
    //         return {
    //             part: "google analytics",
    //             error: err.message,
    //             isCritical: false,
    //             otherInfo: "insertAnalyticsGoal"
    //         } as unknown as SystemErrorLog
    //     })
    //     static async insertAnalyticsGoal(
    //          credential: any,
    //         token: any,
    //         viewId: string,
    //         propertyId: string,
    //         accountId: string,
    //         input: any
    //     ): Promise<any> {
    //         var analyticsReporting = new googleapis.analytics_v3.Analytics({});
    //         var oAuth2Client = new googleapis.google.auth.OAuth2(
    //             {
    //                 redirectUri: credential.web.redirect_uris[0],
    //                 clientId: credential.web.client_id,
    //                 clientSecret: credential.web.client_secret,
    //             },
    //         )
    //         oAuth2Client.setCredentials(token.token);
    //         try {
    //             var data = await analyticsReporting.management.goals.insert({
    //                 auth: oAuth2Client,
    //                 accountId: accountId,
    //                 profileId: viewId,
    //                 webPropertyId: propertyId,
    //                 requestBody: input
    //             })
    //             return data.data
    //         } catch (error) {
    //             // console.log(error)
    //             throw error
    //         }
    //     }
    //     @logSystemError((err: Error) => {
    //         return {
    //             part: "google analytics",
    //             error: err.message,
    //             isCritical: false,
    //             otherInfo: "updateAnalyticsGoal"
    //         } as unknown as SystemErrorLog
    //     })
    //     static async updateAnalyticsGoal(
    //          credential: any,
    //         token: any,
    //         viewId: string,
    //         propertyId: string,
    //         accountId: string,
    //         input: any
    //     ): Promise<any> {
    //         var analyticsReporting = new googleapis.analytics_v3.Analytics({});
    //         var oAuth2Client = new googleapis.google.auth.OAuth2(
    //             {
    //                 redirectUri: credential.web.redirect_uris[0],
    //                 clientId: credential.web.client_id,
    //                 clientSecret: credential.web.client_secret,
    //             },
    //         )
    //         oAuth2Client.setCredentials(token.token);
    //         try {
    //             var data = await analyticsReporting.management.goals.update({
    //                 auth: oAuth2Client,
    //                 accountId: accountId,
    //                 profileId: viewId,
    //                 webPropertyId: propertyId,
    //                 goalId: input.id,
    //                 requestBody: input
    //             })
    //             console.log(data.data)
    //             return data.data
    //         } catch (error) {
    //             console.log(error)
    //             throw error
    //         }
    //     }
    //     @logSystemError((err: Error) => {
    //         return {
    //             part: "google analytics",
    //             error: err.message,
    //             isCritical: false,
    //             otherInfo: "getAnalyticsReportsRealTime"
    //         } as unknown as SystemErrorLog
    //     })
    //     static async getAnalyticsReportsRealTime(
    //          credential: any,
    //         token: any,
    //         viewId: string
    //     ): Promise<any> {
    //         var oAuth2Client = new googleapis.google.auth.OAuth2(
    //             {
    //                 redirectUri: credential.web.redirect_uris[0],
    //                 clientId: credential.web.client_id,
    //                 clientSecret: credential.web.client_secret,
    //             },
    //         )
    //         oAuth2Client.setCredentials(token.token);
    //         var v3 = googleapis.google.analytics("v3")
    //         try {
    //             var pagesView = await v3.data.realtime.get({
    //                 auth: oAuth2Client,
    //                 ids: "ga:" + viewId,
    //                 metrics: "rt:pageviews",
    //                 dimensions: "rt:minutesAgo"
    //             })
    //             var perBrowser = await v3.data.realtime.get({
    //                 auth: oAuth2Client,
    //                 ids: "ga:" + viewId,
    //                 metrics: "rt:activeUsers",
    //                 dimensions: "rt:browser"
    //             })
    //             var perOs = await v3.data.realtime.get({
    //                 auth: oAuth2Client,
    //                 ids: "ga:" + viewId,
    //                 metrics: "rt:activeUsers",
    //                 dimensions: "rt:operatingSystem"
    //             })
    //             var perDevice = await v3.data.realtime.get({
    //                 auth: oAuth2Client,
    //                 ids: "ga:" + viewId,
    //                 metrics: "rt:activeUsers",
    //                 dimensions: "rt:deviceCategory"
    //             })
    //             var perPage = await v3.data.realtime.get({
    //                 auth: oAuth2Client,
    //                 ids: "ga:" + viewId,
    //                 metrics: "rt:activeUsers",
    //                 dimensions: "rt:pagePath"
    //             })
    //             var perReg = await v3.data.realtime.get({
    //                 auth: oAuth2Client,
    //                 ids: "ga:" + viewId,
    //                 metrics: "rt:activeUsers",
    //                 dimensions: "rt:country,rt:city"
    //             })
    //             var result = {
    //                 pagesView: pagesView.data.rows || [],
    //                 perBrowser: perBrowser.data.rows || [],
    //                 perOs: perOs.data.rows || [],
    //                 perDevice: perDevice.data.rows || [],
    //                 perReg: perReg.data.rows || [],
    //                 perPage: perPage.data.rows || [],
    //             }
    //             return result
    //         } catch (error) {
    //             throw error
    //         }
    //     }
    //     @logSystemError((err: Error) => {
    //         return {
    //             part: "google analytics",
    //             error: err.message,
    //             isCritical: false,
    //             otherInfo: "getAnalyticsReportsLanding"
    //         } as unknown as SystemErrorLog
    //     })
    //     static async getAnalyticsReportsLanding(
    //          credential: any,
    //         token: any, viewId: string,
    //         startDate: string = "2021-04-03",
    //         endDate: string = "2021-07-05"): Promise<any> {
    //         var oAuth2Client = new googleapis.google.auth.OAuth2(
    //             {
    //                 redirectUri: credential.web.redirect_uris[0],
    //                 clientId: credential.web.client_id,
    //                 clientSecret: credential.web.client_secret,
    //             },
    //         )
    //         oAuth2Client.setCredentials(token.token);
    //         var v3 = googleapis.google.analytics("v3")
    //         try {
    //             var landingPage = await v3.data.ga.get({
    //                 auth: oAuth2Client,
    //                 ids: "ga:" + viewId,
    //                 metrics: "ga:sessions,ga:percentNewSessions,ga:newUsers,ga:bounceRate,ga:pageviewsPerSession,ga:sessionDuration",
    //                 dimensions: "ga:landingPagePath",
    //                 sort: "ga:sessions",
    //                 "start-date": startDate,
    //                 "end-date": endDate
    //             })
    //             return landingPage.data.rows || []
    //         } catch (error) {
    //             throw error
    //         }
    //     }
    //     static async getTrends(geo : string , keyWord : string[] , startTime: Date , endTime : Date){
    //         return new Promise((resolve,reject) =>{
    //             googleTrends.dailyTrends({
    //                 resolution: "REGION",
    //                 geo: "IR",
    //                 keyword: ["استقلال", "پرسپولیس"],
    //                 startTime: new Date('2020-12-29'),
    //                 endTime: new Date('2021-12-29')
    //             }, function (err: any, results: any) {
    //                 if (err) {
    //                     return reject(err)
    //                 }
    //                 resolve(results)
    //             });
    //         })
    //     }
    //     static async googleRequest(query: string): Promise<string> {
    //         return new Promise((resolve, reject) => {
    //             request.get(encodeURI(`https://www.google.com/search?q=${query}&aqs=chrome.0.69i59j0i22i30l3j0i22i30i457j0i22i30l5.2448j0j7&sourceid=chrome&ie=UTF-8`),
    //                 {
    //                     headers: {
    //                         cookie: `CGIC=IocBdGV4dC9odG1sLGFwcGxpY2F0aW9uL3hodG1sK3htbCxhcHBsaWNhdGlvbi94bWw7cT0wLjksaW1hZ2UvYXZpZixpbWFnZS93ZWJwLGltYWdlL2FwbmcsKi8qO3E9MC44LGFwcGxpY2F0aW9uL3NpZ25lZC1leGNoYW5nZTt2PWIzO3E9MC45; CONSENT=YES+IR.en+20180415-11-0; ANID=AHWqTUlTfrW1XwbT1wPTmzGKm_McwcUDUFQufb20cP2clG_pyXImO5wRl6llydAu; SEARCH_SAMESITE=CgQI_5IB; __Secure-1PSIDCC=AJi4QfEMtq5x-TFkVW-caI0OyAAtnIv74ZzQrtcQ2zXifkzX22URaWj2mE7iaCANiuuRN36D; OTZ=6127559_38_42_114990_38_379890; SID=BQiU4vinzThjs4UwGcqSZsC8P3HrA9tDkSWzkUHtDS5jIYbG3KXk08QXBrfjVgiOXIS_XQ.; __Secure-1PSID=BQiU4vinzThjs4UwGcqSZsC8P3HrA9tDkSWzkUHtDS5jIYbGT922Cn4tE4SF0SucN3rfFQ.; __Secure-3PSID=BQiU4vinzThjs4UwGcqSZsC8P3HrA9tDkSWzkUHtDS5jIYbGReZm8IGtBfMXI0ppeXGQXA.; HSID=AYmRmFqVDMULv3MK7; SSID=AmgHdNNSkL3oyRqO5; APISID=ByxDvHq96NxxG18R/AQIubxihe7OM_k9x9; SAPISID=GQuqEN011FCL9AU4/AuKU8OKxQTyPsfBNL; __Secure-1PAPISID=GQuqEN011FCL9AU4/AuKU8OKxQTyPsfBNL; __Secure-3PAPISID=GQuqEN011FCL9AU4/AuKU8OKxQTyPsfBNL; NID=222=J3ue-rkjHorFSERXHkYJ8KZKK8CX4QjMgWHRr0AdigzhPB-TvEqIyKqUN1wtDzzLJ-rd48Z0B8hOiFZmI4_Nsvd2d1LFcAjE4CcQs4nxS60KkJMidCqg5qxTkPQ4fcS5g3cAh0-HNR3chSKXDYcZU85ei9M7h4RA1TNTjn4-cgKrwmQisNbNOFVYYmI06QDKuLOeOPtRfdAfJCtgQhhZyDD7uyZDwwbMjQxbljkv80JwQbBxkZHq3Y2dJAi2r4BvG3rfcWryFjaMl6lAHbUgwFM33Vp6GhZpXKhqPeDX6GTwouw; 1P_JAR=2021-09-02-07; DV=89J1daWQHSPIYBSxunNAvzIzZFpWupdw4P5MyRCtwwIAAGByNTkKG2nv-wAAACDieIlUoJVpQAAAAA2J1CISMa8n5FMPQDPPpB3RJvCDegwEUFqe9AjqK6TtHgMBqF_PyGpYvNa4x0AAlc5eWRzsvOPwMRDA-uYQ5ybMk9ezBgfA4c5I0Yx1kCWuwQGggfD0IlDE4pJrcAA; SIDCC=AJi4QfGtUZdsoX_0ISGRYWgFNuN1qiMaRs1_XW84u8zZ_cxfzHMZAw1IMvjrtwsQN_IGO-UmIw; __Secure-3PSIDCC=AJi4QfFuoFL6bnch118-OzchqsttAia76FgkbmedSGMezoi6CP3tf9sNa1Kc1BbBeNoCRd3_q_4`,
    //                         "sec-ch-ua": `"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"`,
    //                         "sec-ch-ua-mobile": "?0",
    //                         "sec-fetch-dest": "document",
    //                         "sec-fetch-mode": "navigate",
    //                         "sec-fetch-site": "same-origin",
    //                         "sec-fetch-user": "?1",
    //                         "upgrade-insecure-requests": 1,
    //                         "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36"
    //                     }
    //                 }, function (err, response) {
    //                     if (err) {
    //                         return reject(err)
    //                     }
    //                     else {
    //                         return resolve(response.body)
    //                     }
    //                 })
    //         })
    //     }
    //     @logSystemError((err: Error) => {
    //         return {
    //             part: "google search",
    //             error: err.message,
    //             isCritical: false,
    //         } as unknown as SystemErrorLog
    //     })
    //     static async searchOnGoogle(query: string): Promise<any> {
    //         try {
    //             var content = await this.googleRequest(query)
    //         } catch (error) {
    //             throw error
    //         }
    //         var dom = new JSDOM(content)
    //         var tags = dom.window.document.getElementsByTagName("a")
    //         var urls: any[] = []
    //         var i = 0
    //         for (let j = 0; j < tags.length; j++) {
    //             if (tags[j].href.search("google") == -1
    //                 && (tags[j].href.search("https") != -1 || tags[j].href.search("http") != -1)
    //                 && tags[j].getElementsByTagName("h3").length > 0
    //             ) {
    //                 var url = decodeURI(tags[j].href.substr(7, tags[j].href.length)).split("&")[0]
    //                 if (url[0] == "/") {
    //                     url = url.substr(1)
    //                 }
    //                 urls.push({
    //                     title: tags[j].getElementsByTagName("h3")[0].textContent,
    //                     description: dom.window.document.getElementsByClassName("lyLwlc")[i].textContent,
    //                     url: url
    //                 })
    //                 i++
    //             }
    //         }
    //         return urls
    //     }
    //     @logSystemError((err: Error) => {
    //         return {
    //             part: "google search result",
    //             error: err.message,
    //             isCritical: false,
    //         } as unknown as SystemErrorLog
    //     })
    //     static async getGoogleSearchResult(query: string): Promise<any> {
    //         var url = `https://www.google.com/complete/search?q=${query}&cp=1&client=gws-wiz&xssi=t&hl=en-IR&authuser=0&authuser=0&pq=%DB%8C%DB%8C&psi=4isCYsydHvSx5OUPhZiqmAw.1644309476188&dpr=1`
    //         var suggestionWords = await new Promise((resolve, reject) => {
    //             request.get(encodeURI(url),
    //                 {
    //                     proxy: "http://127.0.0.1:3128",
    //                     // encoding: "br"
    //                 }, function (err, response) {
    //                     if (err) {
    //                         return reject(err)
    //                     }
    //                     else {
    //                         var suggestion
    //                         let suggestionWords = []
    //                         try {
    //                             suggestion = JSON.parse(decodeEntities(response.body.split(")]}'")[1] || ""))
    //                             for (let i = 0; i < suggestion[0]?.length; i++) {
    //                                 suggestionWords.push(suggestion[0][i][0])
    //                             }
    //                         } catch (error) {
    //                             return reject(err)
    //                         }
    //                         return resolve(suggestionWords)
    //                     }
    //                 })
    //         })
    //         // return {}
    //         var content = await this.googleRequest(query)
    //         var dom = new JSDOM(content)
    //         var relateds = dom.window.document.getElementsByClassName("y6Uyqe")
    //         var relateds = dom.window.document.getElementsByClassName("y6Uyqe") || []
    //         relateds = relateds[0]?.getElementsByTagName("a")
    //         var relatedKeywords: string[] = []
    //         for (let i = 0; i < relateds.length || 0; i++) {
    //             if (relateds[i].textContent != null) {
    //                 relatedKeywords.push(relateds[i].textContent as string)
    //             }
    //         }
    //         var recommandTitles: string[] = []
    //         var recommandMetaDescriptions: string[] = []
    //         var urls: any[] = []
    //         var tags = dom.window.document.getElementsByTagName("a")
    //         var i = 0
    //         for (let j = 0; j < tags.length; j++) {
    //             if (tags[j].href.search("google") == -1
    //                 && (tags[j].href.search("https") != -1 || tags[j].href.search("http") != -1)
    //                 && tags[j].getElementsByTagName("h3").length > 0
    //             ) {
    //                 var url = decodeURI(tags[j].href.substr(7, tags[j].href.length)).split("&")[0]
    //                 if (url[0] == "/") {
    //                     url = url.substr(1)
    //                 }
    //                 // urls.push({
    //                 //     title: tags[j].getElementsByTagName("h3")[0].textContent,
    //                 //     description: dom.window.document.getElementsByClassName("lyLwlc")[i].textContent,
    //                 //     url: url
    //                 // })
    //                 urls.push(tags[j].href)
    //                 if (recommandTitles.indexOf(tags[j].getElementsByTagName("h3")[0].textContent as string) == -1)
    //                     recommandTitles.push(tags[j].getElementsByTagName("h3")[0].textContent as string)
    //                 if (recommandMetaDescriptions.indexOf(dom.window.document.getElementsByClassName("lyLwlc")[i]?.textContent as string) == -1)
    //                     recommandMetaDescriptions.push(dom.window.document.getElementsByClassName("lyLwlc")[i]?.textContent as string)
    //                 i++
    //             }
    //         }
    //         for (let i = 0; i < urls.length; i++) {
    //             var urlContent: any = await new Promise((resolve, reject) => {
    //                 request.get(urls[i], {
    //                     proxy: "http://127.0.0.1:3128"
    //                 }, function (err: any, response: any) {
    //                     if (err) {
    //                         return reject(err)
    //                     }
    //                     else {
    //                         resolve(response.body)
    //                     }
    //                 }
    //                 )
    //             })
    //             urlContent = urlContent.replace(/<style.*?<\/style>/g, '')
    //             urlContent = urlContent.replace(/<\/style.*?<\/style>/g, '')
    //             urlContent = urlContent.replace(/<script.*?<\/script>/g, '')
    //             urlContent = urlContent.replace(/<style.*?</g, '<')
    //             urlContent = urlContent.replace(/<script.*?</g, '<')
    //             var $ = cheerio.load(urlContent)
    //             $("style").text("")
    //             var urlDom = new JSDOM($.html())
    //             var h1 = urlDom.window.document.getElementsByTagName("h1")[0]
    //             var bodyContent = this.parseContentText(urlDom)
    //             urls[i] = {
    //                 h1: h1?.textContent,
    //                 url: urls[i],
    //                 content: bodyContent,
    //                 keyWords: this.checkKeyWordsOnContent(query, bodyContent.content)
    //             }
    //         }
    //         var keywordsAllInfo = []
    //         for (let i = 0; i < urls[0]?.keyWords.length || 0; i++) {
    //             var keyWordInfo = [
    //                 urls[0].keyWords[i][0]
    //             ]
    //             var totalWords = 0
    //             var keyWordCount = 0
    //             for (let j = 0; j < urls.length; j++) {
    //                 totalWords += urls[j].keyWords[i][1]
    //                 keyWordCount += urls[j].keyWords[i][2]
    //             }
    //             keyWordInfo.push(totalWords)
    //             keyWordInfo.push(keyWordCount)
    //             keyWordInfo.push(Math.round(keyWordCount / totalWords * 1000) / 10)
    //             keywordsAllInfo.push(keyWordInfo)
    //         }
    //         return {
    //             relatedKeywords,
    //             recommandTitles,
    //             recommandMetaDescriptions,
    //             urls,
    //             keywordsAllInfo,
    //             suggestionWords
    //         }
    //     }
    //     static async checkSentence(sentence: string) {
    //         var url = `https://www.google.com/complete/search?q=\"${sentence}"`
    //         // console.log(url)
    //         var suggestionWords = await new Promise((resolve, reject) => {
    //             request.get(encodeURI(url),
    //                 {
    //                     proxy: "http://127.0.0.1:3128",
    //                     // encoding: "br"
    //                 }, function (err, response) {
    //                     if (err) {
    //                         return reject(err)
    //                     }
    //                     else {
    //                         // var suggestion
    //                         // let suggestionWords = []
    //                         try {
    //                             console.log(response.body)
    //                             // suggestion = JSON.parse(decodeEntities(response.body.split(")]}'")[1] || ""))
    //                             // for (let i = 0; i < suggestion[0]?.length; i++) {
    //                             //     suggestionWords.push(suggestion[0][i][0])
    //                             // }
    //                         } catch (error) {
    //                             return reject(err)
    //                         }
    //                         return resolve(suggestionWords)
    //                     }
    //                 })
    //         })
    //     }
    //     static checkKeyWordsOnContent(keyWord: string, content: string) {
    //         let totalwords = content.split(" ").length
    //         var keyWords = keyWord.split(" ")
    //         keyWords = keyWords.reverse()
    //         var result: any = []
    //         var shouldToSearchKeyWords = keyWords.reduce(
    //             (subsets: any, value: any) => subsets.concat(
    //                 subsets.map((set: any) => [value, ...set])
    //             ),
    //             [[]]
    //         );
    //         shouldToSearchKeyWords = shouldToSearchKeyWords.slice(1)
    //         for (let j = 0; j < shouldToSearchKeyWords.length; j++) {
    //             var count = (content.match(new RegExp(shouldToSearchKeyWords[j].join(" "), "g")) || []).length
    //             result.push([
    //                 shouldToSearchKeyWords[j].join(" "),
    //                 totalwords,
    //                 count,
    //                 Math.round(count / totalwords * 1000) / 10
    //             ])
    //         }
    //         return result
    //     }
    //     static parseContentText(dom: JSDOM) {
    //         var content = ""
    //         var divs = dom.window.document.getElementsByTagName("div")
    //         var h2_tagsinfo = []
    //         var h3_tagsinfo = []
    //         var images_info = []
    //         var ptagsCount = 0
    //         for (let i = 0; i < divs.length; i++) {
    //             var child_tags = divs[i].children
    //             for (let j = 0; j < child_tags.length; j++) {
    //                 if (child_tags[j].tagName == "P") {
    //                     ptagsCount++
    //                 }
    //             }
    //             if (ptagsCount > 5) {
    //                 content += divs[i].textContent
    //                 var h2s = divs[i].getElementsByTagName("h2")
    //                 for (let j = 0; j < h2s.length; j++) {
    //                     var h2 = h2s[j].textContent || ""
    //                     h2 = h2.split("\t").join(" ");
    //                     h2 = h2.split("\n").join(" ")
    //                     h2_tagsinfo.push({
    //                         text: h2
    //                     })
    //                 }
    //                 var h3s = divs[i].getElementsByTagName("h3")
    //                 for (let j = 0; j < h3s.length; j++) {
    //                     var h3 = h3s[j].textContent || ""
    //                     h3 = h3.split("\t").join(" ");
    //                     h3 = h3.split("\n").join(" ")
    //                     h3_tagsinfo.push({
    //                         text: h3
    //                     })
    //                 }
    //                 var images = divs[i].getElementsByTagName("img")
    //                 for (let j = 0; j < images.length; j++) {
    //                     images_info.push({
    //                         alt: images[j].alt
    //                     })
    //                 }
    //             }
    //         }
    //         content = content.replace(/(^\s*)|(\s*$)/gi, "");
    //         content = content.replace(/[ ]{2,}/gi, " ");
    //         content = content.split("\t").join(" ");
    //         content = content.split("\n").join(" ")
    //         return {
    //             content,
    //             h2_tagsinfo,
    //             h3_tagsinfo,
    //             images_info,
    //             ptagsCount
    //         }
    //     }
    //     static async checkContentIsUnique(content: string) {
    //         content = content.replace(/<style.*?<\/style>/g, '')
    //         content = content.replace(/<\/style.*?<\/style>/g, '')
    //         content = content.replace(/<script.*?<\/script>/g, '')
    //         content = content.replace(/<style.*?</g, '<')
    //         content = content.replace(/<script.*?</g, '<')
    //         var dom = new JSDOM(content)
    //         // console.log(dom.window.document.body.textContent)
    //         content = dom.window.document.body.textContent || ""
    //         // console.log(content)
    //         var sentences = content.split(/[.]/).filter(str => { return str.length > 0 })
    //         for (let i = 0; i < 1; i++) {
    //             this.checkSentence(sentences[i])
    //         }
    //         return sentences
    //     }
    //     @logSystemError((err: Error) => {
    //         return {
    //             part: "websima",
    //             error: err.message,
    //             isCritical: false,
    //         } as unknown as SystemErrorLog
    //     })
    //     static async getKeyWordsWebSima(query: string): Promise<any> {
    //         return new Promise((resolve, reject) => {
    //             request.get(encodeURI(`https://websima.com/keyword-suggestion/?export=true&keyword=${query}`),
    //                 {
    //                     headers: {
    //                     }
    //                 }, function (err, response) {
    //                     if (err) {
    //                         return reject(err)
    //                     }
    //                     else {
    //                         var keyWords = response.body.split("\n")
    //                         var finalKeyWords = []
    //                         for (let i = 1; i < keyWords.length - 1; i++) {
    //                             var group = keyWords[i].split(",")
    //                             for (let j = 0; j < group.length; j++) {
    //                                 group[j] = group[j].replace("\"", "").replace("\"", "")
    //                             }
    //                             finalKeyWords.push(group)
    //                         }
    //                         resolve(finalKeyWords)
    //                     }
    //                 })
    //         })
    //     }
    static getValidDateForWM(date) {
        var result = date.getUTCFullYear() + "-";
        if (date.getUTCMonth() >= 9) {
            result += (date.getUTCMonth() + 1) + "-";
        }
        else {
            result += "0" + (date.getUTCMonth() + 1) + "-";
        }
        if (date.getUTCDate() >= 10) {
            result += date.getUTCDate();
        }
        else {
            result += "0" + date.getUTCDate();
        }
        return result;
    }
}
exports.default = SeoServices;
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "google page speed",
            error: err.message,
            isCritical: false,
        };
    })
], SeoServices, "getPageSpeed", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "webmaster",
            error: err.message,
            isCritical: false,
            otherInfo: "getWebMasterInfo"
        };
    })
], SeoServices, "getWebMasterInfo", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "webmaster",
            error: err.message,
            isCritical: false,
            otherInfo: "getWebMasterAllInfo"
        };
    })
], SeoServices, "getWebMasterAllInfo", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "webmaster",
            error: err.message,
            isCritical: false,
            otherInfo: "saveWebMasterDataToDB"
        };
    })
], SeoServices, "saveWebMasterDataToDB", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "webmaster",
            error: err.message,
            isCritical: false,
            otherInfo: "getWebMasterInfoByDimension"
        };
    })
], SeoServices, "getWebMasterInfoByDimension", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "google index",
            error: err.message,
            isCritical: false
        };
    })
], SeoServices, "indexUrl", null);
__decorate([
    (0, errorLogger_1.default)((err) => {
        return {
            part: "check google index",
            error: err.message,
            isCritical: false
        };
    })
], SeoServices, "getUrlMetaData", null);
// function decodeEntities(encodedString: string) {
//     var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
//     var translate: any = {
//         "nbsp": " ",
//         "amp": "&",
//         "quot": "\"",
//         "lt": "<",
//         "gt": ">"
//     };
//     return encodedString.replace(translate_re, function (match, entity) {
//         return translate[entity];
//     }).replace(/&#(\d+);/gi, function (match, numStr) {
//         var num = parseInt(numStr, 10);
//         return String.fromCharCode(num);
//     });
