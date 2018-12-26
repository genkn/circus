interface WebGlContextManagerOptions {
  width: number;
  height: number;
}

/**
 * Generic utility wrapper to handle WebGL context
 * and various associated resources.
 */
export default class WebGlContextManager {
  public gl: WebGLRenderingContext;

  public buffers: {
    [key: string]: {
      target: number;
      buffer: WebGLBuffer;
      type: number;
      itemSize: number;
      numItems: number | null;
    };
  } = {};
  public attrIndex: { [key: string]: number } = {};
  public uniformIndex: { [key: string]: WebGLUniformLocation } = {};

  private vertexShaderSource: string | undefined;
  private fragmentShaderSource: string | undefined;
  private attrNames: string[] = [];
  private uniformNames: string[] = [];

  constructor({ width, height }: WebGlContextManagerOptions) {
    const backCanvas: HTMLCanvasElement = document.createElement('canvas');
    backCanvas.width = width;
    backCanvas.height = height;
    backCanvas.style.borderTop = '1px solid #666';

    // Handles lost contexts
    backCanvas.addEventListener(
      'webglcontextlost',
      this.glHandleContextLost.bind(this),
      false
    );
    backCanvas.addEventListener(
      'webglcontextrestored',
      this.glHandleContextRestored.bind(this),
      false
    );

    // Show the background canvas for debugging
    // const wrapper: HTMLElement | null = document.querySelector('#back-canvas');
    // if (wrapper) wrapper.insertBefore(backCanvas, wrapper.firstChild);

    // Retreives WebGL context
    const gl =
      backCanvas.getContext('webgl') ||
      backCanvas.getContext('experimental-webgl');
    if (!gl) throw new Error('Failed to get WegGL context');

    gl.viewport(0, 0, width, height);

    this.gl = gl;
  }

  public registerVertexShader(source: string): void {
    this.vertexShaderSource = source;
  }

  public registerFragmentShader(source: string): void {
    this.fragmentShaderSource = source;
  }

  public registerAttr(name: string): void {
    this.attrNames.push(name);
  }

  public registerUniform(name: string): void {
    this.uniformNames.push(name);
  }

  public registerBuffer(
    name: string,
    target: number,
    type: number,
    itemSize: number = 1
  ): void {
    const gl = this.gl;

    const buffer = gl.createBuffer();
    if (!buffer) throw new Error('Cannot create buffer');

    this.buffers[name] = {
      target,
      buffer,
      type,
      itemSize,
      numItems: null
    };
  }

  public bufferData(
    name: string,
    srcData: ArrayBufferView,
    usage: number
  ): void {
    const gl = this.gl;

    if (!this.buffers[name]) throw Error('Not registered buffer: ' + name);

    if (srcData.byteLength % this.buffers[name].itemSize !== 0)
      throw Error('Invalid source data size');

    const { target, buffer, type, itemSize } = this.buffers[name];

    let typeSize;
    switch (type) {
      case gl.UNSIGNED_SHORT:
        typeSize = 2;
        break;
      case gl.FLOAT:
        typeSize = 4;
        break;
      default:
        throw Error('Unknown type');
    }

    this.buffers[name].numItems = srcData.byteLength / itemSize / typeSize;
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, srcData as any, usage); // TODO: Fix this type issue
  }

  public bindBufferToAttr(
    bufferName: string,
    attrName: string,
    normalized: boolean = false,
    stride: number = 0,
    offset: number = 0
  ): void {
    const gl = this.gl;

    if (this.attrIndex[attrName] === undefined)
      throw Error('Not registered attribute: ' + attrName);

    if (!this.buffers[bufferName] === undefined)
      throw Error('Not registered buffer: ' + bufferName);

    const attrIndex = this.attrIndex[attrName];
    const { buffer, target, itemSize, type } = this.buffers[bufferName];

    gl.bindBuffer(target, buffer);

    gl.enableVertexAttribArray(attrIndex);
    gl.vertexAttribPointer(
      attrIndex,
      itemSize,
      type,
      normalized,
      stride,
      offset
    );
  }

  public drawBuffer(
    bufferName: string,
    mode: number,
    offset: number = 0
  ): void {
    const gl = this.gl;

    if (!this.buffers[bufferName])
      throw new Error('Not registered buffer: ' + bufferName);

    const { buffer, target, type, numItems } = this.buffers[bufferName];
    if (numItems === null) throw new Error();

    gl.bindBuffer(target, buffer);

    if (target === gl.ELEMENT_ARRAY_BUFFER) {
      gl.drawElements(mode, numItems, type, offset);
    } else if (target === gl.ARRAY_BUFFER) {
      gl.drawArrays(mode, offset, numItems - offset);
    }
  }

  public setupShaders(): void {
    const gl = this.gl;

    // Compile shader sources
    if (!this.vertexShaderSource)
      throw Error('Vertex shader source is not registered.');

    if (!this.fragmentShaderSource)
      throw Error('Fragment shader source is not registered.');

    // Preparing vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, this.vertexShaderSource);
    gl.compileShader(vertexShader);
    if (
      !gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) &&
      !gl.isContextLost()
    )
      throw Error(
        gl.getShaderInfoLog(vertexShader) ||
          'Something went wrong while compiling vertex shader.'
      );

    // Preparing fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, this.fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (
      !gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS) &&
      !gl.isContextLost()
    )
      throw Error(
        gl.getShaderInfoLog(fragmentShader) ||
          'Something went wrong while compiling fragment shader.'
      );

    // Create program, attach shaders, activate.
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (
      !gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) &&
      !gl.isContextLost()
    )
      throw Error(
        'Failed to link shaders: ' + gl.getProgramInfoLog(shaderProgram)
      );
    gl.useProgram(shaderProgram);

    // Collect attributes, uniform location indices

    // attributes
    const attrIndex: { [key: string]: number } = {};
    this.attrNames.forEach(name => {
      const index = gl.getAttribLocation(shaderProgram, name);

      if (index !== null) {
        attrIndex[name] = index;
      } else {
        throw new Error('Invalid attribute name');
      }
    });
    this.attrIndex = attrIndex;

    // uniforms
    const uniformIndex: { [key: string]: WebGLUniformLocation } = {};
    this.uniformNames.forEach(name => {
      const index = gl.getUniformLocation(shaderProgram, name);

      if (index !== null) {
        uniformIndex[name] = index;
      } else {
        throw new Error('Invalid uniformIndex name');
      }
    });
    this.uniformIndex = uniformIndex;
  }

  private glHandleContextLost(ev: Event): void {
    ev.preventDefault();
    // cancelRequestAnimFrame(requestId);
    // suspend loading texture status
  }

  private glHandleContextRestored(ev: Event): void {
    //
  }
}
