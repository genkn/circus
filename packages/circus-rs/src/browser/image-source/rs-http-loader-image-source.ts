'use strict';

import { DicomMetadata } from '../../browser/interface/dicom-metadata';
import { VolumeImageSource } from './volume-image-source';
import { RsHttpLoader } from './rs-http-loader';
import { ViewState } from '../view-state';
import { Viewer } from '../viewer/viewer';

/**
 * RsHttpLoaderImageSource is a base class of ImageSource classes which
 * need access to the CIRCUS RS server to render volume-based images.
 * It fetches the scanned MPR data either from the RS server via HTTP or from the loaded volume,
 * and then draws the scanned MPR image onto the specified canvas.
 */
export abstract class RsHttpLoaderImageSource extends VolumeImageSource {

	protected loader: RsHttpLoader;
	protected series: string;
	protected prepareLoader: Promise<any>;

	constructor({ server = 'http://localhost:3000', series = null } = {}) {
		super();
		this.loader = new RsHttpLoader(server);
		this.series = series;
		this.prepareLoader = this.prepare();
	}

	public ready(): Promise<any> {
		return this.prepareLoader;
	}

	/**
	 * Does the actual preparation.
	 * It determines the initial view state.
	 */
	public prepare(): Promise<void> {
		if (!this.series) return Promise.reject('Series is required');
		return this.loader.metadata(this.series)
			.then(meta => {
				this.meta = meta;
				return this.onMetaLoaded();
			});
	}

	/**
	 * Subclasses can do additional initialization/loading by this.
	 * this.meta is guaranteed to be non-null inside this.
	 */
	protected onMetaLoaded(): Promise<any> {
		return Promise.resolve();
	}

}
