export async function githubProvider(params: Record<string, any>) {
  console.log("GitHub provider called with:", params);

  // Mock data (you can later plug in Octokit or REST API)
  return [
    { title: "Fix login bug" },
    { title: "Add dark mode" },
    { title: "Update README" },
  ];
}
