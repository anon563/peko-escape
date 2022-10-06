class Game {
    frameCount = 0;
    animationFrameCount = 0;

    width = 16 * 16;
    height = 16 * 16;

    audioCtx = null;
    bufferLoader = null;

    seVolume = .5;
    bgmVolume = .5;

    bgmId = null;
    soundFrame = {};

    updateInterval = null;
    stop = false;

    // intro = true;
    intro = false;

    constructor(assets) {
        // Assets
        this.assets = assets;

        // Display layers
        const container = document.createElement("div");
        document.body.appendChild(container);
        container.id = 'game-container';
        container.style.width = `${this.width}px`;
        container.style.height = `${this.height}px`;
        for (let i = 0; i < 4; i++) {
            this[`canvas${i}`] = document.createElement("canvas");
            container.appendChild(this[`canvas${i}`]);
            this[`canvas${i}`].id = `layer${i}`;
            this[`canvas${i}`].style.zIndex = i;
            this[`canvas${i}`].width = this.width;
            this[`canvas${i}`].height = this.height;
            this[`ctx${i}`] = this[`canvas${i}`].getContext('2d');
            this[`ctx${i}`].imageSmoothingEnabled = false;
        }

        this.resize();
        window.addEventListener('resize', this.resize);

        // Mouse
        this.mouse = new Mouse(container);

        // Audio
        this.audioCtx = assets.audioCtx;

        // Init animation
        this.tick = 50;

        // Player
        this.player = new Player();
        this.player.addUnit(new Unit(PEKORA));
        this.player.addUnit(new Unit(NOUSAGI));
        this.player.addUnit(new Unit(NOUSAGI));

        // Init stage selection
        this.scene = new Scene(this, ROOMDATA[0]);
    }

    start = () => {
        // Manage pausing game when window out of focus
        document.onvisibilitychange = () => {
            if (document.visibilityState === 'hidden') this.pause();
            else if (this.stop) this.resume();
        };
        if (document.visibilityState !== 'hidden') this.run();
        else this.stop = true;
    }

    pause = () => {
        console.log('game paused');
        if (this.audioCtx.state === 'running') this.audioCtx.suspend();
        this.stop = true;
    }

    resume = () => {
        console.log('resumed');
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        this.stop = false;
        this.run();
    }

    run = () => {
        if (!this.updateInterval) {
            this.updateInterval = setInterval(() => {
                if (this.stop) {
                    clearInterval(this.updateInterval);
                    this.updateInterval = null;
                } else this.update();
            }, 1000 / this.tick);
        }
        this.startTime = window.performance.now();
        this.animation = requestAnimationFrame(this.loop);
    }

    update = () => {
        this.updateAudio();

        this.mouse.update();

        if (this.intro) this.intro = !(this.mouse.click === 'release-left');
        else this.scene.update(this);

        this.frameCount++;
    }

    resetCanvas = () => {
        for (let i = 0; i < 4; i++) {
            this[`ctx${i}`].clearRect(0, 0, this.width, this.height);
            this[`canvas${i}`].style.filter = 'none';
        }
    }

    draw = () => {
        if (this.intro) drawIntro(this, this[`ctx${3}`]);
        else this.scene.draw(this);
        
        // DEBUG
        // const cx = this.ctx3;
        // cx.fillStyle = '#fff';
        // cx.fillText(`${Math.round(this.frameCount)} ticks`, 0, this.height - 24);
        // cx.fillText(`${Math.round((window.performance.now() - this.startTime) / 1000 * this.tick)}`, 0, this.height - 12);
        // this.lastTime = window.performance.now();

        this.animationFrameCount++;
    }

    updateAudio = () => {
        this.soundFrame = {};

        if (this.bgmFadeOut) {
            this.bgm.gainNode.gain.value -= this.bgmVolume / 32;
            if (this.bgm.gainNode.gain.value <= 0.003) {
                this.bgmFadeOut = false;
                this.stopBGM();
            }
        }
    }

    playSound = id => {
        const sound = this.assets.audioList.find(sound => sound.id === id);
        if (!sound.buffer || this.soundFrame[id]) return;
        this.soundFrame[id] = true;
        const source = this.audioCtx.createBufferSource();
        source.buffer = sound.buffer;
        source.loop = false;
        source.loopStart = 0;
        source.loopEnd = source.buffer.duration;
        if (['step', 'pew', 'bow_shoot', 'miko_chant', 'dash', 'slash', 'gun'].includes(id)) source.playbackRate.value = 1 + Math.random() * .2 - .1;
        sound.source = source;
        sound.gainNode = this.audioCtx.createGain();
        source.connect(sound.gainNode);
        sound.gainNode.connect(this.audioCtx.destination);
        sound.gainNode.gain.value = this.seVolume;
        
        if (this.audioCtx.state === "suspended") this.audioCtx.resume().then(() => sound.source.start());
        else sound.source.start();
    }

    playBGM = id => {
        const bgm = this.assets.bgmData.find(bgm => bgm.id === id);
        if (!bgm.buffer) return;
        this.bgm = bgm;
        const source = this.audioCtx.createBufferSource();
        source.buffer = this.bgm.buffer;
        source.loop = true;
        source.loopStart = this.bgm.loopStart;
        source.loopEnd = source.buffer.duration;
        this.bgm.source = source;
        this.bgm.gainNode = this.audioCtx.createGain();
        source.connect(this.bgm.gainNode);
        this.bgm.gainNode.connect(this.audioCtx.destination);

        this.bgm.updateVolume = () => this.bgm.gainNode.gain.value = BGMMUTED ? 0 : BGMVOLUME;
        this.bgm.updateVolume();

        if (this.audioCtx.state === "suspended") this.audioCtx.resume().then(() => this.bgm.source.start());
        else this.bgm.source.start();
    }

    stopBGM = fadeout => {
        if (!this.bgm) return;
        if (fadeout) {
            this.bgmFadeOut = true;
        } else {
            this.bgm.source.stop();
            this.bgm = null;
        }
    }

    loop = timestamp => {
        if (this.stop) return;
        this.animation = requestAnimationFrame(this.loop);
        this.draw();
    }

    // Resize display canvas
    resize = () => {
        const scaleX = window.innerWidth / this.width;
        const scaleY = window.innerHeight / this.height;
        document.getElementById('game-container').style.transform = 'scale(' + Math.floor(Math.max(1, Math.min(scaleX, scaleY))) + ')';
    }
}