// Get {x, y} positions from event.
export function getControlPosition(e:Event) {
    return offsetXYFromParentOf(e);
}


// Get from offsetParent
export function offsetXYFromParentOf(evt:Event) {
    const offsetParent = (evt.target as HTMLElement).offsetParent || document.body;
    const offsetParentRect = (evt as any).offsetParent === document.body ? {left: 0, top: 0} : offsetParent.getBoundingClientRect();

    const x = (evt as MouseEvent).clientX + offsetParent.scrollLeft - offsetParentRect.left;
    const y = (evt as MouseEvent).clientY + offsetParent.scrollTop - offsetParentRect.top;

    /*const x = Math.round(evt.clientX + offsetParent.scrollLeft - offsetParentRect.left);
    const y = Math.round(evt.clientY + offsetParent.scrollTop - offsetParentRect.top);*/


    return {x, y};
}


// Create data object exposed by <DraggableCore>'s events
export function createCoreData(lastX:number, lastY:number, x:number, y:number) {
    // State changes are often (but not always!) async. We want the latest value.
    const isStart = !isNum(lastX);

    if (isStart) {
        return {
            deltaX: 0, deltaY: 0,
            lastX: x, lastY: y,
            x: x, y: y
        };
    } else {
        // Otherwise calculate proper values.
        return {
            deltaX: x - lastX, deltaY: y - lastY,
            lastX: lastX, lastY: lastY,
            x: x, y: y
        };
    }
}


function isNum(num:unknown)  {
    return typeof num === 'number' && !isNaN(num);
}

