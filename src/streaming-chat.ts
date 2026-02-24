import { query } from "@anthropic-ai/claude-agent-sdk";
import chalk from "chalk";

const youLabel = chalk.bold.yellow("You: ");
const agentLabel = chalk.bold.magenta("Agent: ");

const systemPrompt =
    "Format all responses as plain text for a terminal. Do not use markdown syntax.";

let sessionId: string | undefined;
console.log(
    "Provide a topic for the conversation. Type 'exit' to end the conversation.",
);

const sharedOptions = {
    allowedTools: ["WebSearch", "WebFetch", "Read"] as string[],
    includePartialMessages: true,
};

async function sendMessage(userPrompt: string, resume?: string) {
    let started = false;
    let toolSpinner: ReturnType<typeof setInterval> | null = null;
    let toolTick = 0;

    function startToolSpinner(toolName: string) {
        stopToolSpinner();
        toolTick = 0;
        toolSpinner = setInterval(() => {
            const dots = ".".repeat(toolTick % 4);
            process.stdout.write(
                `\r\x1b[K${chalk.dim(`Using ${toolName}${dots}`)}`,
            );
            toolTick++;
        }, 300);
    }

    function stopToolSpinner() {
        if (toolSpinner) {
            clearInterval(toolSpinner);
            toolSpinner = null;
            process.stdout.write("\r\x1b[K");
        }
    }

    for await (const message of query({
        prompt: systemPrompt + "\n\n" + userPrompt,
        options: resume ? { ...sharedOptions, resume } : sharedOptions,
    })) {
        if ("session_id" in message) sessionId = message.session_id;

        if (message.type === "tool_progress") {
            startToolSpinner(message.tool_name);
        }

        if (
            message.type === "stream_event" &&
            message.event?.type === "content_block_delta" &&
            message.event.delta?.type === "text_delta"
        ) {
            stopToolSpinner();
            if (!started) {
                process.stdout.write(agentLabel);
                started = true;
            }
            process.stdout.write(message.event.delta.text);
        }

        if ("result" in message) {
            stopToolSpinner();
            console.log();
        }
    }
}

let input: string = prompt(youLabel) || "";
console.log();

await sendMessage(
    "Research the following topic and provide a summary, and ask follow up questions about the topic. Be concise and clear: " +
        input,
);

while (true) {
    console.log();
    input = prompt(youLabel) || "";
    console.log();
    if (input === "exit") break;

    await sendMessage(input, sessionId);
}
