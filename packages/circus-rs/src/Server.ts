/**
 * Main server class.
 */

export = Server;

import http = require('http');
var finalhandler = require('finalhandler');

// Load configuration
var config: Configuration = require('config');

import logger from './Logger';
logger.info('================================');
logger.info('CIRCUS RS is starting up...');
import log4js = require('log4js');

import Counter from './Counter';
import ImageEncoder from './image-encoder/ImageEncoder';

import RawData from './RawData';
import AsyncLruCache from './AsyncLruCache';

import DicomDumper from './DicomDumper';
import DicomServerModule from './controllers/Controller';
import PathResolver from './path-resolver/PathResolver';
import AuthorizationCache from './AuthorizationCache';

import RequestAccessTokenAction from'./controllers/RequestAccessTokenAction';

var Router = require('router');

class Server {
	public counter: Counter;

	constructor() {
		this.counter = new Counter;
	}

	public start(): void {
		// prepare routing
		try {
			var router = this.prepareRouter();
			// create server process
			var server = http.createServer();
			server.on('request', (req: http.ServerRequest, res: http.ServerResponse) => {
				router(req, res, finalhandler(req, res, {
					onerror: err => {
						this.counter.countUp('_error');
						logger.info(err.toString());
					}
				}));
			});
			server.on('error', err => {
				logger.error('Server error occurred.');
				logger.error(err);
				log4js.shutdown(() => process.exit(1));
			});
			server.listen(config.port);
			logger.info('Server running on port ' + config.port);
		} catch (e) {
			logger.error(e);
			// This guarantees all the logs are flushed before actually exiting the program
			log4js.shutdown(() => process.exit(1));
		}
	}

	private createDicomReader(): AsyncLruCache<RawData> {
		var module: string = config.pathResolver.module;
		logger.info('Using path resolver: ' + module);
		var resolverClass: typeof PathResolver = require('./path-resolver/' + module).default;
		var resolver = new resolverClass(config.pathResolver.options);
		module = config.dumper.module;
		logger.info('Using DICOM dumper: ' + module);
		var dumperClass: typeof DicomDumper = require('./' + module).default;
		var dumper = new dumperClass(config.dumper.options);
		return new AsyncLruCache<RawData>(
			seriesUID => {
				return resolver
					.resolvePath(seriesUID)
					.then(dcmdir => dumper.readDicom(dcmdir, 'all'))
			},
			{
				maxSize: config.cache.memoryThreshold,
				sizeFunc: r => r.dataSize
			}
		)
	}

	private createImageEncoder(): ImageEncoder {
		var module: string = config.imageEncoder.module;
		logger.info('Using Image Encoder: ' + module);
		var imageEncoder: typeof ImageEncoder = require('./image-encoder/' + module).default;
		return new imageEncoder(config.imageEncoder.options);
	}

	private prepareRouter(): any {
		var router = Router();
		var imageEncoder = this.createImageEncoder();
		var reader = this.createDicomReader();
		var authorizationCache = new AuthorizationCache(config.authorization);

		// path name, process class name, need authorization
		var routes: [string, string, boolean][] = [
			['metadata', 'Metadata', true],
			['mpr', 'MPRAction', true],
			['status', 'ServerStatus', false],
			['oblique', 'ObliqueAction', true]
		];
		routes.forEach(route => {
			logger.info('Loading ' + route[1] + ' module...');
			var module: typeof DicomServerModule = require('./controllers/' + route[1]).default;
			var controller = new module(reader, imageEncoder);
			controller.server = this;
			router.get('/' + route[0], (req, res) => {
				if (route[2] && config.authorization.require) {
					if (!authorizationCache.isValid(req)) {
						logger.info('401 error');
						res.setHeader('WWW-Authenticate', 'Bearer realm="CircusRS"');
						res.writeHead(401, http.STATUS_CODES[401]);
						res.write('Access denied.');
						res.end();
						return;
					}
				}

				this.counter.countUp(route[0]);
				controller.execute(req, res);
			});
			// CrossOrigin Resource Sharing http://www.w3.org/TR/cors/
			router.options('/' + route[0], (req, res) => {
				res.setHeader('Access-Control-Allow-Origin', '*');
				res.setHeader('Access-Control-Allow-Methods', 'GET');
				res.setHeader('Access-Control-Allow-Headers', 'Authorization');
				res.writeHead(200);
				res.end();
			});
		});

		if (config.authorization.require) {
			logger.info('Loading RequestAccessTokenAction module');
			var controller: RequestAccessTokenAction = new RequestAccessTokenAction(reader, imageEncoder);
			controller.setCache(authorizationCache);

			router.get('/requestToken', (req, res) => {
				this.counter.countUp('requestToken');
				var ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
				logger.info(ip);
				if (!ip.match(config.authorization.allowFrom)) {
					logger.info('401 error');
					res.writeHead(401, 'access not allowed.');
					res.end();
					return;
				}
				controller.execute(req, res);
			});
		}
		return router;
	}
}
