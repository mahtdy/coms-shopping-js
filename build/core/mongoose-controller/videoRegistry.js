"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class VideoRegistry {
    constructor() {
        this.repos = [];
    }
    static getInstance() {
        if (!VideoRegistry.instance) {
            VideoRegistry.instance = new VideoRegistry();
        }
        return VideoRegistry.instance;
    }
    async add(item) {
        let exists = this.get(item.name);
        if (exists)
            return;
        // console.log("item" , item.name)
        VideoRegistry.instance.repos.push(item);
        // console.log(await ContentMaduleRegistry.instance.madules[0].repo?.findAll({}))
    }
    // getRepository
    get(name) {
        var index = this.repos.findIndex((value, index) => {
            return value.name == name;
        });
        if (index != -1)
            return this.repos[index];
        return;
    }
}
exports.default = VideoRegistry;
