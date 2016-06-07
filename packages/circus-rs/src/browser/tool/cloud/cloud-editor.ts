'use strict';

let { vec3 } = require('gl-matrix');
import { EventEmitter } from 'events';

import { VoxelCloud }					from '../../../common/VoxelCloud';

export class CloudEditor extends EventEmitter {

	public cloud;
	public penWidthVoxel: number = 1;
	
	private mapper;
	private section;
	private viewport;
	private penX: number;
	private penY: number;

	protected nibs: [number,number,number][];
	
	public setCloud( cloud ){
		let before = cloud;
		this.cloud = cloud;
		this.emit( 'cloudchange', before, this.cloud );
		return before;
	}
	
	public prepare( section, viewport ){
		this.section = section;
		this.viewport = viewport;
		this.mapper = this.getMapper();
	}
	
	public moveTo( ex, ey ){
		this.penX = ex;
		this.penY = ey;
		this.nibs = this.createNibs( ex, ey );
	}
	
	private createNibs( ex, ey ){
		
		let section = this.section;
		let ix = ex;
		let iy = ey;
		let penWidth = this.penWidthVoxel;

		let o1 = this.mapper( ix, iy );
		let o2 = this.mapper( ix+1, iy+1 );
		let o = [
			( o1[0] + o2[0] ) / 2,
			( o1[1] + o2[1] ) / 2,
			( o1[2] + o2[2] ) / 2,
		];
		
		let eu = vec3.normalize( vec3.create(), section.xAxis );
		let ev = vec3.normalize( vec3.create(), section.yAxis );
		
		let po = [
			o[0] - ( eu[0] + ev[0] ) * penWidth / 2,
			o[1] - ( eu[1] + ev[1] ) * penWidth / 2,
			o[2] - ( eu[2] + ev[2] ) * penWidth / 2 ];
		let px = vec3.add( vec3.create(), o, vec3.scale( vec3.create(), eu, penWidth / 2  ) ); // x方向
		let py = vec3.add( vec3.create(), o, vec3.scale( vec3.create(), ev, penWidth / 2  ) ); // y方向
		let pe = vec3.add( vec3.create(), px, vec3.scale( vec3.create(), ev, penWidth / 2 ) ); // xy方向
		
		let v0 = [
			Math.min( po[0], px[0], py[0], pe[0] ),
			Math.min( po[1], px[1], py[1], pe[1] ),
			Math.min( po[2], px[2], py[2], pe[2] )
		];
		let v1 = [
			Math.max( po[0], px[0], py[0], pe[0] ),
			Math.max( po[1], px[1], py[1], pe[1] ),
			Math.max( po[2], px[2], py[2], pe[2] )
		];
		
		let vs = this.cloud.getVoxelDimension();
		
		let nibs = [];
		let v = vec3.clone( v0 );
		while( v[0] <= v1[0] ){
			v[1] = v0[1];
			while( v[1] <= v1[1] ){
				v[2] = v0[2];
				while( v[2] <= v1[2] ){
					nibs.push( [ Math.floor(v[0]), Math.floor(v[1]), Math.floor(v[2]) ] );
					v[2] += vs[2];
				}
				v[1] += vs[1];
			}
			v[0] += vs[0];
		}
		return nibs;
	}
	
	public lineTo( ex, ey ){
		let startPoint = this.mapper( this.penX, this.penY );
		let endPoint = this.mapper( ex, ey );
		
		let [vx, vy, vz] = this.cloud.getVoxelDimension();
		
		let dx = endPoint[0] - startPoint[0];
		let dy = endPoint[1] - startPoint[1];
		let dz = endPoint[2] - startPoint[2];
		
		let count = Math.max( Math.abs(dx / vx), Math.abs(dy / vy), Math.abs(dz / vz) );
		let step = [ dx / count, dy / count, dz / count ];
		
		for( let n = 0; n < this.nibs.length; n++ ){
			let p = this.nibs[n];
			let px = p[0], py = p[1], pz = p[2];
			
			for( let i = 0; i <= count; i++ ){
				this.cloud.writePixelAt( 1, Math.floor(px), Math.floor(py), Math.floor(pz) );
				px+=step[0];
				py+=step[1];
				pz+=step[2];
			}
			
			this.nibs[n] = [ this.nibs[n][0] + dx, this.nibs[n][1] + dy, this.nibs[n][2] + dz ];
		}
		this.penX = ex;
		this.penY = ey;
	}

	public fill( ex, ey ){
		
		let section = this.section;
		let ix = ex;
		let iy = ey;

		let o1 = this.mapper( ix, iy );
		let o2 = this.mapper( ix+1, iy+1 );
		let o = [
			( o1[0] + o2[0] ) / 2,
			( o1[1] + o2[1] ) / 2,
			( o1[2] + o2[2] ) / 2,
		];
		
		let eu = vec3.normalize( vec3.create(), section.xAxis );
		let ev = vec3.normalize( vec3.create(), section.yAxis );
		let vs = this.cloud.getVoxelDimension();
		
		
	}
	
	
	/**
	 * imageDataからcloudへ書き戻す
	 */
	public applyImage( imageData ) {
		
		if( !this.cloud ) return;
		
		let vpw = imageData.width, vph = imageData.height;
		let image = imageData.data;
		
		let imageOffset = 0;
		for( let iy = 0; iy < vph; iy++ ){
			for( let ix = 0; ix < vpw; ix++ ){
				let alpha = image[ ( imageOffset << 2 ) + 3 ];
				if( alpha > 0 ){
					// console.log( '[ '+[ix,iy].toString() + ' ]' + ' #'+ imageOffset.toString() );
					this.applyCanvasDot( ix, iy );
				}
				imageOffset++;
			}
		}
	}
	
	/**
	 * canvas上の1点( ix, iy )が示す領域に対応する全てのボクセルを塗る
	 */
	private applyCanvasDot( ix,iy ){
		// TODO: use voxel-size 

		if( !this.cloud ) throw 'Target cloud is not set';
		
		let po = this.mapper( ix, iy ); // 左上端点を含む座標
		this.cloud.writePixelAt( 1, Math.floor(po[0]), Math.floor(po[1]), Math.floor(po[2]) );
		
		let px = this.mapper( ix+1, iy ); // x方向
		let py = this.mapper( ix, iy+1 ); // y方向
		let pe = this.mapper( ix+1, iy+1 ); // xy方向
		
		let v0 = [
			Math.min( po[0], px[0], py[0], pe[0] ),
			Math.min( po[1], px[1], py[1], pe[1] ),
			Math.min( po[2], px[2], py[2], pe[2] )
		];
		let v1 = [
			Math.max( po[0], px[0], py[0], pe[0] ),
			Math.max( po[1], px[1], py[1], pe[1] ),
			Math.max( po[2], px[2], py[2], pe[2] )
		];
		
		let v = vec3.clone( v0 );
		while( v[0] <= v1[0] ){
			v[1] = v0[1];
			while( v[1] <= v1[1] ){
				v[2] = v0[2];
				while( v[2] <= v1[2] ){
					this.cloud.writePixelAt( 1, Math.floor(v[0]), Math.floor(v[1]), Math.floor(v[2]) );
					// console.log( vec3.str( [Math.floor(v[0]), Math.floor(v[1]), Math.floor(v[2])] ) );
					v[2]++;
				}
				v[1]++;
			}
			v[0]++;
		}
	}

	public getMapper(){
		
		let viewport = this.viewport;
		let section = this.section;
		
		let o = section.origin;
		let u = vec3.scale( vec3.create(), section.xAxis, 1 / viewport[0] );
		let v = vec3.scale( vec3.create(), section.yAxis, 1 / viewport[1] );
		
		return function( x: number,y: number,z: number = 0 ){
			return [
				o[0] + u[0] * x + v[0] * y,
				o[1] + u[1] * x + v[1] * y,
				o[2] + u[2] * x + v[2] * y
			]
		};
	}
}

