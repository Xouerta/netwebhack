import {randInt} from "../utils/math.ts";

export class SoundSystem {
    private static readonly buffers = new Map<string, AudioBuffer[]>();
    private static readonly ctx = new AudioContext();

    public static play(name: string) {
        const audioBuffer = this.buffers.get(name);
        if (!audioBuffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = audioBuffer[randInt(0, audioBuffer.length - 1)];
        source.connect(this.ctx.destination);
        source.start(0);
    }

    public static async init() {
        this.buffers.clear();
        this.registry('sword', ['sword_draw']);

        const attack: string[] = [];
        for (let i = 1; i < 9; i++) {
            attack.push(`sword_swing${i}`);
        }
        this.registry('attack', attack, true);
        this.registry('potion', ['bottle_empty']);
        this.registry('armor', ['armor']);
        this.registry('block', ['block1', 'block2', 'block3'], true);
        this.registry('hurt', ['hurt1', 'hurt2', 'hurt3'], true);
        this.registry('levelup', ['levelup']);
    }

    private static registry(name: string, urls: string[], parent: boolean = false) {
        const paths = parent ?
            urls.map(x => `/sound/${name}/${x}.ogg`) :
            urls.map(x => `/sound/${x}.ogg`);

        for (const path of paths) {
            fetch(path)
                .then(res => res.arrayBuffer())
                .then(buffer => this.ctx.decodeAudioData(buffer))
                .then(buffer => {
                    const audios = this.buffers.get(name) ?? [];
                    audios.push(buffer);
                    this.buffers.set(name, audios);
                })
                .catch(e => console.error(`Decode fail at ${path}`, e));
        }
    }
}