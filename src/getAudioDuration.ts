import * as fs from "fs";
import * as path from "path";
import * as aacDuration from "aac-duration";
import * as musicMetaData from "musicmetadata";
import { mp4Inspector } from "thumbcoil";

export function getAudioDuration(filepath: string): Promise<number> {
	var ext = path.extname(filepath);
	switch (ext) {
	case ".aac":
		var d: number;
		try {
			d = aacDuration(filepath);
		} catch (e) {
			return Promise.reject<number>(e);
		}

		console.log(path.basename(filepath), d);
		return Promise.resolve(d);
	case ".ogg":
		return new Promise((resolve, reject) => {
			musicMetaData(fs.createReadStream(filepath), { duration: true }, (err: any, metadata: MM.Metadata) => {
				if (err) {
					return reject(err);
				}
				console.log(path.basename(filepath), metadata.duration);
				resolve(metadata.duration);
			});
		});
	case ".mp4":
		var n: number;
		try {
			var data = fs.readFileSync(filepath);
			var moov = mp4Inspector.inspect(data).filter((o: any) => o.type === "moov")[0]; // 必須BOXなので必ず1つある
			var mvhd = moov.boxes.filter((o: any) => o.type === "mvhd")[0]; // MoVie HeaDer。moov直下の必須フィールドなので必ず1つある
			n = mvhd.duration / 1000;
		} catch (e) {
			return Promise.reject<number>(e);
		}

		console.log(path.basename(filepath), n);
		return Promise.resolve(n);
	default:
		return Promise.reject<number>(new Error("Unsupported format: " + ext));
	}
}