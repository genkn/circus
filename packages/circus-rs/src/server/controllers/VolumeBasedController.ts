import * as express from 'express';
import Controller from './Controller';
import DicomVolume from '../../common/DicomVolume';
import { isUID } from '../../common/ValidatorRules';
import { StatusError } from './Error';

/**
 * VolumeBasedController is a base class of controllers
 * which need DICOM volume (as DicomVolume) specified by the 'series' query parameter.
 */
export default class VolumeBasedController extends Controller {
	protected process(req: express.Request, res: express.Response, next: express.NextFunction): void {
		if (!isUID(req.params.sid)) {
			throw StatusError.badRequest('Invalid series UID');
		}
		const series = req.params.sid;

		// TODO: Specifying image range is temporarily disabled
		this.reader.get(series).then((vol: DicomVolume) => {
			try {
				req.volume = vol;
				this.processVolume(req, res, next);
			} catch (e) {
				next(StatusError.internalServerError(e.toString()));
			}
		}).catch(err => {
			next(StatusError.notFound('Series could not be loaded'));
		});
	}

	protected processVolume(
		req: express.Request, res: express.Response, next: express.NextFunction
	): void {
		// Abstract.
		// In this method, `req.volume` is guaranteed to have valid image data.
	}
}
