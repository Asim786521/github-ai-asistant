import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
dotenv.config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function githubProvider(params: Record<string, any>) {
  const { owner, repo, state = "closed", merged_after } = params;

  // Use Search API if merged_after or filters exist
  if (merged_after) {
    return getMergedPRsThisWeek(owner, repo);
  }

try {
  const response = await octokit.rest.pulls.list({
    owner,
    repo,
    state,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  return response.data.map(pr => ({
    title: pr.title,
    number: pr.number,
    url: pr.html_url,
    merged_at: pr.merged_at,
    user: pr.user?.login,
  }));
} catch (err) {
  console.error("GitHub API error:", err);
  return [];
}

}

 
 
 
export async function getMergedPRsThisWeek(owner: string, repo: string) {
  const query = `repo:${owner}/${repo} is:pr is:merged merged:this-week`;
  try {
    const result = await octokit.request("GET /search/issues", {
      q: query,
      per_page: 100,
    });

    // The result.data.items array contains both issues and pull requests,
    // but the search query `is:pr` ensures we only get PRs.
    return result.data.items.map((pr: any) => ({
      title: pr.title,
      number: pr.number,
      url: pr.html_url,
      merged_at: pr.closed_at, // The `closed_at` field for a merged PR corresponds to the merged date
      user: pr.user?.login,
    }));
  } catch (err) {
    console.error("GitHub search API error:", err);
    return [];
  }
}