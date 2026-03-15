export function resolveStarterFiles(binding: {
    starterSliceId: string;
    repoId: string;
}) {
    return {
        starterSliceId: binding.starterSliceId,
        repoId: binding.repoId,
        files: [
            {
                path: 'src/index.ts',
                contentType: 'ts',
                content: "export const starterSlice = true;\n",
                required: true
            },
            {
                path: 'tsconfig.json',
                contentType: 'json',
                content: JSON.stringify({
                    compilerOptions: {
                        target: 'ES2022',
                        module: 'ESNext',
                        strict: true
                    }
                }, null, 2) + '\n',
                required: true
            }
        ]
    };
}
