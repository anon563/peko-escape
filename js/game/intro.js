const drawIntro = (game, cx) => {
    cx.save();
    cx.clearRect(0, 0, game.width, game.height);
    cx.translate(game.width / 2, game.height / 2);
    
    const speed = 12;
    // const speed = 6;
    const frame = Math.floor(game.frameCount / speed);
    const offset = frame % speed;

    cx.fillStyle = '#000';

    if (frame < 2 * speed) {
        // First part
        cx.drawImage(game.assets.images['intro_holohq'], 0, frame < speed ? 0 : offset, 128, 64, -64, -64, 128, 64);

        // Rain
        for (let i = 0; i < 2; i++) {
            const randomX = Math.random() * 192 - 128;
            cx.beginPath();
            cx.moveTo(randomX, -64);
            cx.lineTo(randomX + 32, 0);
            cx.strokeStyle = '#4FAFAF';
            cx.lineWidth = 1;
            cx.stroke();
        }
        cx.fillRect(-game.width / 2, -game.height / 2, 64, game.height);
        cx.fillRect(game.width / 2 - 64, -game.height / 2, 64, game.height);

        // Title
        if (frame > speed / 4) cx.drawImage(game.assets.images['intro_title'], -32, 8);

        // Transition
        if (frame >= speed) {
            cx.save();
            cx.globalAlpha = offset / speed;
            cx.fillRect(-game.width / 2, -game.height / 2, game.width, game.height);
            cx.restore();
        }
    } else if (frame < 4 * speed) {
        // Second part

        cx.drawImage(game.assets.images['intro_holohq3'], 0, 16 - (frame < 3 * speed ? 0 : (speed / 2)) - Math.floor(offset / 2), 128, 64, -64, -64, 128, 64);
        
        // // Transition
        if (frame < 3 * speed) {
            cx.save();
            cx.globalAlpha = 1 - offset / speed;
            cx.fillRect(-game.width / 2, -game.height / 2, game.width, game.height);
            cx.restore();
        }
        // Title
        cx.drawImage(game.assets.images['intro_title4'], -80, 8);
    } else if (frame < 7 * speed) {

        if (frame < 6 * speed) {
            cx.save();
            if (frame >= 5.5 * speed && frame < 5.75 * speed  && Math.floor(game.frameCount / 4) % 2) cx.filter = 'brightness(200%) contrast(200%)';
            if (frame < 4 * speed) cx.globalAlpha = frame < 4.5 * speed ? 0 : offset / speed;
            cx.drawImage(game.assets.images['intro_holohq2'], 0, 0, 128, 80, -64, -40, 128, 80);
            cx.restore();
        } else {
            cx.drawImage(game.assets.images['intro_holohq2'], offset, offset, 128 - offset * 2, 80 - offset * 2,
                -64 + offset, -40 + offset, 128 - offset * 2, 80 - offset * 2);
        }

        // // Transition
        if (frame < 5 * speed) {
            cx.save();
            cx.globalAlpha = 1 - offset / speed;
            cx.fillRect(-game.width / 2, -game.height / 2, game.width, game.height);
            cx.restore();
        }

        // Title
        cx.drawImage(game.assets.images['intro_title2'], -64, -56);
        if (frame >= 5 * speed) cx.drawImage(game.assets.images['intro_title3'], -64, 56);

        // End transition
        if (frame >= 6 * speed) {
            cx.save();
            cx.globalAlpha = offset / speed;
            cx.fillRect(-game.width / 2, -game.height / 2, game.width, game.height);
            cx.restore();
        }
    } else game.intro = false;

    cx.restore();
}