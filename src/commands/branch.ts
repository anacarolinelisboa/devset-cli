import { confirm, input, select } from '@inquirer/prompts'
import { execFile } from 'node:child_process'
import { basename } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

async function isOneLarPlatformRepo(): Promise<boolean> {
  try {
    const { stdout: remoteUrl } = await execFileAsync('git', [
      'config',
      '--get',
      'remote.origin.url',
    ])

    // Extrai o nome do repo de URLs como:
    // https://github.com/org/one-lar-platform.git ou git@github.com:org/one-lar-platform.git
    const repoName = basename(remoteUrl.trim(), '.git')
    if (repoName === 'one-lar-platform') {
      return true
    }
  } catch {
    // Se não houver remote origin, tenta verificar pelo nome da pasta raiz do repositório
  }

  try {
    const { stdout: topLevel } = await execFileAsync('git', [
      'rev-parse',
      '--show-toplevel',
    ])
    return basename(topLevel.trim()) === 'one-lar-platform'
  } catch {
    return false
  }
}

export async function createBranch(taskId: string) {
  if (!taskId) {
    throw new Error('Task ID is required')
  }

  try {
    await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'])
  } catch {
    throw new Error('This command must be run inside a Git repository')
  }

  const { stdout: remoteHead } = await execFileAsync('git', [
    'symbolic-ref',
    'refs/remotes/origin/HEAD',
  ])

  const defaultBranch = remoteHead.trim().replace('refs/remotes/origin/', '')

  const useDefaultBranch = await confirm({
    message: `Use the default branch "${defaultBranch}" as the base?`,
    default: true,
  })

  let baseBranch = defaultBranch

  if (!useDefaultBranch) {
    baseBranch = await input({
      message: 'Enter the base branch name:',
      validate: (value) =>
        /^[a-zA-Z0-9._/-]+$/.test(value.trim()) ||
        'Enter a valid branch name.',
    })

    baseBranch = baseBranch.trim().replace(/^origin\//, '')
  }

  const selectedBranchType = await select({
    message: 'Select branch type:',
    choices: [
      { name: 'Feature', value: 'feature' },
      { name: 'Bugfix', value: 'bugfix' },
      { name: 'Hotfix', value: 'hotfix' },
      { name: 'Other', value: 'other' },
    ],
  })

  let branchType: string = selectedBranchType

  if (selectedBranchType === 'other') {
    branchType = await input({
      message: 'Enter branch type:',
      validate: (value) =>
        /^[a-zA-Z0-9_-]+$/.test(value.trim()) ||
        'Enter a valid branch type (letters, numbers, hyphens or underscores).',
    })

    branchType = branchType.trim().toLowerCase()
  }

  const branchName = `${branchType}/${taskId}`

  console.log('')
  console.log(`Selected base branch: ${baseBranch}`)
  console.log(`Updating ${baseBranch}...`)

  await execFileAsync('git', ['fetch', 'origin', baseBranch])
  await execFileAsync('git', ['checkout', baseBranch])
  await execFileAsync('git', ['pull', 'origin', baseBranch])

  console.log(`Creating branch ${branchName}...`)

  await execFileAsync('git', ['checkout', '-b', branchName])

  console.log('')
  console.log(`✓ Branch ${branchName} created successfully!`)
  console.log(`✓ Base branch: ${baseBranch}`)

  if (await isOneLarPlatformRepo()) {
    const homologBranchName = `${branchName}-to-homolog`

    const createHomologBranch = await confirm({
      message: `Do you also want to create "${homologBranchName}" based on homolog?`,
      default: false,
    })

    if (createHomologBranch) {
      console.log('')
      console.log('Updating homolog...')

      await execFileAsync('git', ['fetch', 'origin', 'homolog'])
      await execFileAsync('git', ['checkout', 'homolog'])
      await execFileAsync('git', ['pull', 'origin', 'homolog'])

      console.log(`Creating branch ${homologBranchName}...`)

      await execFileAsync('git', ['checkout', '-b', homologBranchName])

      console.log('')
      console.log(`✓ Branch ${homologBranchName} created successfully!`)
      console.log('✓ Base branch: homolog')

      await execFileAsync('git', ['checkout', branchName])

      console.log(`✓ Returned to branch ${branchName}`)
    }
  }
}