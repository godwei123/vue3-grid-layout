import mitt, {Emitter} from 'mitt'
import {Events} from "../types";
import {CSSProperties} from "vue";


export const emitter:Emitter<Events> = mitt<Events>();


export function setTransform(top: number, left: number, width: number, height: number):CSSProperties {
    const translate = "translate3d(" + left + "px," + top + "px, 0)"
    return {
        transform: translate,
        WebkitTransform: translate,
        msTransform: translate,
        width: width + "px",
        height: height + "px",
        position: 'absolute',
    }
}


export function setTransformRtl(top: number, right: number, width: number, height: number):CSSProperties {

    const translate = "translate3d(" + right * -1 + "px," + top + "px, 0)"
    return {
        transform: translate,
        WebkitTransform: translate,
        msTransform: translate,
        width: width + "px",
        height: height + "px",
        position: 'absolute',
    }
}

export function setTopLeft(top: number, left: number, width: number, height: number):CSSProperties {
    return {
        top: top + "px",
        left: left + "px",
        width: width + "px",
        height: height + "px",
        position: 'absolute',
    }
}

export function setTopRight(top: number, right: number, width: number, height: number):CSSProperties {
    return {
        top: top + "px",
        right: right + "px",
        width: width + "px",
        height: height + "px",
        position: 'absolute',
    }
}



