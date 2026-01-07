
export function defaultColors() {
    return Array(12).fill('#E2CAA0');
}

export function defaultWood() {
    return Array(12).fill('maple');
}

export function defaultLens(cnt = 12) {
    return Array(cnt).fill(1);
}

export function capitalize(str) {
    return str[0].toUpperCase() + str.substring(1)
}