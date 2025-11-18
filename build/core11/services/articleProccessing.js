"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsdom_1 = require("jsdom");
class ArticleContentProccessor {
    constructor() {
    }
    static async testBackLink(url, links) {
        try {
            var dom = await jsdom_1.JSDOM.fromURL(url);
        }
        catch (error) {
            throw error;
        }
        var result = [];
        var tags = dom.window.document.getElementsByTagName("a");
        var data = {};
        var urlLinks = [];
        for (let j = 0; j < tags.length; j++) {
            for (let i = 0; i < links.length; i++) {
                if (links[i].url == tags[j].href) {
                    var isFollow = true;
                    if (tags[j].rel.indexOf("nofollow") != -1) {
                        isFollow = false;
                    }
                    urlLinks.push({
                        url: tags[j].href,
                        text: tags[j].textContent || "",
                        isFollow
                    });
                }
            }
        }
        for (let i = 0; i < links.length; i++) {
            for (let j = 0; j < urlLinks.length; j++) {
                console.log(urlLinks[j].text);
                if (links[i].url == urlLinks[j].url &&
                    links[i].text == urlLinks[j].text) {
                    links[i].isExists = true;
                    links[i].isFollow = urlLinks[j].isExists;
                    urlLinks.slice(j, 1);
                    break;
                }
            }
        }
        return {
            links: links,
            extra: urlLinks
        };
    }
    static getImages(content) {
        const dom = new jsdom_1.JSDOM(content);
        let links = dom.window.document.querySelectorAll("a");
        let images = dom.window.document.querySelectorAll("img");
        let files = [];
        for (let i = 0; i < images.length; i++) {
            let link = images[i].getAttribute("src");
            files.push({
                url: link
            });
            let formats = ["webp", "png", "jpg", "jpeg"];
            for (let j = 0; j < formats.length; j++) {
                if (images[i].getAttribute(formats[j]) != null) {
                    // files.push(link as string)
                    files.push({
                        url: images[i].getAttribute(formats[j])
                    });
                }
                if (images[i].getAttribute(formats[j] + "-mb") != null) {
                    // files.push(link as string)
                    files.push({
                        url: images[i].getAttribute(formats[j] + "-mb")
                    });
                }
            }
            if (images[i].getAttribute("main-mb") != null) {
                files.push({
                    url: images[i].getAttribute("main-mb")
                });
            }
        }
        return files;
    }
    static getContentFiles(content) {
        const dom = new jsdom_1.JSDOM(content);
        let links = dom.window.document.querySelectorAll("a");
        let files = [];
        for (let i = 0; i < links.length; i++) {
            let link = links[i].getAttribute("href");
            var urlParts = link === null || link === void 0 ? void 0 : link.split("/");
            if (urlParts && urlParts.length > 0 && urlParts[urlParts.length - 1].includes("."))
                files.push(link);
        }
        let images = dom.window.document.querySelectorAll("img");
        for (let i = 0; i < images.length; i++) {
            let link = images[i].getAttribute("src");
            files.push(link);
            let formats = ["webp", "png", "jpg", "jpeg"];
            for (let j = 0; j < formats.length; j++) {
                if (images[i].getAttribute(formats[j]) != null) {
                    files.push(images[i].getAttribute(formats[j]));
                }
                if (images[i].getAttribute(formats[j] + "-mb") != null) {
                    files.push(images[i].getAttribute(formats[j] + "-mb"));
                }
            }
            if (images[i].getAttribute("main-mb") != null) {
                files.push(images[i].getAttribute("main-mb"));
            }
        }
        return files;
    }
    static getWordCount(html) {
        // Parse the HTML using jsdom
        const dom = new jsdom_1.JSDOM(html);
        // Extract the text content of the entire document
        const textContent = dom.window.document.body.textContent || "";
        // Remove extra whitespace and split by spaces to count words
        const wordCount = textContent.trim().split(/\s+/).length;
        return wordCount;
    }
    // static async proccess(content: string, articleId: Types.ObjectId): Promise<any> {
    //     var dom = new JSDOM(content)
    //     var res = this.proccess_H_Tags(dom)
    //     res["content"] = await this.proccessContent(dom)
    //     var result = await this.proccessKeyWords(content, dom, res["content"]["words"])
    //     res["keyWords"] = result.data
    //     try {
    //         var articleRepository = new ArticleRepository()
    //         articleRepository.findByIdAndUpdate(articleId, {
    //             $set: {
    //                 content: result.content
    //             }
    //         })
    //     } catch (error) {
    //         throw error
    //     }
    //     try {
    //         res["image"] = await this.proccessImage(dom)
    //     } catch (error) {
    //         throw error
    //     }
    //     res["video"] = await this.proccessVideo(dom)
    //     res["a"] = this.proccess_A_Tags(dom)
    //     return res
    // }
    // private static proccess_H_Tags(dom: JSDOM): any {
    //     var outPut: any = {}
    //     for (let i = 1; i < 7; i++) {
    //         var tags = dom.window.document.getElementsByTagName(`h${i}`)
    //         var data: any = {}
    //         data["count"] = tags.length
    //         data["values"] = []
    //         for (let j = 0; j < tags.length; j++) {
    //             data["values"].push(tags[j].textContent)
    //         }
    //         outPut[`h${i}`] = data
    //     }
    //     return outPut
    // }
    // private static async proccessImage(dom: JSDOM): Promise<any> {
    //     var images = dom.window.document.getElementsByTagName("img")
    //     var data: any = {}
    //     data["count"] = images.length
    //     data["values"] = []
    //     var noalts: number = 0
    //     for (let j = 0; j < images.length; j++) {
    //         // var response = await axios.get(images[j].src)
    //         // var length = response.headers["content-length"]
    //         var info: any = {
    //             src: images[j].src,
    //             // length: length,
    //             haveAlt: true
    //         }
    //         console.log(images[j].alt)
    //         if (images[j].alt == undefined) {
    //             info["haveAlt"] = false
    //             noalts += 1
    //         }
    //         data["values"].push(info)
    //     }
    //     data["haveAlt"] = images.length - noalts
    //     data["have'ntAlt"] = noalts
    //     return data
    // }
    static async proccessVideo(dom) {
        var videos = dom.window.document.getElementsByTagName("video");
        var data = {};
        data["count"] = videos.length;
        data["values"] = [];
        for (let j = 0; j < videos.length; j++) {
            // var response = await axios.get(videos[j].src)
            // var length = response.headers["content-length"]
            data["values"].push({
                src: videos[j].src,
                length: 0
            });
        }
        return data;
    }
}
exports.default = ArticleContentProccessor;
