export async function getRepositories() {
    const token = process.env.DEVSETUP_GITHUB_TOKEN;
    if (!token) {
        throw new Error('DEVSETUP_GITHUB_TOKEN environment variable is not configured');
    }
    const response = await fetch('https://api.github.com/orgs/One-LAR-Platform/repos?per_page=100', {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
        },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch repositories from GitHub');
    }
    const repositories = await response.json();
    return repositories.map((repo) => ({
        name: repo.name,
        cloneUrl: repo.clone_url,
    }));
}
