// Raw voxel container class

import { MultiRange } from 'multi-integer-range';

import { PixelFormat, PixelFormatInfo, pixelFormatInfo } from './PixelFormat';
import { Vector2D, Vector3D, Section, Box } from './geometry';

interface MprResult {
	image: Uint8Array;
	outWidth:  number;
	outHeight: number;
}

// Make sure you don't add properties
// that heavily depends on DICOM spec!

/**
 * Raw voxel container with MPR support.
 */
export default class RawData {
	/**
	 * Number of voxels.
	 */
	protected size: Vector3D = null;

	/**
	 * Pixel format.
	 */
	protected pixelFormat: PixelFormat = PixelFormat.Unknown;

	/**
	 * The size of one voxel, measured in millimeter.
	 */
	protected voxelSize: Vector3D = null;

	/**
	 * Bytes per voxel [byte/voxel]
	 */
	protected bpp: number = 1;

	/**
	 * Actual image data.
	 */
	protected data: ArrayBuffer;

	/**
	 * The array view used with the array buffer (eg, Uint8Array)
	 */
	protected view: {[offset: number]: number};

	/**
	 * Voxel reader function.
	 */
	protected read: (pos: number) => number;

	/**
	 * Voxel writer function.
	 */
	protected write: (value: number, pos: number) => void;

	/**
	 * Holds which images are already loaded in this volume.
	 * When complete, this.loadedSlices.length() will be the same as this.size[2].
	 */
	protected loadedSlices: MultiRange = new MultiRange();

	/**
	 * Gets pixel value at the specified location. Each parameter must be an integer.
	 * @param x x-coordinate
	 * @param y y-coordinate
	 * @param z z-coordinate
	 * @return Corresponding voxel value.
	 */
	public getPixelAt(x: number, y: number, z: number): number {
		return this.read(x + (y + z * this.size[1]) * this.size[0]);
	}

	/**
	 * Write pixel value at the specified location.
	 * @param value Pixel value to write.
	 * @param x x-coordinate
	 * @param y y-coordinate
	 * @param z z-coordinate
	 */
	public writePixelAt(value: number, x: number, y: number, z: number): void {
		this.write(value, x + (y + z * this.size[1]) * this.size[0]);
	}

	/**
	 * Append z to loadedSlices:MultiRange.
	 * @param z z-coordinate
	 */
	public markSliceAsLoaded(z: number): void {
		if (z < 0 || z >= this.size[2]) {
			throw new RangeError('z-index out of bounds');
		}
		this.loadedSlices.append(z);
	}

	/**
	 * Get pixel value from floating-point coordinate
	 * using bilinear interpolation.
	 * @param x x-coordinate (floating point)
	 * @param y y-coordinate (floating point)
	 * @param z z-coordinate (floating point)
	 * @return n Interpolated corresponding voxel value.
	 */
	public getPixelWithInterpolation(x: number, y: number, z: number): number {
		// Check values
		let x_end = this.size[0] - 1;
		let y_end = this.size[1] - 1;
		let z_end = this.size[2] - 1;
		if (x < 0.0 || y < 0.0 || z < 0.0 || x > x_end || y > y_end || z > z_end) {
			return 0;
		}

		// Handle edge cases
		let iz = Math.floor(z);
		if (iz >= z_end) {
			iz = z_end - 1;
			z = z_end;
		}
		let ix = Math.floor(x);
		if (ix >= x_end) {
			ix = x_end - 1;
			x = x_end;
		}
		let iy = Math.floor(y);
		if (iy >= y_end) {
			iy = y_end - 1;
			y = y_end;
		}

		// Calculate the weight of slices and determine the final value
		let value_z1 = this.getAxialInterpolation(ix, x, iy, y, iz);
		let value_z2 = this.getAxialInterpolation(ix, x, iy, y, iz + 1);
		let weight_z2 = z - iz;
		let weight_z1 = 1.0 - weight_z2;
		return value_z1 * weight_z1 + value_z2 * weight_z2;
	}

	/**
	 * Do 4-neighbor pixel interpolation within a given single axial slice.
	 * @param ix {number}
	 * @param x {number}
	 * @param iy {number}
	 * @param y {number}
	 * @param intz {number}
	 * @return n {number}
	 */
	protected getAxialInterpolation(ix: number, x: number, iy: number, y: number, intz: number): number {
		let ixp1 = ix + 1;
		let iyp1 = iy + 1;

		// p0 p1
		// p2 p3
		let rx = this.size[0];
		let offset = rx * this.size[1] * intz; // offset of p0 (top-left pixel)
		let p0 = this.read(offset + ix + iy * rx);
		let p1 = this.read(offset + ixp1 + iy * rx);
		let p2 = this.read(offset + ix + iyp1 * rx);
		let p3 = this.read(offset + ixp1 + iyp1 * rx);

		let weight_x2 = x - ix;
		let weight_x1 = 1.0 - weight_x2;
		let weight_y2 = y - iy;
		let weight_y1 = 1.0 - weight_y2;
		let value_y1 = p0 * weight_x1 + p1 * weight_x2;
		let value_y2 = p2 * weight_x1 + p3 * weight_x2;
		return (value_y1 * weight_y1 + value_y2 * weight_y2);
	}

	/**
	 * Appends and overwrites one slice.
	 * Note that the input data must be in the machine's native byte order
	 * (i.e., little endian in x64 CPUs).
	 * @param z Z coordinate of the image inserted.
	 * @param imageData The inserted image data using the machine's native byte order.
	 */
	public insertSingleImage(z: number, imageData: ArrayBuffer): void {
		if (!this.size) {
			throw new Error('Dimension not set');
		}

		let [rx, ry, rz] = this.size;
		if (z < 0 || z >= rz) {
			throw new RangeError('z-index out of bounds');
		}

		if (rx * ry * this.bpp > imageData.byteLength) {
			throw new Error('Not enough buffer length');
		}

		let byteLength = rx * ry * this.bpp; // len:byte of surface
		let offset = byteLength * z;

		let src = new Uint8Array(imageData, 0, byteLength);
		let dst = new Uint8Array(this.data, offset, byteLength);
		dst.set(src); // This overwrites the existing slice (if any)
		this.loadedSlices.append(z);
	}

	/**
	 * Gets single image at the given z-coordinate.
	 * @param z z-coordinate
	 * @return The image data
	 */
	public getSingleImage(z: number): ArrayBuffer {
		if (!this.size) {
			throw new Error('Dimension not set');
		}

		let [rx, ry, rz] = this.size;
		if (z < 0 || z >= rz) {
			throw new RangeError('z-index out of bounds');
		}

		let byteLength = rx * ry * this.bpp;
		let offset = byteLength * z;
		let src = new Uint8Array(this.data, offset, byteLength);
		let buffer = new ArrayBuffer(byteLength);
		(new Uint8Array(buffer)).set(src);
		return buffer;
	}

	/**
	 * Set the size of the volume and allocate an byte array.
	 * @param x The volume size along the x-axis ("width")
	 * @param y The volume size along the y-axis ("height")
	 * @param z The volume size along the z-axis ("depth")
	 * @param type The pixel format
	 */
	public setDimension(x: number, y: number, z: number, type: PixelFormat): void {
		if (x <= 0 || y <= 0 || z <= 0) {
			throw new Error('Invalid volume size.');
		}
		if (this.size) {
			throw new Error('Dimension already fixed.');
		}
		if (x * y * z > 1024 * 1024 * 1024) {
			throw new Error('Maximum voxel limit exceeded.');
		}
		if (type === PixelFormat.Binary && (x * y) % 8 !== 0) { // image area must be multiple of 8
			throw new Error('Number of pixels in a slice must be a multiple of 8.');
		}

		this.size = [x, y, z];
		this.pixelFormat = type;
		let pxInfo = this.getPixelFormatInfo(this.pixelFormat);
		this.data = new ArrayBuffer(this.size[0] * this.size[1] * this.size[2] * pxInfo.bpp);
		this.setAccessor();
	}

	/**
	 * Assigns a correct `read` and `write` methods according to the
	 * current pixel format.
	 */
	protected setAccessor(): void {
		let pxInfo = this.getPixelFormatInfo(this.pixelFormat);
		this.bpp = pxInfo.bpp;
		this.view = new pxInfo.arrayClass(this.data);

		if (this.pixelFormat !== PixelFormat.Binary) {
			this.read = pos => this.view[pos];
			this.write = (value, pos) => this.view[pos] = value;
		} else {
			this.read = pos => (this.view[pos >> 3] >> (7 - pos % 8)) & 1;
			this.write = (value, pos) => {
				let cur = this.view[pos >> 3]; // pos => pos/8
				cur ^= (-value ^ cur) & (1 << (7 - pos % 8)); // set n-th bit to value
				this.view[pos >> 3] = cur;
			};
		}
	}

	/**
	 * Returns the voxel number of this volume along the three axes.
	 * @return The size of this volume.
	 */
	public getDimension(): Vector3D {
		if (!this.size) {
			throw new Error('Dimension not set');
		}
		return <Vector3D>this.size.slice(0);
	}

	/**
	 * Returns the current pixel format.
	 * @return The current pixel format.
	 */
	public getPixelFormat(): PixelFormat {
		return this.pixelFormat;
	}

	/**
	 * Returns the PixelFormatInfo object if no parameter is given.
	 * Returns the corresponding PixelFormatInfo if type is set.
	 * @param type The PixelFormat value.
	 * @return The PixelFormatInfo object, which holds some
	 *     helpful information about the pixel format.
	 */
	public getPixelFormatInfo(type?: PixelFormat): PixelFormatInfo {
		if (typeof type === 'undefined') {
			type = this.pixelFormat;
		}
		return pixelFormatInfo(type);
	}

	/**
	 * Sets the size of one voxel in millimeter.
	 * @param width The size of a voxel in millimeter along x-axis.
	 * @param height The size of a voxel in millimeter along y-axis.
	 * @param depth The size of a voxel in millimeter along z-axis.
	 */
	public setVoxelDimension(width: number, height: number, depth: number): void {
		this.voxelSize = [width, height, depth];
	}

	/**
	 * Returns the size of one voxel.
	 * @return A Vector3D object representing the size of one voxel.
	 */
	public getVoxelDimension(): Vector3D {
		return <Vector3D>this.voxelSize.slice(0);
	}

	/**
	 * Calculates the volume data size in bytes.
	 * @return The byte size of the volume.
	 */
	public get dataSize(): number {
		if (!this.size) {
			throw new Error('Dimension not set');
		}
		return this.size[0] * this.size[1] * this.size[2] * this.bpp;
	}

	/**
	 * Converts this raw data to new pixel format, optionally using a filter.
	 * @param targetFormat
	 * @param mapper Optional function which is applied to
	 *     map the voxel values.
	 */
	public convert(targetFormat: PixelFormat, mapper: (number) => number): void {
		let newRaw = new RawData();
		let [rx, ry, rz] = this.size;
		newRaw.setDimension(this.size[0], this.size[1], this.size[2], targetFormat);
		for (let z = 0; z < rz; z++) {
			for (let y = 0; y < ry; y++) {
				for (let x = 0; x < rx; x++) {
					let pos = x + (y + z * this.size[1]) * this.size[0];
					let value = this.read(pos);
					if (mapper) {
						value = mapper(value);
					}
					newRaw.write(value, pos);
				}
			}
		}
		this.pixelFormat = targetFormat;
		this.data = newRaw.data;
		this.setAccessor();
	}

	/**
	 * Fills the entire volume with the specified value.
	 * @param value The value to fill. Can be a function.
	 */
	public fillAll(
		value: number | ((x: number, y: number, z: number) => number)
	): void {
		this.fillCuboid(value, { origin: [0, 0, 0], size: this.size });
	}

	/**
	 * Fills the specified cuboid region with the specified value.
	 * @param value The value to fill. Can be a function.
	 * @param box The bounding box in which the volume is filled.
	 */
	public fillCuboid(
		value: number | ((x: number, y: number, z: number) => number),
		box: Box
	): void	{
		const [x, y, z] = box.origin;
		const xmax = x + box.size[0];
		const ymax = y + box.size[1];
		const zmax = z + box.size[2];
		if (typeof value === 'number') {
			for (let zz = z; zz < zmax; zz++) {
				for (let yy = y; yy < ymax; yy++) {
					for (let xx = x; xx < xmax; xx++) {
						this.writePixelAt(value, xx, yy, zz);
					}
				}
			}
		} else {
			for (let zz = z; zz < zmax; zz++) {
				for (let yy = y; yy < ymax; yy++) {
					for (let xx = x; xx < xmax; xx++) {
						this.writePixelAt(value(xx, yy, zz), xx, yy, zz);
					}
				}
			}
		}
	}

	/**
	 * Copies the voxel data from another RawData instance.
	 * @param src The source RawData.
	 * @param srcBox The source bounding box.
	 *     If unspecified, copies whole volume.
	 * @param destOffset The point of this instance where
	 *     the source is started to be copied.
	 *     If unspecified, origin (0, 0, 0) is used.
	 */
	public copy(
		src: RawData,
		srcBox?: Box,
		offset?: Vector3D
	): void {
		if (src === this) throw new TypeError('Cannot copy from self');
		if (!srcBox) srcBox = { origin: [0, 0, 0], size: src.getDimension() };

		const [ox, oy, oz] = srcBox.origin;
		if (!offset) offset = [0, 0, 0];
		const dim = this.getDimension();

		const xmin = Math.max(0, -offset[0]);
		const xmax = Math.min(dim[0] - offset[0], srcBox.size[0]);
		const ymin = Math.max(0, -offset[1]);
		const ymax = Math.min(dim[1] - offset[1], srcBox.size[1]);
		const zmin = Math.max(0, -offset[2]);
		const zmax = Math.min(dim[2] - offset[2], srcBox.size[2]);

		for (let z = zmin; z < zmax; z++) {
			for (let y = ymin; y < ymax; y++) {
				for (let x = xmin; x < xmax; x++) {
					// TODO: Optimize if src and this share the same pixel format
					const val = src.getPixelAt(ox + x, oy + y, oz + z);
					this.writePixelAt(val, offset[0] + x, offset[1] + y, offset[2] + z);
				}
			}
		}
	}

	/**
	 * Applies window level/width.
	 * @param width The window width.
	 * @param level The window level.
	 * @param pixel The input pixel value, typically a Uint16 value.
	 * @return The windowed pixel value between 0 and 255.
	 */
	protected applyWindow(width: number, level: number, pixel: number): number {
		let value = Math.round((pixel - level + width / 2) * (255 / width));
		if (value > 255) {
			value = 255;
		} else if (value < 0) {
			value = 0;
		}
		return value;
	}

	/**
	 * Creates an orthogonal MPR (multi-planar reconstruction) image on a new array buffer.
	 * @param axis
	 * @param target
	 * @param windowWidth
	 * @param windowLevel
	 * @return promise
	 */
	public orthogonalMpr(
		axis: string,
		target: number,
		windowWidth: number,
		windowLevel: number
	): Promise<MprResult> {
		let image: Uint8Array;
		let buffer_offset = 0;
		let [rx, ry, rz] = this.size;

		let checkZranges = () => {
			if (this.loadedSlices.length() !== rz)
				throw new ReferenceError('Volume is not fully loaded to construct this MPR');
		};

		switch (axis) {
			case 'sagittal':
				checkZranges();
				image = new Uint8Array(ry * rz);
				for (let z = 0; z < rz; z++)
					for (let y = 0; y < ry; y++)
						image[buffer_offset++] =
							this.applyWindow(windowWidth, windowLevel, this.getPixelAt(target, y, z));
				return Promise.resolve({image, outWidth: ry, outHeight: rz});
			case 'coronal':
				checkZranges();
				image = new Uint8Array(rx * rz);
				for (let z = 0; z < rz; z++)
					for (let x = 0; x < rx; x++)
						image[buffer_offset++] =
							this.applyWindow(windowWidth, windowLevel, this.getPixelAt(x, target, z));
				return Promise.resolve({image, outWidth: rx, outHeight: rz});
			default:
			case 'axial':
				image = new Uint8Array(rx * ry);
				for (let y = 0; y < ry; y++)
					for (let x = 0; x < rx; x++)
						image[buffer_offset++] =
							this.applyWindow(windowWidth, windowLevel, this.getPixelAt(x, y, target));
				return Promise.resolve({image, outWidth: rx, outHeight: ry});
		}
	}

	public scanObliqueSection(
		section: Section,
		outSize: Vector2D,
		outImage: { [index: number]: number},
		windowWidth?: number,
		windowLevel?: number
	): void {
		const eu: Vector3D = [
			section.xAxis[0] / outSize[0],
			section.xAxis[1] / outSize[0],
			section.xAxis[2] / outSize[0]
		];
		const ev: Vector3D = [
			section.yAxis[0] / outSize[1],
			section.yAxis[1] / outSize[1],
			section.yAxis[2] / outSize[1]
		];
		this.scanOblique(section.origin, eu, ev, outSize, outImage, windowWidth, windowLevel);
	}

	public scanObliqueSectionInMillimeter(
		mmSection: Section,
		outSize: Vector2D,
		outImage: { [index: number]: number},
		windowWidth?: number,
		windowLevel?: number
	): void {
		const voxelSize = this.voxelSize;

		// convert from mm-coordinate to index-coordinate
		const indexSection: Section = {
			origin: [
				mmSection.origin[0] / voxelSize[0],
				mmSection.origin[1] / voxelSize[1],
				mmSection.origin[2] / voxelSize[2]
			],
			xAxis: [
				mmSection.xAxis[0] / voxelSize[0],
				mmSection.xAxis[1] / voxelSize[1],
				mmSection.xAxis[2] / voxelSize[2]
			],
			yAxis: [
				mmSection.yAxis[0] / voxelSize[0],
				mmSection.yAxis[1] / voxelSize[1],
				mmSection.yAxis[2] / voxelSize[2]
			]
		};

		this.scanObliqueSection(
			indexSection,
			outSize,
			outImage,
			windowWidth,
			windowLevel
		);
	}

	/**
	 * Scan over the volume and make an oblique image,
	 * starting from origin and along with the plane defined by eu/ev.
	 * The result is written to `image`.
	 * If windowWidth/Level is given, output image will be an Uint8Array.
	 * Otherwise, the output image must have the same pixel format as the
	 * source volume data.
	 * @param origin {Vector3D}
	 * @param eu {Vector3D}
	 * @param ev {Vector3D}
	 * @param outSize {Vector2D}
	 * @param image {{[index: number]: number}}
	 * @param windowWidth {?number}
	 * @param windowLevel {?number}
	 */
	public scanOblique(
		origin: Vector3D,
		eu: Vector3D,
		ev: Vector3D,
		outSize: Vector2D,
		image: {[index: number]: number},
		windowWidth?: number,
		windowLevel?: number
	): void {
		let [rx, ry, rz] = this.size;
		let [x, y, z] = origin;
		let [eu_x, eu_y, eu_z] = eu;
		let [ev_x, ev_y, ev_z] = ev;
		let [outWidth, outHeight] = outSize;

		let imageOffset = 0;
		let value: number;

		let useWindow = (typeof windowWidth === 'number' && typeof windowLevel === 'number');

		for (let j = 0; j < outHeight; j++) {
			let [pos_x, pos_y, pos_z] = [x, y, z];

			for (let i = 0; i < outWidth; i++) {
				if (pos_x >= 0.0 && pos_y >= 0.0 && pos_z >= 0.0
					&& pos_x <= rx - 1 && pos_y <= ry - 1 && pos_z <= rz - 1) {
					value = this.getPixelWithInterpolation(pos_x, pos_y, pos_z);
					if (useWindow) {
						value = this.applyWindow(windowWidth, windowLevel, value);
					}
				} else {
					value = 0;
				}
				image[imageOffset++] = Math.round(value);

				pos_x += eu_x;
				pos_y += eu_y;
				pos_z += eu_z;
			}
			x += ev_x;
			y += ev_y;
			z += ev_z;
		}
	}

	/**
	 * Returns the dimension of this volume measured in millimeter.
	 */
	public getMmDimension(): Vector3D {
		if (!this.size) throw new Error('Dimension not set');
		if (!this.voxelSize) throw new Error('Voxel size not set');

		return [
			this.size[0] * this.voxelSize[0],
			this.size[1] * this.voxelSize[1],
			this.size[2] * this.voxelSize[2]
		];
	}

}
