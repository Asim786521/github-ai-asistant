import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
dotenv.config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

/* 🧰 Pull Requests */
export async function githubProvider(params: Record<string, any>) {
  console.log("🔹 [GitHubProvider] Params:", params);

  const { owner, repo, state = "all", merged_after, filters = {} } = params;
  try {
    const response = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
      owner,
      repo,
      state,
      per_page: 50,
    });

    let pulls = response.data;

    if (merged_after) {
      const date = new Date(merged_after);
      pulls = pulls.filter(pr => pr.merged_at && new Date(pr.merged_at) >= date);
    }

    if (filters.status) {
      const status = filters.status.toLowerCase();
      pulls = pulls.filter(pr => {
        if (status === "merged") return !!pr.merged_at;
        if (status === "open") return pr.state === "open";
        if (status === "closed") return pr.state === "closed" && !pr.merged_at;
        return true;
      });
    }

    const formatted = pulls.map(pr => ({
      title: pr.title,
      number: pr.number,
      status: pr.merged_at ? "merged" : pr.state,
      user: pr.user?.login,
      url: pr.html_url,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      merged_at: pr.merged_at,
    }));

    console.log(`✅ [GitHubProvider] ${formatted.length} PRs found`);
    return formatted;
  } catch (err) {
    console.error("❌ [GitHubProvider] Error:", err);
    return [];
  }
}

/* 🐞 Issues */
export async function issuesProvider({ owner, repo, state = "open", labels }: any) {
  console.log("🐞 [IssuesProvider] Fetching:", { owner, repo, state });
  const res = await octokit.rest.issues.listForRepo({ owner, repo, state, labels });
  return res.data.map(issue => ({
    title: issue.title,
    number: issue.number,
    status: issue.state,
    user: issue.user?.login,
    url: issue.html_url,
    created_at: issue.created_at,
  }));
}

/* 🧱 Commits */
export async function commitsProvider(params: Record<string, any>) {
  const { owner, repo, branch = "main", since } = params;
  console.log("📜 [CommitsProvider] Params:", params);

  const res = await octokit.repos.listCommits({ owner, repo, sha: branch, since, per_page: 50 });
  return res.data.map(c => ({
    sha: c.sha,
    author: c.commit.author?.name,
    message: c.commit.message,
    date: c.commit.author?.date,
    url: c.html_url,
  }));
}

/* 🌿 Branches */
export async function branchesProvider(params: Record<string, any>) {
  const { owner, repo } = params;
  console.log("🌿 [BranchesProvider] Params:", params);

  const res = await octokit.repos.listBranches({ owner, repo });
  return res.data.map(b => ({ name: b.name, protected: b.protected }));
}
