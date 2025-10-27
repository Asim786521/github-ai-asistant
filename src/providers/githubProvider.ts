import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
dotenv.config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function githubProvider(params: Record<string, any>) {
  console.log("🔹 [GitHubProvider] Called with params:", params);

  const {
    owner,
    repo,
    branch,
    state = "all",
    merged_after,
    filters = {},
  } = params;

  try {
    console.log(`🔸 [GitHubProvider] Fetching PRs for ${owner}/${repo} (state=${state})`);

    // Use GitHub REST API for PR listing
    const response = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
      owner,
      repo,
      state, // "all" | "open" | "closed"
      per_page: 50,
    });

    let pulls = response.data;

    // 🕒 Filter: merged after a certain date
    if (merged_after) {
      const mergedAfterDate = new Date(merged_after);
      pulls = pulls.filter(pr => pr.merged_at && new Date(pr.merged_at) >= mergedAfterDate);
      console.log(`📅 [GitHubProvider] Filtered PRs merged after ${merged_after}`);
    }

    // ⚙️ Filter: based on MCP client request (like filters.status)
    if (filters.status) {
      const status = filters.status.toLowerCase();
      pulls = pulls.filter(pr => {
        if (status === "merged") return !!pr.merged_at;
        if (status === "open") return pr.state === "open";
        if (status === "closed") return pr.state === "closed" && !pr.merged_at;
        if (status === "draft") return !!pr.draft;
        return true;
      });
      console.log(`🎯 [GitHubProvider] Filtered by MCP status: ${filters.status}`);
    }

    // 🧩 Map each PR to clean output
    const formatted = pulls.map(pr => {
      let prStatus = "open";
      if (pr.merged_at) prStatus = "merged";
      else if (pr.state === "closed") prStatus = "closed";
      if (pr.draft) prStatus = "draft";

      return {
        title: pr.title,
        number: pr.number,
        status: prStatus,
        user: pr.user?.login,
        url: pr.html_url,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        merged_at: pr.merged_at,
      };
    });

    console.log(`✅ [GitHubProvider] Found ${formatted.length} PRs after filtering`);
    const counts = formatted.reduce(
      (acc, pr) => ({ ...acc, [pr.status]: (acc[pr.status] || 0) + 1 }),
      {} as Record<string, number>
    );
    console.log("📊 [GitHubProvider] PR counts by status:", counts);

    return formatted;
  } catch (err) {
    console.error("❌ [GitHubProvider] GitHub API error:", err);
    return [];
  }
}
