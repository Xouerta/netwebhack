export class LightRender {
    private readonly ctx: CanvasRenderingContext2D;
    private readonly lights: Array<{ x: number, y: number, radius: number, intensity: number }> = [];

    public constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public addLightEffect(x: number, y: number, radius: number) {
        this.lights.push({x, y, radius, intensity: 1});
    }

    public renderLightEffects() {
        if (this.lights.length === 0) return;

        for (let i = this.lights.length - 1; i >= 0; i--) {
            const light = this.lights[i];
            light.intensity *= 0.95; // 逐渐衰减
            if (light.intensity < 0.1) {
                this.lights[i] = this.lights[this.lights.length - 1];
                this.lights.pop();
                continue;
            }

            const gradient = this.ctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.radius
            );
            gradient.addColorStop(0, `rgba(255, 255, 200, ${light.intensity * 0.3})`);
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.fillRect(
                light.x - light.radius,
                light.y - light.radius,
                light.radius * 2,
                light.radius * 2
            );
        }

        this.ctx.globalCompositeOperation = 'source-over';
    }
}