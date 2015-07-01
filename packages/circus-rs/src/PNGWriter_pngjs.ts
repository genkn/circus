import PNGWriter = require('./PNGWriter');
var PNG = require('pngjs').PNG;

export = PNGWriter_pngjs;

class PNGWriter_pngjs extends PNGWriter{

	protected config: any = null;

	constructor(config: any) {
		super(config);
	}

	protected initialize() {
	}

	public write(res: any, data: Buffer, width: number, height: number): void
	{
		var png = new PNG({ width: width, height: height});
		for (var y = 0; y < png.height; y++) {
			for (var x = 0; x < png.width; x++) {
				var srcidx = (png.width * y + x);
				var dstidx = srcidx << 2;
				var pixel = data.readInt8(srcidx);
				png.data[dstidx] = pixel;
				png.data[dstidx + 1] = pixel;
				png.data[dstidx + 2] = pixel;
				png.data[dstidx + 3] = 0xff;
			}
		}

		res.writeHead(200,
		{
			'Content-Type': 'image/png',
			'Access-Control-Allow-Origin': '*'
		});
		png.pack().pipe(res);
	}
}
