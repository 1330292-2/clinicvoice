import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    throw new Error('X_REPLIT_TOKEN not found');
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

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    
    // Skip these directories and files
    if (file === 'node_modules' || 
        file === '.git' || 
        file === 'dist' || 
        file === '.vite' ||
        file === '.replit' ||
        file === '.config' ||
        file === '.cache' ||
        file === 'upload-to-github.js' ||
        file === 'upload-all-code.js' ||
        file.endsWith('.lock')) {
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      // Get relative path from root
      const relativePath = path.relative(__dirname, filePath);
      arrayOfFiles.push(relativePath);
    }
  });

  return arrayOfFiles;
}

async function uploadToGitHub() {
  try {
    console.log('🔐 Authenticating with GitHub...');
    const octokit = await getGitHubClient();
    
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}`);
    
    const repoName = 'clinicvoice';
    const owner = user.login;
    
    // Get repo (should exist from previous script)
    let repo;
    try {
      const { data } = await octokit.repos.get({ owner, repo: repoName });
      repo = data;
      console.log(`✅ Using repository: ${repo.html_url}`);
    } catch (error) {
      console.error('❌ Repository not found. Run upload-to-github.js first');
      return;
    }
    
    const defaultBranch = repo.default_branch || 'main';
    
    // Get all files
    console.log('📂 Scanning files...');
    const allFiles = getAllFiles(__dirname);
    console.log(`Found ${allFiles.length} files to upload`);
    
    let uploadCount = 0;
    let skipCount = 0;
    
    // Upload in batches
    for (const file of allFiles) {
      try {
        // Skip binary/large files
        const stats = fs.statSync(file);
        if (stats.size > 1000000) { // Skip files larger than 1MB
          console.log(`  ⊘ Skipped (too large): ${file}`);
          skipCount++;
          continue;
        }
        
        const content = fs.readFileSync(file, 'utf-8');
        const contentBase64 = Buffer.from(content).toString('base64');
        
        // Try to get existing file SHA
        let sha;
        try {
          const { data: existingFile } = await octokit.repos.getContent({
            owner,
            repo: repoName,
            path: file,
          });
          if (!Array.isArray(existingFile)) {
            sha = existingFile.sha;
          }
        } catch (e) {
          // File doesn't exist, that's fine
        }
        
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo: repoName,
          path: file,
          message: `Upload ${file}`,
          content: contentBase64,
          branch: defaultBranch,
          ...(sha && { sha }),
        });
        
        uploadCount++;
        if (uploadCount % 10 === 0) {
          console.log(`  📤 Uploaded ${uploadCount} files...`);
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        if (error.status === 422 || error.message.includes('too large')) {
          console.log(`  ⊘ Skipped (binary/too large): ${file}`);
          skipCount++;
        } else {
          console.error(`  ✗ Failed: ${file} - ${error.message}`);
        }
      }
    }
    
    console.log(`\n🎉 Upload Complete!`);
    console.log(`✅ Uploaded: ${uploadCount} files`);
    console.log(`⊘ Skipped: ${skipCount} files (binary/too large)`);
    console.log(`📍 Repository: ${repo.html_url}`);
    console.log(`\n✨ Your complete ClinicVoice app is now on GitHub!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

uploadToGitHub().catch(console.error);
