import { query } from "@anthropic-ai/claude-agent-sdk";
import chalk from "chalk";
import { ToolSpinner } from "./tool-spinner";

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
    const spinner = new ToolSpinner();

    for await (const message of query({
        prompt: systemPrompt + "\n\n" + userPrompt,
        options: resume ? { ...sharedOptions, resume } : sharedOptions,
    })) {
        if ("session_id" in message) sessionId = message.session_id;

        // Detect tool use starting via stream events
        if (
            message.type === "stream_event" &&
            message.event?.type === "content_block_start" &&
            message.event.content_block?.type === "tool_use"
        ) {
            spinner.start(message.event.content_block.name);
        }

        // Stop spinner when we get tool results back
        if (message.type === "user") {
            spinner.stop();
        }

        if (
            message.type === "stream_event" &&
            message.event?.type === "content_block_delta" &&
            message.event.delta?.type === "text_delta"
        ) {
            spinner.stop();
            if (!started) {
                process.stdout.write(agentLabel);
                started = true;
            }
            process.stdout.write(message.event.delta.text);
        }

        if ("result" in message) {
            spinner.stop();
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
