/// <reference path='../typings/bluebird/bluebird.d.ts' />
/// <reference path='../typings/mongoose/mongoose.d.ts' />

import fs = require('fs');
import path = require('path');
import crypto = require('crypto');
import Promise = require('bluebird');

import logger from '../Logger';
import PathResolver from './PathResolver';

try {
	var dummy = require.resolve('mongoose');
} catch (e) {
	if (e.code === 'MODULE_NOT_FOUND') {
		logger.info('Failed loading Mongoose module. Probably it is not installed with NPM.');
	}
	throw e;
}
import mongoose = require('mongoose');
var Schema = mongoose.Schema;


export default class CircusDbPathResolver extends PathResolver {
	protected mongoconfig: any;
	protected db: mongoose.Connection = null; // DB connection
	protected seriesModel: mongoose.Model<any>;
	protected storageModel: mongoose.Model<any>;

	protected initialize(): void {
		// read configuration file
		this.mongoconfig = JSON.parse(fs.readFileSync(this.config.configPath, 'utf8'));
		logger.info('Loaded MongoDB Configuration.');
	}

	public resolvePath(seriesUID: string): Promise<string> {
		var dcmdir: string;

		var hash = crypto.createHash('sha256');
		hash.update(seriesUID);
		var hashStr = hash.digest('hex');

		return new Promise<string>((resolve: (string) => void, reject) => {
			this.connect()
				.then(() => {
					var findOne = Promise.promisify(this.seriesModel.findOne).bind(this.seriesModel);
					return findOne({seriesUID: seriesUID}, 'storageID');
				})
				.then(series => {
					var findOne = Promise.promisify(this.storageModel.findOne).bind(this.storageModel);
					return findOne({storageID: series.storageID, type: 'dicom', active: true}, 'path');
				})
				.then(storage => {
					dcmdir = path.join(storage.path, hashStr.substring(0, 2), hashStr.substring(2, 4), seriesUID);
					resolve(dcmdir);
				})
				.catch((err: any) => {
					logger.error('DB Error: ' + err);
					if (this.db) {
						this.db.close();
						this.db = null;
					}
					reject(err);
				});
		});

	}

	protected connect(): Promise<any> {
		return new Promise((resolve, reject) => {
			if (this.db) {
				resolve(null);
				return;
			}
			var cfg = this.mongoconfig;
			var constr: string =
				`mongodb://${cfg.username}:${cfg.password}@${cfg.host}:${cfg.port}/${cfg.database}`;
			this.db = mongoose.createConnection(constr, (err) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(null);
			});

			// define and register schema
			var seriesSchema = new Schema({
				studyUID: String,
				seriesUID: String,
				storageID: Number
			});
			var storageSchema = new Schema({
				storageID: {type: Number},
				path: {type: String},
				active: {type: Boolean}
			});
			this.seriesModel = this.db.model('Series', seriesSchema, 'Series');
			this.storageModel = this.db.model('Storages', storageSchema, 'Storages');
		});
	}
}