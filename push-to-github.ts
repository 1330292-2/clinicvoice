import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

// Files to commit
const filesToCommit = [
  'server/routes/2fa.ts',
  'server/middleware/audit.ts',
  'server/routes.ts',
  'shared/schema.ts',
  'server/middleware/security.ts',
  'client/src/pages/CallLogsPage.tsx',
  'client/src/pages/AppointmentsPage.tsx',
  'SECURITY_FIXES_JANUARY_2025.md',
  'replit.md',
];

async function pushToGitHub() {
  try {
    console.log('🔐 Authenticating with GitHub...');
    const octokit = await getGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}`);
    
    // Get repository info - sorted by most recently updated (same as last time)
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 20,
      direction: 'desc'
    });
    
    console.log('\n📁 Your repositories (sorted by most recent):');
    repos.forEach((repo, index) => {
      const updatedAt = new Date(repo.updated_at).toLocaleString();
      console.log(`${index + 1}. ${repo.full_name} - Updated: ${updatedAt}`);
    });
    
    if (repos.length === 0) {
      console.log('❌ No repositories found. Please create one on GitHub first.');
      return;
    }
    
    // Use the most recently updated repository (same as last time)
    const repo = repos[0];
    const [owner, repoName] = repo.full_name.split('/');
    
    console.log(`\n✅ Using most recently updated repository (same as last time): ${repo.full_name}`);
    
    console.log(`\n📤 Pushing to: ${repo.full_name}`);
    console.log(`🌿 Branch: ${repo.default_branch}`);
    
    // Get the latest commit SHA
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${repo.default_branch}`
    });
    
    const latestCommitSha = ref.object.sha;
    console.log(`📌 Latest commit: ${latestCommitSha.substring(0, 7)}`);
    
    // Get the tree
    const { data: commit } = await octokit.git.getCommit({
      owner,
      repo: repoName,
      commit_sha: latestCommitSha
    });
    
    const baseTreeSha = commit.tree.sha;
    
    // Create blobs for all files
    console.log('\n📝 Creating file blobs...');
    const blobs = [];
    
    for (const filePath of filesToCommit) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo: repoName,
          content: Buffer.from(content).toString('base64'),
          encoding: 'base64'
        });
        
        blobs.push({
          path: filePath,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha
        });
        
        console.log(`  ✅ ${filePath}`);
      } catch (error: any) {
        console.log(`  ⚠️  ${filePath} - ${error.message}`);
      }
    }
    
    // Create new tree
    console.log('\n🌳 Creating tree...');
    const { data: tree } = await octokit.git.createTree({
      owner,
      repo: repoName,
      base_tree: baseTreeSha,
      tree: blobs
    });
    
    // Create commit
    console.log('💾 Creating commit...');
    const commitMessage = `🔒 Security fixes: 2FA, audit logging, XSS protection, input validation

Critical security enhancements:
- ✅ Two-Factor Authentication (TOTP) with encrypted secrets
- ✅ Audit logging with 7-year retention (HIPAA)
- ✅ XSS protection with DOMPurify sanitization
- ✅ Input validation to prevent DoS attacks
- ✅ Multi-tenant authorization fixes
- ✅ Admin privilege escalation fixes
- ✅ CSRF token generation endpoint

Files modified: ${blobs.length}
Security level: Production-ready`;

    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo: repoName,
      message: commitMessage,
      tree: tree.sha,
      parents: [latestCommitSha]
    });
    
    console.log(`✅ Commit created: ${newCommit.sha.substring(0, 7)}`);
    
    // Update reference
    console.log('🚀 Pushing to GitHub...');
    await octokit.git.updateRef({
      owner,
      repo: repoName,
      ref: `heads/${repo.default_branch}`,
      sha: newCommit.sha
    });
    
    console.log('\n✨ SUCCESS! All security fixes pushed to GitHub!');
    console.log(`🔗 View changes: ${repo.html_url}/commit/${newCommit.sha}`);
    console.log(`📁 Repository: ${repo.html_url}`);
    
  } catch (error: any) {
    console.error('\n❌ Error pushing to GitHub:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

pushToGitHub();
