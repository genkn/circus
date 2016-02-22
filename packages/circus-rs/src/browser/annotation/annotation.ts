'use strict';

import { Sprite } from '../sprite';
import { VolumeViewState } from '../volume-view-state';

export abstract class Annotation {
	private collectionId: number;
	public abstract draw( canvasDomElement:HTMLCanvasElement, viewState:VolumeViewState ):Sprite;
	public setId( id: number ): void {
		this.collectionId = id;
	}
	public getId(): number{
		return this.collectionId;
	}
}
