/**
 * Oblique Image generator Action class
 */

import RawData from '../RawData';
import Controller from './Controller';
import Oblique from '../Oblique';

import http = require('http');

import logger from '../Logger';

export default class ObliqueAction extends Controller {

	public process(query: any, res: http.ServerResponse): void {

		var window_width: number;
		var window_level: number;
		var base_axis: string;
		var alpha: number = 0.0;
		var center;

		var series = '';

		if ('ww' in query) {
			window_width = query['ww'];
		}
		if ('wl' in query) {
			window_level = query['wl'];
		}
		if ('series' in query) {
			series = query['series'];
		}
		if ('b' in query) {
			base_axis = query['b'];
		}
		if ('a' in query) {
			alpha = query['a'];
		}
		if ('c' in query) {
			center = query['c'].split(',');
		}

		if (series == '') {
			logger.warn('no series in query');
			res.writeHead(500);
			res.end();
			return;
		}
		if (base_axis != 'axial' && base_axis != 'coronal' && base_axis != 'sagittal') {
			logger.warn('b has not acceptable value: ' + base_axis);
			res.writeHead(500);
			res.end();
			return;
		}
		if (center == null || center.length != 3) {
			logger.warn('c not supplied nor three numbers.');
			res.writeHead(500);
			res.end();
			return;
		}
		if (alpha == null) {
			logger.warn('a has not acceptable value');
			res.writeHead(500);
			res.end();
			return;
		}


		this.reader.readData(series, '', (raw: RawData, error: string) => {
			if (error) {
				logger.warn(error);
				res.writeHead(404);
				res.end();
				return;
			}

			if (!window_width) {
				window_width = raw.ww;
			}
			if (!window_level) {
				window_level = raw.wl;
			}

			try {
				var result = Oblique.makeSingleOblique(raw, base_axis, center, alpha, window_width, window_level);

				res.setHeader('X-Circus-Pixel-Size', '' + result.pixel_size);
				res.setHeader('X-Circus-Pixel-Columns', '' + result.width);
				res.setHeader('X-Circus-Pixel-Rows', '' + result.height);
				res.setHeader('X-Circus-Center', '' + result.center_x + ',' + result.center_y);
				this.pngWriter.write(res, result.buffer, result.width, result.center_y);
			} catch (e) {
				logger.warn(e);
				res.writeHead(500);
				res.end();
			}

		});

	}

}
