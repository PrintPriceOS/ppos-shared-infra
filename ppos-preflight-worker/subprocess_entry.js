// ppos-preflight-worker/subprocess_entry.js
const AnalyzeCommand = require('../ppos-preflight-engine/src/runtime/commands/analyzeCommand');
const AutofixCommand = require('../ppos-preflight-engine/src/runtime/commands/autofixCommand');

process.on('message', async (task) => {
    const { commandName, args } = task;
    try {
        let result;
        if (commandName === 'analyze') {
            result = await AnalyzeCommand.run(args.input, args.config);
        } else if (commandName === 'autofix') {
            result = await AutofixCommand.run(args.input, args.output, args.config);
        } else {
            throw new Error(`Unknown command: ${commandName}`);
        }
        process.send({ result });
    } catch (err) {
        process.send({ error: err.message });
        process.exit(1);
    }
});
