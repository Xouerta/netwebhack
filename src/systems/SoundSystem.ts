export class SoundSystem {
    private static readonly audio = new Audio();

    public static play(src: string) {
        this.audio.src = src;
        this.audio.play();
    }
}