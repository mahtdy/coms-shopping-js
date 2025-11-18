import BasePageRepository from "./basePage/repository"
import { BasePage } from "./basePage/model";

type FilterType = "eq" | "reg" | "list" | "gte" | "lte"

export interface QueryInterface {
    field: string,
    showField: string,
    search?: boolean,
    options?: string[],
    filters: string[]
}

export interface FromOwnFields {
    field: string,
    target: string,
    showField: string,
    filters: string[]
    foreign?: string,
    isArray?: boolean,
    element?: string,
    isDefault?: boolean
}

export interface ContentMadule {
    name: string,
    repo?: BasePageRepository<BasePage>,
    repourl?: string,
    queryData?: QueryInterface[],
    fromOwn?: FromOwnFields[],
    defaultExact?: string,
    selectData: any,
    sort: any
}


export default class ContentMaduleRegistry {
    private static instance: ContentMaduleRegistry;
    madules: ContentMadule[]
    constructor() {
        this.madules = []
    }

    public static getInstance(): ContentMaduleRegistry {
        if (!ContentMaduleRegistry.instance) {
            ContentMaduleRegistry.instance = new ContentMaduleRegistry();

        }
        return ContentMaduleRegistry.instance;

    }

    public async add(item: ContentMadule) {
        ContentMaduleRegistry.instance.madules.push(item)
    }

    public async replace(item: ContentMadule) {
        var index = this.madules.findIndex((value, index) => {
            return value.name == item.name
        })
        if(index >=0){
            this.madules[index] = item
        }
        // ContentMaduleRegistry.instance.madules.push(item)
    }
    

    // getRepository
    getRegistry(name: string): ContentMadule | undefined {
        var index = this.madules.findIndex((value, index) => {
            return value.name == name
        })

        return this.madules[index]

        return
    }

    getAllRegistriesName() {
        let names: string[] = []
        for (let i = 0; i < this.madules.length; i++) {
            let name = this.madules[i].name
            if (!names.includes(name)) {
                names.push(name)
            }
        }
        return names
    }
}