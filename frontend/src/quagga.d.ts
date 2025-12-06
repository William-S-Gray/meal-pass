declare module 'quagga' {
  interface QuaggaJSConfigObject {
    inputStream?: {
      name?: string;
      type?: string;
      target?: HTMLElement | string;
      constraints?: MediaTrackConstraints;
    };
    decoder?: {
      readers?: string[];
    };
    locate?: boolean;
  }

  interface QuaggaJSResultObject {
    codeResult?: {
      code?: string;
      format?: string;
    };
  }

  interface QuaggaJS {
    init(config: QuaggaJSConfigObject, callback: (err: any) => void): Promise<void>;
    start(): void;
    stop(): void;
    onDetected(callback: (data: QuaggaJSResultObject) => void): void;
  }

  const Quagga: QuaggaJS;
  export default Quagga;
}