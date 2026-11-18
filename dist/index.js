#!/usr/bin/env node
import { Command } from 'commander';
import { cloneRepository } from './commands/clone.js';
import { createBranch } from './commands/branch.js';
import { createWorkspace } from './commands/workspace.js';
import { setupEnvironment } from './commands/setup.js';
import { favoritesCommand } from './commands/favorites.js';
import { startEnvironment } from './commands/start.js';
const program = new Command();
program
    .name('devset')
    .description('CLI for automating VTEX development environments, including repository cloning, branch creation, workspace setup, and favorite tasks.')
    .version('1.0.0');
program
    .command('clone')
    .description('Clone a repository by selecting a project from the available repositories.')
    .addHelpText('after', `
Example:
  $ devset clone
`)
    .action(async () => {
    await cloneRepository();
});
program
    .command('branch')
    .description('Create a Git branch using a Jira task ID and branch type. Also it is possible to select the base branch and create a branch to homolog too.')
    .argument('<taskId>', 'Jira task ID, for example OLP-001')
    .action(async (taskId) => {
    await createBranch(taskId);
});
program
    .command('wk')
    .description('Create and select a VTEX workspace using a Jira task ID.')
    .argument('<task>', 'Jira task ID, for example OLP-001')
    .action(async (task) => {
    await createWorkspace(task);
});
program
    .command('setup')
    .description('Set up a complete development environment by cloning a repository, creating a Git branch, and creating a VTEX workspace.')
    .argument('<task>', 'Jira task ID, for example OLP-001')
    .addHelpText('after', `
Example:
  $ devset setup OLP-001
`)
    .action(setupEnvironment);
program.addCommand(favoritesCommand);
program
    .command('start')
    .description('Start a development environment using a saved favorite. Automatically logs in to the VTEX account, checks out the saved branch, and selects the workspace.')
    .argument('[nickname]', 'Favorite nickname saved with "devset fav add"')
    .addHelpText('after', `
Examples:
  $ devset start
  $ devset start myaccountremovetag

Without a nickname, you can select a favorite from the interactive list.
`)
    .action(startEnvironment);
program.addHelpText('after', `
Favorites commands:

  $ devset fav add
      Add a favorite task by saving its nickname, Jira ID, VTEX account, and branch.

  $ devset fav list
      List all saved favorite tasks.

  $ devset fav remove
      Remove a saved favorite task.

Complete workflow example:

  $ devset clone
  $ devset branch OLP-001
  $ devset wk OLP-001

Or automate the setup:

  $ devset setup OLP-001

For a previously saved task:

  $ devset fav add
  $ devset start myaccountremovetag
`);
program.parseAsync().catch((error) => {
    if (error instanceof Error && error.name === 'ExitPromptError') {
        console.log('\nOperation cancelled.');
        process.exitCode = 0;
        return;
    }
    console.error('\nAn unexpected error occurred:');
    if (error instanceof Error) {
        console.error(error.message);
    }
    else {
        console.error(error);
    }
    process.exitCode = 1;
});
