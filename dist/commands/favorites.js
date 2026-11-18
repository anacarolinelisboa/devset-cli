import { Command } from 'commander';
import inquirer from 'inquirer';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
const configDir = join(homedir(), '.devset');
const configFile = join(configDir, 'favorites.json');
export async function readFavorites() {
    try {
        return JSON.parse(await readFile(configFile, 'utf8'));
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}
async function saveFavorites(favorites) {
    await mkdir(configDir, { recursive: true });
    await writeFile(configFile, JSON.stringify(favorites, null, 2));
}
export async function addFavorite() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Task nickname (e.g. headericonissue):',
            validate: (value) => value.trim() !== '' || 'Enter a nickname.',
        },
        {
            type: 'input',
            name: 'taskId',
            message: 'Jira task ID (e.g. OLP-001):',
            validate: (value) => value.trim() !== '' || 'Enter a task ID.',
        },
        {
            type: 'input',
            name: 'vtexAccount',
            message: 'VTEX account name:',
            validate: (value) => value.trim() !== '' || 'Enter a VTEX account.',
        },
        {
            type: 'input',
            name: 'branchName',
            message: 'Existing branch name (e.g. bugfix/OLP-001):',
            validate: (value) => value.trim() !== '' || 'Enter a branch name.',
        },
    ]);
    const favorites = await readFavorites();
    const taskId = answers.taskId.trim().toUpperCase();
    const favorite = {
        name: answers.name.trim(),
        taskId,
        vtexAccount: answers.vtexAccount.trim(),
        branchName: answers.branchName.trim(),
    };
    const existingIndex = favorites.findIndex((item) => item.taskId.toUpperCase() === taskId);
    if (existingIndex >= 0) {
        favorites[existingIndex] = favorite;
    }
    else {
        favorites.push(favorite);
    }
    await saveFavorites(favorites);
    console.log(`Favorite "${favorite.name}" saved!`);
}
export async function listFavorites() {
    const favorites = await readFavorites();
    if (favorites.length === 0) {
        console.log('No favorites registered yet.');
        return;
    }
    for (const favorite of favorites) {
        console.log(`\n${favorite.name} — ${favorite.taskId}`);
        console.log(`VTEX account: ${favorite.vtexAccount}`);
        console.log(`Branch: ${favorite.branchName}`);
    }
}
export async function removeFavorite() {
    const favorites = await readFavorites();
    if (favorites.length === 0) {
        console.log('No favorites registered yet.');
        return;
    }
    const { taskId } = await inquirer.prompt([
        {
            type: 'select', // Changed from 'list'
            name: 'taskId',
            message: 'Select a favorite to remove:',
            choices: favorites.map((item) => ({
                name: `${item.name} — ${item.taskId}`,
                value: item.taskId,
            })),
        },
    ]);
    await saveFavorites(favorites.filter((item) => item.taskId !== taskId));
    console.log(`Favorite ${taskId} removed.`);
}
export const favoritesCommand = new Command('fav')
    .alias('favorites')
    .description('Manage favorite Jira tasks');
favoritesCommand
    .command('add')
    .description('Add or update a favorite task')
    .action(addFavorite);
favoritesCommand
    .command('list')
    .description('List favorite tasks')
    .action(listFavorites);
favoritesCommand
    .command('remove')
    .description('Remove a favorite task')
    .action(removeFavorite);
