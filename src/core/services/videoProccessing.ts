
import ffmpeg from "fluent-ffmpeg";
import eventToPromise from "event-to-promise"
import path from "path";
import ConfigService from "./config";
import fs from "fs"
import axios from "axios"
import { DiskFileManager } from "./fileManager";


interface Dimension {
    x: number,
    y: number
}


export default class VideoProccessor {
    constructor() {

    }

    public static async getDimention(path: string): Promise<Dimension> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(path, function (err, metadata) {
                if (err) {
                    return reject(err)
                } else {
                    return resolve({
                        x: metadata.streams[0].width || 5000,
                        y: metadata.streams[0].height || 5000
                    })
                }
            });
        })

    }

    public static async screenshot(source: string, timemarks: string[]) {
        try {

            var filename = Date.now() + ".jpg"
            
            var folder = "src/uploads/tmp/"
            var dimensions = await this.getDimention(source)

            return new Promise((resolve, reject) => {
                var evn = ffmpeg(source).screenshot({
                    count: 1,
                    filename,
                    size: `${dimensions.x}x${dimensions.y}`,
                    // timestamps : [0],
                    timemarks,
                    folder,


                })
                let sended = false
                evn.on('error', function (err) {
                    console.log("err", err)
                    if (sended)
                        return
                    reject(err)
                    sended = true
                })
                    .on('progress', function (progress) {
                        // console.log(progress);
                    })
                    .on('end', async function () {
                        if (sended)
                            return
                        resolve(filename)
                        sended = true
                    })
            
                })




            // await eventToPromise(evn, 'end')

            // return filename

        } catch (error) {

            console.log(error)
            console.log("error")
        }
    }


}


export async function downloadVideo(source: string): Promise<string> {
    var filePath = ConfigService.getConfig("staticRoute") + path.basename(source)

    const response = await axios({
        method: 'GET',
        url: source,
        responseType: 'stream',
        proxy: false
    })

    response.data.pipe(fs.createWriteStream(filePath))

    return new Promise((resolve, reject) => {
        response.data.on('end', () => {
            resolve(filePath)
        })

        response.data.on('error', (err: any) => {
            reject(err)
        })
    })
}


