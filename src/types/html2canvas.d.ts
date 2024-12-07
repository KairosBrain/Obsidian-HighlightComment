declare module 'html2canvas' {
    interface Options {
        scale?: number;
        width?: number;
        height?: number;
        backgroundColor?: string;
        useCORS?: boolean;
        allowTaint?: boolean;
        [key: string]: any;
    }

    interface Html2CanvasStatic {
        (element: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
    }

    const html2canvas: Html2CanvasStatic;
    export default html2canvas;
}
