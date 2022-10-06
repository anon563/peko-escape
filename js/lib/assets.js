class Assets {
    images = new Object;
    imageList = [
        'intro_holohq',
        'intro_holohq2',
        'intro_holohq3',
        'intro_title',
        'intro_title2',
        'intro_title3',
        'intro_title4',

        'ts_default',

        'ui_main',
        'ui_side',
        'ui_unit_main',
        'ui_unit_side',
        'ui_scene',
        'ui_third',
        'ui_level_up',
        'ui_item',

        'ui_digit',
        'ui_digit_red',
        'ui_digit_lcd',

        'ui_cursor',
        'ui_cursor_large',
        'ui_cursor_action',
        'ui_selected_unit',
        'ui_end_turn',

        'sp_pekora',
        'ui_pekora_title',
        'ui_pekora_mugshot',

        'sp_subaru',
        'ui_subaru_title',
        'ui_subaru_mugshot',

        'sp_nousagi',
        'ui_nousagi_title',
        'ui_nousagi_mugshot',
        
        'sp_shubaduck',
        'ui_shubaduck_title',
        'ui_shubaduck_mugshot',

        'sp_shubangelion',
        'ui_shubangelion_title',
        'ui_shubangelion_mugshot',

        // vfx
        'vfx_fog',
        'vfx_smoke_white',
        'vfx_impact',
        'vfx_ray_1',
        'vfx_ray_2',
        'vfx_ray_3',
        'vfx_ray_4'
    ];

    audioList = [
        { id: 'step' },
        { id: 'land' },
        { id: 'wakeup' },
        { id: 'question' },
        { id: 'level_start' },
        { id: 'object_pickup' },
        { id: 'bow_shoot' },
        { id: 'hit' },
        { id: 'no_damage' },
        { id: 'damage' },
        { id: 'rumble' },
        { id: 'charge' },
        { id: 'pew' },
        { id: 'boss_move' },
        { id: 'peko' },
        { id: 'fanfare' },
        { id: 'jump' },
        { id: 'select' },
        { id: 'elevator' },
        { id: 'focus' },
        { id: 'heal' },
        { id: 'noise' },
        { id: 'miko_chant' },
        { id: 'miko_kick' },
        { id: 'warning' },
        { id: 'dash' },
        { id: 'slash' },
        { id: 'gun' },
        { id: 'death' },
        { id: '33' },
        { id: 'exp' }
    ]
    
    bgmData = [
        {
            id: "elite_moonlight_scuffle",
            loopStart: 6.483
        },
        {
            id: "serious_&_go",
            loopStart: 6.6
        },
        {
            id: "crazy_bnuuy",
            loopStart: 8.083
        },
        {
            id: "red_sus",
            loopStart: 2.75
        },
        {
            id: "smile_&_go_slow",
            loopStart: 0
        },
        {
            id: "robotic_foe",
            loopStart: 5.283
        },
        {
            id: "sneak",
            loopStart: 0
        },
        {
            id: "dummy_th000",
            loopStart: 0.783
        },
        {
            id: "aquamarine_bay",
            loopStart: 6.483
        },
        {
            id: "cosplay_pirate_idol_frenzy",
            loopStart: 6.033
        }
    ];
    
    constructor() {
        this.imageList.forEach(id => {
            this.images[id] = new Image;
            this.images[id].src = `img/${id}.png`;
        });
        this.audioCtx = new AudioContext();
        this.audioCtx.suspend();
    }

    load = () => new Promise(resolve => {
        this.loadImages().then(() => {
            this.loadAudio().then(() => resolve());
        });
    });

    loadAudio = () => Promise.all([
        ...this.bgmData.map(bgm => {
            return new Promise(resolve => {
                fetch(`music/${bgm.id}.wav`).then(res => res.arrayBuffer()).then(buffer => {
                    this.audioCtx.decodeAudioData(buffer, decodedData => {
                        bgm.buffer = decodedData;
                        resolve();
                    });
                });
            });
        }),
        ...this.audioList.map(sound => {
            return new Promise(resolve => {
                fetch(`sound/${sound.id}.wav`).then(res => res.arrayBuffer()).then(buffer => {
                    this.audioCtx.decodeAudioData(buffer, decodedData => {
                        sound.buffer = decodedData;
                        resolve();
                    });
                });
            });
        })
    ]);

    loadImages = () => Promise.all([
        ...Object.keys(this.images).map(id => new Promise(resolve => this.images[id].onload = () => resolve())),
        // ...Object.keys(this.audios).map(id => new Promise(resolve => this.audios[id].oncanplaythrough = () => resolve()))
    ]);
}