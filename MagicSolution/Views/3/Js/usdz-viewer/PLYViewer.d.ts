import EventEmitter from "eventemitter3";
interface PLYViewerEvents {
    onModelLoad: (model: any) => void;
    onModelError: (error: string) => void;
}
export declare class PLYViewer extends EventEmitter<PLYViewerEvents> {
    private threeContainer;
    private scene;
    private camera;
    private renderer;
    private controls;
    private modelIsLoading;
    constructor(container: HTMLElement);
    initViewer(): Promise<void>;
    /**
   * Carica un file PLY nella scena
   * @param file string path al file PLY da caricare
   */
    loadFile(file: string): Promise<void>;
    /**
     * Carica un file PLY nella scena
     * @param file File PLY da caricare
     */
    loadFile(file: File): Promise<void>;
    /**
   * Adatta la camera per inquadrare tutti gli oggetti selezionati
   * @param camera Camera da adattare
   * @param controls Controlli di navigazione
   * @param selection Array di gruppi da inquadrare
   * @param fitOffset Fattore di offset per adattare la visuale
   */
    private fitCamera;
    onWindowResize(): void;
    animate(): void;
    /**
    * Carica il file di default
    * @param url URL del file PLY di default
    * @returns File PLY
    */
    private fetchFile;
    /**
   * Rimuove i listener e pulisce le risorse
   */
    dispose(): void;
}
export {};
