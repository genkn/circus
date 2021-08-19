import Viewer from '../viewer/Viewer';
import ViewState from '../ViewState';
import DicomVolume from '../../common/DicomVolume';
import DicomVolumeLoader from './volume-loader/DicomVolumeLoader';
import MprProgram from './gl/MprProgram';
import MprImageSource from './MprImageSource';
import { createCameraToLookSection, getWebGLContext, resolveImageData } from './gl/webgl-util';
import MprImageSourceWithDicomVolume from './MprImageSourceWithDicomVolume';

interface WebGlRawVolumeMprImageSourceOptions {
  volumeLoader: DicomVolumeLoader;
}
type RGBA = [number, number, number, number];

/**
 * For debug
 */
const debugMode = 0;
type CaptureCanvasCallback = (canvas: HTMLCanvasElement) => void;

export default class WebGlRawVolumeMprImageSource extends MprImageSource
  implements MprImageSourceWithDicomVolume {
  private volume: DicomVolume | undefined;

  private backCanvas: HTMLCanvasElement;
  private glContext: WebGLRenderingContext;

  private mprProgram: MprProgram;

  private background: RGBA = [0.0, 0.0, 0.0, 0.0];

  // For debug
  public static captureCanvasCallbacks: CaptureCanvasCallback[] = [];
  public static captureCanvasElement(captureCanvasCallback: CaptureCanvasCallback) {
    WebGlRawVolumeMprImageSource.captureCanvasCallbacks.push(captureCanvasCallback);
  }

  constructor({ volumeLoader }: WebGlRawVolumeMprImageSourceOptions) {
    super();

    const backCanvas = this.createBackCanvas();
    const glContext = getWebGLContext(backCanvas);
    glContext.clearColor(...this.background);
    glContext.clearDepth(1.0);
    const mprProgram = new MprProgram(glContext);

    this.backCanvas = backCanvas;
    this.glContext = glContext;
    this.mprProgram = mprProgram;

    // For debug
    WebGlRawVolumeMprImageSource.captureCanvasCallbacks.forEach(handler => handler(backCanvas));

    this.loadSequence = (async () => {
      this.metadata = await volumeLoader.loadMeta();

      // Assign the length of the longest side of the volume to 
      // the length of the side in normalized device coordinates.
      const { voxelSize, voxelCount } = this.metadata!;
      const longestSideLengthInMmOfTheVolume = Math.max(
        voxelCount[0] * voxelSize[0],
        voxelCount[1] * voxelSize[1],
        voxelCount[2] * voxelSize[2]
      );
      mprProgram.setMmInNdc(1.0 / longestSideLengthInMmOfTheVolume);

      this.volume = await volumeLoader.loadVolume();
    })();
  }

  public getLoadedDicomVolume() {
    return this.volume;
  }

  /**
   * @todo Implements webglcontextlost/webglcontextrestored
   */
  private createBackCanvas() {
    const backCanvas = document.createElement('canvas');
    backCanvas.width = 1;
    backCanvas.height = 1;

    // backCanvas.addEventListener('webglcontextlost', _ev => {}, false);
    // backCanvas.addEventListener('webglcontextrestored', _ev => {}, false);

    return backCanvas;
  }

  private updateViewportSize([width, height]: [number, number]) {
    if (this.backCanvas.width !== width || this.backCanvas.height !== height) {
      this.backCanvas.width = width;
      this.backCanvas.height = height;
      this.glContext.viewport(0, 0, width, height);
    }
  }

  /**
   * Performs the main rendering.
   * @param viewer
   * @param viewState
   * @returns {Promise<ImageData>}
   */
  public async draw(viewer: Viewer, viewState: ViewState): Promise<ImageData> {
    if (viewState.type !== 'mpr')
      throw new Error('Unsupported view state.');

    this.updateViewportSize(viewer.getResolution());

    this.glContext.clearColor(...this.background);
    this.glContext.clear(this.glContext.COLOR_BUFFER_BIT | this.glContext.DEPTH_BUFFER_BIT);

    // Camera
    const camera = createCameraToLookSection(
      viewState.section,
      this.metadata!.voxelCount,
      this.metadata!.voxelSize
    );

    if (!this.mprProgram.isActive()) {
      this.mprProgram.activate();
    }

    this.mprProgram.setCamera(camera);

    this.mprProgram.setDicomVolume(this.volume!);
    this.mprProgram.setInterporationMode(viewState.interpolationMode);
    this.mprProgram.setViewWindow(viewState.window);

    this.mprProgram.setSection(viewState.section);
    this.mprProgram.setBackground(this.background);

    this.mprProgram.setDebugMode(debugMode);

    this.mprProgram.run();

    return resolveImageData(this.glContext);
  }
}
