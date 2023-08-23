import mitt from 'mitt';

export type Events = {
    updateWidth: number,
    compact: any,
    setDraggable: boolean,
    setResizable: boolean,
    setRowHeight: number,
    setMaxRows: number,
    setColNum: string | number,
    setBounded: boolean
    directionChange: any,
    setTransformScale: any
    setResizeable: boolean
    resizeEvent: [string, string | number | symbol, number, number, number, number] | undefined
    dragEvent: [string, string | number | symbol, number, number, number, number]
};

const emitter = mitt<Events>();

export default emitter
