import Counter from './Counter';
import ImageEncoder from './image-encoders/ImageEncoder';

import DicomVolume from '../common/DicomVolume';
import AsyncLruCache from '../common/AsyncLruCache';

import Logger from './loggers/Logger';
import DicomDumper from './dicom-dumpers/DicomDumper';
import DicomFileRepository from './dicom-file-repository/DicomFileRepository';
import AuthorizationCache from './auth/AuthorizationCache';
import Controller from './controllers/Controller';

import * as http from 'http';
import * as express from 'express';
import { Configuration } from './Configuration';
import { tokenAuthentication } from './auth/TokenAuthorization';
import { ipBasedAccessControl } from './auth/IpBasedAccessControl';

/**
 * Main server class.
 */
export default class Server {
	// injected modules
	protected logger: Logger;
	protected imageEncoder: ImageEncoder;
	protected dicomFileRepository: DicomFileRepository;
	protected dicomDumper: DicomDumper;

	public counter: Counter;
	protected express: express.Application;
	protected server: http.Server;
	protected config: Configuration;
	protected dicomReader: AsyncLruCache<DicomVolume>;
	public loadedModuleNames: string[] = [];

	constructor(
		logger: Logger,
		imageEncoder: ImageEncoder,
		dicomFileRepository: DicomFileRepository,
		dicomDumper: DicomDumper,
		config: Configuration
	) {
		this.logger = logger;
		this.loadedModuleNames.push((logger.constructor as any).name); // 'name' is ES6 feature
		this.imageEncoder = imageEncoder;
		this.loadedModuleNames.push((imageEncoder.constructor as any).name);
		this.dicomFileRepository = dicomFileRepository;
		this.loadedModuleNames.push((dicomFileRepository.constructor as any).name);
		this.dicomDumper = dicomDumper;
		this.loadedModuleNames.push((dicomDumper.constructor as any).name);
		this.config = config;

		this.logger.info('Modules loaded: ', this.loadedModuleNames.join(', '));

		this.counter = new Counter();
	}

	public getServer(): http.Server {
		return this.server;
	}

	public getApp(): express.Application {
		return this.express;
	}

	public start(): Promise<string> {
		// prepare routing
		return new Promise((resolve, reject) => {
			try {
				// create server process
				this.express = express();
				this.express.locals.counter = this.counter;
				this.express.locals.loadedModuleNames = this.loadedModuleNames;
				this.prepareRouter();
				const port = this.config.port;
				this.server = this.express.listen(port, '127.0.0.1', () => {
					const message = `Server running on port ${port}`;
					this.logger.info(message);
					resolve(message);
				});
			} catch (e) {
				console.error(e);
				this.logger.error(e);
				// This guarantees all the logs are flushed before actually exiting the program
				this.logger.shutdown().then(() => process.exit(1));
				reject(e);
			}
		});
	}

	public close(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.server.close(err => {
				if (err) {
					reject(err);
				} else {
					this.dicomReader.dispose();
					resolve(null);
				}
			});
		});
	}

	private createDicomReader(): AsyncLruCache<DicomVolume> {
		return new AsyncLruCache<DicomVolume>(
			seriesUID => {
				return this.dicomFileRepository.getSeriesLoader(seriesUID)
					.then(loaderInfo => this.dicomDumper.readDicom(loaderInfo, 'all'));
			},
			{
				maxSize: this.config.cache.memoryThreshold,
				sizeFunc: (r): number => r.dataSize
			}
		);
	}

	private prepareRouter(): void {
		const config = this.config;
		this.dicomReader = this.createDicomReader();

		const useAuth = !!config.authorization.enabled;
		this.express.locals.authorizationEnabled = useAuth;

		const authorizationCache = new AuthorizationCache(config.authorization);
		this.express.locals.authorizationCache = authorizationCache;
		const tokenAuthMiddleware = useAuth ? [tokenAuthentication(authorizationCache)] : [];
		const ipBlockerMiddleware = ipBasedAccessControl(config.authorization.tokenRequestIpFilter);

		// path name, process class name, needs token authorization
		const routes: [string, string, Array<express.Handler>][] = [
			['metadata', 'Metadata', tokenAuthMiddleware],
			['scan', 'ObliqueScan', tokenAuthMiddleware],
			['volume', 'Volume', tokenAuthMiddleware],
			['status', 'ServerStatus', []]
		];

		if (useAuth) {
			routes.push(['token', 'RequestToken', [ipBlockerMiddleware]]);
		}

		routes.forEach(route => {
			const [routeName, moduleName, middleware] = route;
			this.logger.info(`Preparing ${moduleName} controller...`);
			const module: typeof Controller = require(`./controllers/${moduleName}`).default;
			const controller = new module(this.logger, this.dicomReader, this.imageEncoder);

			const execute = (req: express.Request, res: express.Response) => {
				this.logger.info(req.url, req.hostname);
				this.counter.countUp(routeName);
				controller.execute(req, res);
			};
			this.express.get(`/${routeName}`, [...middleware, execute]);

			// CrossOrigin Resource Sharing http://www.w3.org/TR/cors/
			this.express.options(`/${routeName}`, (req, res) => controller.options(req, res));
		});
	}

}
