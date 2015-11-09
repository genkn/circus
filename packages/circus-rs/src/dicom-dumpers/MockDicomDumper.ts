import logger from './../Logger';

import DicomDumper from './DicomDumper';
import { default as RawData, PixelFormat } from './../RawData';
import DicomVolume from './../DicomVolume';
import * as Promise from 'bluebird';

/**
 * MockDicomDumper creates dummy voluem data.
 */
export default class MockDicomDumper extends DicomDumper {

	public readDicom(dcmdir: string): Promise<DicomVolume> {
		var vol = this.makeMockVol();
		return Promise.resolve(vol);
	}

	/**
	 * Buffer data: block data in dcm_voxel_dump combined format
	 */
	public makeMockVol(): DicomVolume {
		var raw = new DicomVolume();
		raw.appendHeader({
			Dummy: 'Header'
		});
		var d = ('d' in this.config) ? this.config.d : 128;
		raw.setDimension(512, 512, d, PixelFormat.Int16);
		for (var z = 0; z < d; z++) {
			var sliceData = new Uint8Array(512 * 512 * 2);
			for (var x = 0; x < 512; x++) {
				for (var y = 0; y < 512; y++) {
					var val = ( Math.floor(x * 0.02)
						+ Math.floor(y * 0.02)
						+ Math.floor(z * 0.02) ) % 3 * 30;
					sliceData[(x + y * 512) * 2] = val;
				}
			}
			raw.insertSingleImage(z, sliceData);
		}
		raw.setVoxelDimension(0.5, 0.5, 0.5);
		raw.setEstimatedWindow(10, 100);
		return raw;
	}
}
