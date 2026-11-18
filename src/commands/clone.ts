import { select } from '@inquirer/prompts'
import { exec } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'


import { getRepositories as getGitHubRepositories } from '../services/github.js'
import { getRepositories as getBitbucketRepositories } from '../services/bitbucket.js'


const execAsync = promisify(exec)


export async function cloneRepository(): Promise<string> {
  const providers = []


  if (process.env.DEVSETUP_GITHUB_TOKEN) {
    providers.push({ name: 'GitHub', value: 'github' })
  }


  if (process.env.DEVSETUP_BITBUCKET_TOKEN && process.env.DEVSETUP_BITBUCKET_PROJECTS) {
    providers.push({ name: 'Bitbucket', value: 'bitbucket' })
  }


  if (providers.length === 0) {
    throw new Error(
      'No Git provider configured. Please configure your GitHub or Bitbucket token.'
    )
  }


  const provider =
    providers.length === 1
      ? providers[0].value
      : await select({
          message: 'Where do you want to clone from?',
          choices: providers,
        })


  const repositories =
    provider === 'github'
      ? await getGitHubRepositories()
      : await getBitbucketRepositories()


  const repositoryUrl = await select<string>({
    message: 'Which repository would you like to clone?',
    choices: repositories.map((repo) => ({
      name: repo.name,
      value: repo.cloneUrl,
    })),
  })


  await execAsync(`git clone ${repositoryUrl}`)


  console.log('Repository cloned successfully!')


  return path.basename(repositoryUrl, '.git')
}