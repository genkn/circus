export interface PartialVolumeDescriptor {
    start: number;
    end: number;
    delta: number;
}

export default function toPartialVolumeDescriptor(str: string) {
    const [start = NaN, end = NaN, delta = NaN] = str
        .split(':')
        .map(val => parseInt(val, 10));

    if (isNaN(start) && isNaN(end) && isNaN(delta)) {
        return undefined;
    } else if (!isNaN(start) && !isNaN(end)) {
        return { start: start, end: end, delta: delta || undefined };
    } else {
        throw new Error(
            'Invalid partial volume descriptor specified. ' +
            'partial volume descriptor must be in the form of `startImgNum:endImgNum(:imageDelta)`'
        );
    }
}
