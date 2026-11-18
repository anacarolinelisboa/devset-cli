import type { Repository } from './types.js'


interface BitbucketRepo {
  name: string
  links: {
    clone: {
      name: string
      href: string
    }[]
  }
}


interface BitbucketResponse {
  values: BitbucketRepo[]
  next?: string
}


export async function getRepositories(): Promise<Repository[]> {
  const token = process.env.DEVSETUP_BITBUCKET_TOKEN
  const projects = process.env.DEVSETUP_BITBUCKET_PROJECTS


  if (!token) {
    throw new Error(
      'DEVSETUP_BITBUCKET_TOKEN environment variable is not configured'
    )
  }


  if (!projects) {
    throw new Error(
      'DEVSETUP_BITBUCKET_PROJECTS environment variable is not configured'
    )
  }


  const repositories: Repository[] = []
  const projectKeys = projects
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
  const query = projectKeys.map((key) => `project.key="${key}"`).join(' OR ')
  const queryString = query ? `?q=${encodeURIComponent(query)}` : ''
  let url: string | undefined =
    `https://api.bitbucket.org/2.0/repositories/whirlpool-lar${queryString}` 

  while (url) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })


    if (!response.ok) {
      throw new Error('Failed to fetch repositories from Bitbucket')
    }


    const data: BitbucketResponse = await response.json()


    repositories.push(
      ...data.values.map((repo) => ({
        name: repo.name,
        cloneUrl:
          repo.links.clone.find((link) => link.name === 'https')?.href ?? '',
      }))
    )


    url = data.next
  }


  return repositories.filter((repo) => repo.cloneUrl)
}