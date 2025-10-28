import { Octokit } from '@octokit/rest';

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

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function testGitHubAPI() {
  try {
    const octokit = await getUncachableGitHubClient();
    
    console.log('Testing GitHub API...');
    console.log('octokit.repos methods:', Object.getOwnPropertyNames(octokit.repos));
    console.log('octokit.rest.repos methods:', Object.getOwnPropertyNames(octokit.rest.repos));
    
    // Test getting user info
    const user = await octokit.rest.users.getAuthenticated();
    console.log('Authenticated user:', user.data.login);
    
    // Try different ways to create a repository
    try {
      console.log('Attempting to list repositories...');
      const repos = await octokit.rest.repos.listForAuthenticatedUser({ 
        per_page: 5 
      });
      console.log('Found', repos.data.length, 'repositories');
      
      if (repos.data.length > 0) {
        console.log('First repo:', repos.data[0].name);
      }
    } catch (error) {
      console.error('List repos error:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testGitHubAPI();