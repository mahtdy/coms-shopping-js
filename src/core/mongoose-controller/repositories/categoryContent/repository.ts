import { Types } from "mongoose";
import BasePageRepository, { PublishOptions } from "../../basePage/repository";
import { RepositoryConfigOptions } from "../../repository";
import CategoryContent, { CategoryContentModel } from "./model";



export default class CategoryContentRepository extends BasePageRepository<CategoryContent>{
    
    constructor(options? :RepositoryConfigOptions){
        
        super({
            model : CategoryContentModel,
            typeName: "category",
            selectData : {
                type: 1,
                title : 1,
                mainImage : 1,
                author : 1,
                category: 1,
                publishDate: 1,
                insertDate: 1
            },
            sort : {
                "publishDate" :{
                    show : "زمان انتشار"
                },
                "insertDate" :{
                    show : "زمان انتشار"
                },
                "view" :{
                    show : "بازدید"
                }
            },
            population : [
                {
                    path: "catID",
                },
                {
                    path: "language",
                },
            ]
        },
        )
    }
    // public publish(id: string | Types.ObjectId, options?: PublishOptions | undefined): Promise<string> {
    //     return super.publish(id,options)
    // }
}
