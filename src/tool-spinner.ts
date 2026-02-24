import chalk from "chalk";

export class ToolSpinner {
    private spinner: ReturnType<typeof setInterval> | null = null;
    private tick = 0;

    start(toolName: string) {
        this.stop();
        this.tick = 0;
        this.spinner = setInterval(() => {
            const dots = ".".repeat(this.tick % 4);
            process.stdout.write(
                `\r\x1b[K${chalk.dim(`Using ${toolName}${dots}`)}`,
            );
            this.tick++;
        }, 300);
    }

    stop() {
        if (this.spinner) {
            clearInterval(this.spinner);
            this.spinner = null;
            process.stdout.write("\r\x1b[K");
        }
    }
}
