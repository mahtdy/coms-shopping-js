import BaseRepositoryService, { RepositoryConfigOptions } from "../../repository";
import LinkEvent , {LinkEventModel} from "./model";


export default class LinkEventRepository extends BaseRepositoryService<LinkEvent>{
    constructor(options? : RepositoryConfigOptions){
        super(LinkEventModel, options);
    }
}