import { EventEmitter } from 'events';
import { ViewState } from '../view-state';
import { Viewer } from '../viewer/viewer';

/**
 * ImageSource is an abstract class which represents a
 * 2D or 3D image from any source and draws it onto a given canvas.
 */
export default abstract class ImageSource extends EventEmitter {
  /**
   * Draws an image according to the current view state.
   * @return A promise which resolves with ImageData (of canvas).
   */
  public abstract draw(
    viewer: Viewer,
    viewState: ViewState
  ): Promise<ImageData>;

  /**
   * Returns a Promise instance which resolves when
   * preparation task is finished and draw() can be called.
   */
  public ready(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Creates the default view state object which will be used
   * when the image is firstly loaded to a viewer.
   */
  public abstract initialState(viewer: Viewer): ViewState;
}
