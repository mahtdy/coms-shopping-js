import BaseRepositoryService, { RepositoryConfigOptions } from "../../repository";
import ImageResult, { ImageResultModel } from "./model";



export default class ImageResultRepository extends BaseRepositoryService<ImageResult>{
    constructor(options?: RepositoryConfigOptions){
        super(ImageResultModel , options)
    }
}