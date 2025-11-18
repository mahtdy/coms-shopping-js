"use strict";
// import { Client } from 'linkedin-private-api';
// import request from 'request';
// var clientId = ''
// var clientSecret = ''
// var authorizationURL = 'https://www.linkedin.com/oauth/v2/authorization'
// var accessTokenURL = 'https://www.linkedin.com/oauth/v2/accessToken'
// var redirectURI = 'http://localhost:3000/callback'
// var sessionName = ''
// var sessionKeys = ['', '']
// export class LinkedIN {
//     username: string
//     password: string
//     constructor(username: string, password: string) {
//         this.username = username
//         this.password = password
//     }
//     async addPost(url: string, data: string) {
//         const client = new Client();
//         try {
//             var response = await client.login.userPass({
//                 username: this.username,
//                 password: this.password,
//             });
//             console.log("response")
//             // return await client.request.post(url, data)
//         } catch (error) {
//             console.log(error)
//             throw error
//         }
//     }
//     async publishContent(req: any, linkedinId: string, content: any) {
//         const url = 'https://api.linkedin.com/v2/shares';
//         const { title, text, shareUrl, shareThumbnailUrl } = content;
//         const body = {
//             owner: 'urn:li:person:' + linkedinId,
//             subject: title,
//             text: {
//                 text: text
//             },
//             content: {
//                 contentEntities: [{
//                     entityLocation: shareUrl,
//                     thumbnails: [{
//                         resolvedUrl: shareThumbnailUrl
//                     }]
//                 }],
//                 title: title
//             },
//             distribution: {
//                 linkedInDistributionTarget: {}
//             }
//         };
//         const headers = {
//             'Authorization': 'Bearer ' + req.session.token,
//             'cache-control': 'no-cache',
//             'X-Restli-Protocol-Version': '2.0.0',
//             'x-li-format': 'json'
//         };
//         return new Promise((resolve, reject) => {
//             request.post({ url: url, json: body, headers: headers }, (err, response, body) => {
//                 if (err) {
//                     reject(err);
//                 }
//                 resolve(body);
//             });
//         });
//     }
//     static getLinkedinId(req: any) {
//         return new Promise((resolve, reject) => {
//             const url = 'https://api.linkedin.com/v2/me';
//             const headers = {
//                 'Authorization': 'Bearer ' + req.session.token,
//                 'cache-control': 'no-cache',
//                 'X-Restli-Protocol-Version': '2.0.0'
//             };
//             request.get({ url: url, headers: headers }, (err, response, body) => {
//                 if (err) {
//                     reject(err);
//                 }
//                 resolve(JSON.parse(body).id);
//             });
//         });
//     }
//     static getAccessToken(req: any) {
//         const { code } = req.query;
//         const body = {
//             grant_type: 'authorization_code',
//             code,
//             redirect_uri: redirectURI,
//             client_id: clientId,
//             client_secret: clientSecret
//         };
//         return new Promise((resolve, reject) => {
//             request.post({ url: accessTokenURL, form: body }, (err, response, body) => {
//                 if (err) {
//                     reject(err);
//                 }
//                 resolve(JSON.parse(body));
//             }
//             );
//         });
//     }
// }
