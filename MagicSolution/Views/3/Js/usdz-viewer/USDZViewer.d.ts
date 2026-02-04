import EventEmitter from "eventemitter3";
interface USDZViewerEvents {
    onModelLoad: (model: any) => void;
    onModelError: (error: string) => void;
}
export declare class USDZViewer extends EventEmitter<USDZViewerEvents> {
    private threeContainer;
    private scene;
    private camera;
    private renderer;
    constructor(container: HTMLElement);
    initViewer(): Promise<void>;
    loadFile(file: File): Promise<void>;
    loadUrl(url: string): Promise<void>;
    onWindowResize(): void;
    animate(): void;
}
export { };
