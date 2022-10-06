const digitToString = (x, size) => {
    const string = Array.from(String(x), num => Number(num));
    while (string.length < size) string.unshift(0);
    return string;
}

const drawDigits = (game, cx, x, size, pos, style) => {
    const asset = style ? `ui_digit_${style}` : 'ui_digit';
    const string = digitToString(x, size);
    string.forEach((digit, i) => cx.drawImage(game.assets.images[asset], 5 * digit, 0, 5, 7, pos.x + 4 * i, pos.y, 5, 7));
}

const drawFraction = (game, cx, x, max, size, pos) => {
    drawDigits(game, cx, x, size, pos, null);
    cx.drawImage(game.assets.images['ui_digit'], 50, 0, 5, 7, pos.x + 4 * size, pos.y, 5, 7);
    drawDigits(game, cx, max, size, pos.plus(new Vector2(4 * (size + 1), 0)), null);
}