
import FileUses, { FileUsesModel } from "./model";
import BaseRepositoryService, { RepositoryConfigOptions } from "../../repository";
import { Types } from "mongoose";


export default class FileUsesRepository extends BaseRepositoryService<FileUses> {
    constructor(options?: RepositoryConfigOptions) {
        super(FileUsesModel, options)
    }

    async checkBlackListDirectories(fileAddress: string) {
        return true
    }

    public async makeChangeFileUses(id: string, files: string[], source: string) {
        try {
            await this.deleteMany({
                file: {
                    $nin: files
                },
                useType: "inside",
                data: id
            })
            var newFiles: any[] = files.map((elem: string) => {
                return {
                    file: elem,
                    useType: "inside",
                    data: id,
                    source
                }
            })
            let res = await this.insertMany(newFiles)
            return res
        } catch (error) {
            console.log("error")
        }
    }

    public async canDelete(file: string, id: Types.ObjectId) {
        try {
            let exists = await this.isExists({
                file,
                data: {
                    $ne: id
                }
            })
            if (exists) {
                return false
            }
            return this.checkBlackListDirectories(file)
        } catch (error) {
            throw error
        }
    }
}      
