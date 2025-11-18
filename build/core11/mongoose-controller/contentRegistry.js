"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ContentMaduleRegistry {
    constructor() {
        this.madules = [];
    }
    static getInstance() {
        if (!ContentMaduleRegistry.instance) {
            ContentMaduleRegistry.instance = new ContentMaduleRegistry();
        }
        return ContentMaduleRegistry.instance;
    }
    async add(item) {
        // console.log("item" , item.name)
        ContentMaduleRegistry.instance.madules.push(item);
        // console.log(await ContentMaduleRegistry.instance.madules[0].repo?.findAll({}))
    }
    // getRepository
    getRegistry(name) {
        var index = this.madules.findIndex((value, index) => {
            return value.name == name;
        });
        if (index != -1)
            return this.madules[index];
        return;
    }
    getAllRegistriesName() {
        let names = [];
        for (let i = 0; i < this.madules.length; i++) {
            let name = this.madules[i].name;
            if (!names.includes(name)) {
                names.push(name);
            }
        }
        return names;
    }
}
exports.default = ContentMaduleRegistry;
