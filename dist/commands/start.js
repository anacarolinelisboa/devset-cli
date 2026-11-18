import inquirer from 'inquirer';
import { execa } from 'execa';
import { createWorkspace } from './workspace.js';
import { readFavorites } from './favorites.js';
async function checkoutBranch(branchName) {
    const localBranch = await execa('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`], { reject: false });
    if (localBranch.exitCode === 0) {
        await execa('git', ['checkout', branchName], {
            stdio: 'inherit',
        });
        return;
    }
    console.log(`Branch not found locally. Fetching origin/${branchName}...`);
    await execa('git', ['fetch', 'origin', branchName], {
        stdio: 'inherit',
    });
    await execa('git', ['checkout', '--track', '-b', branchName, `origin/${branchName}`], { stdio: 'inherit' });
}
export async function startEnvironment(nickname) {
    const repositoryPath = process.cwd();
    const gitCheck = await execa('git', ['rev-parse', '--show-toplevel'], {
        cwd: repositoryPath,
        reject: false,
    });
    if (gitCheck.exitCode !== 0) {
        throw new Error('Run this command inside a Git repository.');
    }
    const favorites = await readFavorites();
    if (favorites.length === 0) {
        console.log('No favorites found. Run devset fav add first.');
        return;
    }
    let favorite;
    if (nickname) {
        favorite = favorites.find((item) => item.name.trim().toLowerCase() === nickname.trim().toLowerCase());
        if (!favorite) {
            throw new Error(`Favorite not found for nickname "${nickname}".`);
        }
    }
    else {
        const { selectedNickname } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedNickname',
                message: 'Select a favorite task:',
                choices: favorites.map((item) => ({
                    name: `${item.name} — ${item.taskId}`,
                    value: item.name,
                })),
            },
        ]);
        favorite = favorites.find((item) => item.name === selectedNickname);
    }
    if (!favorite) {
        throw new Error('Could not select a favorite task.');
    }
    console.log(`\nStarting ${favorite.name} (${favorite.taskId})`);
    console.log(`Repository: ${gitCheck.stdout}`);
    try {
        console.log(`\nLogging in to VTEX account: ${favorite.vtexAccount}`);
        await execa('vtex', ['login', favorite.vtexAccount], {
            cwd: repositoryPath,
            stdio: 'inherit',
        });
        console.log(`\nChecking out branch: ${favorite.branchName}`);
        await checkoutBranch(favorite.branchName);
        console.log(`\nSelecting workspace for ${favorite.taskId}...`);
        await createWorkspace(favorite.taskId);
        console.log(`\nEnvironment ready for ${favorite.name}!`);
    }
    catch (error) {
        console.error(`\nFailed to start ${favorite.name}.`);
        throw error;
    }
}
