import inquirer from 'inquirer' 
import path from 'node:path'
import { cloneRepository } from './clone.js'
import { createBranch } from './branch.js'
import { createWorkspace } from './workspace.js' 

type SetupOption = 'current' | 'clone' 

export async function setupEnvironment(task: string): Promise<void> {
  console.log(`Setting up environment for ${task}...\n`) 

  const { setupOption } = await inquirer.prompt<{
    setupOption: SetupOption
  }>([
    {
      type: 'select',
      name: 'setupOption',
      message: 'How would you like to set up the environment?',
      choices: [
        {
          name: 'Create Git branch and VTEX workspace',
          value: 'current',
        },
        {
          name: 'Clone repository, create Git branch and VTEX workspace',
          value: 'clone',
        },
      ],
    },
  ]) 

  if (setupOption === 'clone') { 
    const repoName = await cloneRepository()
    const repoPath = path.join(process.cwd(), repoName)
    process.chdir(repoPath)
    console.log(`\nEntered directory: ${repoPath}`)
    
  } 

  await createBranch(task)
  await createWorkspace(task) 
  console.log(`\nEnvironment setup completed for ${task}!`)
}