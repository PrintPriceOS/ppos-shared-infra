export function parseCliArgs(argv: string[]) {
    const [, , command, ...rest] = argv;
    return { command, args: rest };
}
