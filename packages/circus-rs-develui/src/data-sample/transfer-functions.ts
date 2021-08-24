import * as rs from '@utrad-ical/circus-rs/src/browser';

const checkValues = rs.createTransferFunction([
    // 0 - 99: RED
    [99, '#ff0000ff'],
    // 100 - 199: YELLOW
    [100, '#ffff00ff'],
    [199, '#ffff00ff'],
    // 200 - 299: GREEN
    [200, '#00ff00ff'],
    [299, '#00ff00ff'],
    // 300 - 399: CYAN
    [300, '#008080ff'],
    [399, '#008080ff'],
    // 400 - 499: PURPLE
    [400, '#ff00ffff'],
    [499, '#ff00ffff'],
    // 500 - 599: BLUE
    [500, '#ff00ffff'],
    [599, '#ff00ffff'],
    // 600: reset
    [600, '#ffffffff']
]);

const windowState = {
    level: 329,
    width: 658
};

export const transferFunction = {
    initial: [
        {
            "position": 0,
            "color": "#00000000"
        },
        {
            "position": 0.5025100708007812,
            "color": "#00000000"
        },
        {
            "position": 0.5075302124023438,
            "color": "#ffffffff"
        },
        {
            "position": 1,
            "color": "#ffffffff"
        }
    ],
    vessel: rs.createTransferFunction([
        [470, '#66000000'],
        [700, '#ff0000ff']
    ]),
    dicom: rs.mprTransferFunction(windowState),
    checkValues
};
