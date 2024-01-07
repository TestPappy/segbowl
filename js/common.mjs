
export function dfltclrs() {
    var clrs = [];
    for (var i = 0; i < 12; i++) { clrs.push("#E2CAA0"); }
    return clrs;
}

export function dfltwood() {
    var wood = [];
    for (var i = 0; i < 12; i++) { wood.push("maple"); }
    return wood;
}

export function dfltlens(cnt = 12) {
    var len = [];
    for (var i = 0; i < cnt; i++) {
        len.push(1);
    }
    return len;
}

export function capitalize(str) {
    return str[0].toUpperCase() + str.substring(1)
}