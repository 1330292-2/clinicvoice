import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

let connectionSettings;

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

async function uploadToGitHub() {
  try {
    console.log('🔐 Authenticating with GitHub...');
    const octokit = await getGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}`);
    
    const repoName = 'clinicvoice';
    
    // Check if repo exists
    let repo;
    try {
      const { data } = await octokit.repos.get({
        owner: user.login,
        repo: repoName,
      });
      repo = data;
      console.log(`✅ Found existing repository: ${repo.html_url}`);
    } catch (error) {
      // Repo doesn't exist, create it
      console.log('📦 Creating new repository...');
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'ClinicVoice - AI-powered receptionist platform for healthcare clinics',
        private: false,
        auto_init: false,
      });
      repo = data;
      console.log(`✅ Created repository: ${repo.html_url}`);
    }
    
    // Get the default branch
    const defaultBranch = repo.default_branch || 'main';
    
    // Read all files to upload
    const filesToUpload = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.ts',
      'drizzle.config.ts',
      'postcss.config.js',
      '.env.example',
      'QUICK_START.md',
      'EXPORT_DEPLOYMENT_GUIDE.md',
      'AUTHENTICATION_GUIDE.md',
      'replit.md',
      'README.md',
    ];
    
    // Upload files
    console.log('📤 Uploading files...');
    let uploadCount = 0;
    
    for (const file of filesToUpload) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const contentBase64 = Buffer.from(content).toString('base64');
          
          // Try to get existing file SHA
          let sha;
          try {
            const { data: existingFile } = await octokit.repos.getContent({
              owner: user.login,
              repo: repoName,
              path: file,
            });
            sha = existingFile.sha;
          } catch (e) {
            // File doesn't exist, that's fine
          }
          
          await octokit.repos.createOrUpdateFileContents({
            owner: user.login,
            repo: repoName,
            path: file,
            message: `Add ${file}`,
            content: contentBase64,
            branch: defaultBranch,
            ...(sha && { sha }),
          });
          
          uploadCount++;
          console.log(`  ✓ Uploaded: ${file}`);
        } catch (error) {
          console.error(`  ✗ Failed to upload ${file}:`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 Successfully uploaded ${uploadCount} files!`);
    console.log(`📍 Repository URL: ${repo.html_url}`);
    console.log(`\n⚠️  Note: This uploaded key files. For the complete codebase, use git commands.`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

uploadToGitHub().catch(console.error);
