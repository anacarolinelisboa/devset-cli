import { spawn } from 'node:child_process';
function runCommand(command, args, captureOutput = false) {
    return new Promise((resolve, reject) => {
        const isWindows = process.platform === 'win32';
        const fullCommand = isWindows ? [command, ...args].join(' ') : command;
        const spawnArgs = isWindows ? [] : args;
        const child = spawn(fullCommand, spawnArgs, {
            stdio: captureOutput ? ['inherit', 'pipe', 'pipe'] : 'inherit',
            shell: isWindows,
        });
        let output = '';
        if (captureOutput) {
            child.stdout?.on('data', (chunk) => {
                const text = chunk.toString();
                process.stdout.write(text);
                output += text;
            });
            child.stderr?.on('data', (chunk) => {
                const text = chunk.toString();
                process.stderr.write(text);
                output += text;
            });
        }
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) {
                resolve(output);
            }
            else {
                reject(new Error(`Command "${command} ${args.join(' ')}" failed with code ${code}`));
            }
        });
    });
}
export async function createWorkspace(task) {
    const workspace = task.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!workspace) {
        throw new Error('Invalid task ID provided for workspace creation.');
    }
    try {
        console.log(`Creating workspace: ${workspace}`);
        const rawOutput = await runCommand('vtex', ['use', workspace], true);
        // Remove códigos de cores ANSI do terminal antes de checar o texto
        const cleanOutput = rawOutput.replace(/\x1B\[[0-9;]*[mK]/g, '');
        const match = cleanOutput.match(/You are now using the workspace\s+([^\s]+)/i);
        const activeWorkspace = match ? match[1].trim() : '';
        if (activeWorkspace !== workspace) {
            console.log(`\nWorkspace creation cancelled.${activeWorkspace ? ` Staying on "${activeWorkspace}".` : ''}`);
            return;
        }
        console.log(`Opening workspace: ${workspace}`);
        await runCommand('vtex', ['browse']);
        console.log(`Workspace ${workspace} is ready!`);
    }
    catch (error) {
        console.error(`Failed to create workspace ${workspace}:`, error);
        throw error;
    }
}
