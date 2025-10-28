# ClinicVoice Production Environment Variables

This document provides secure configuration instructions for deploying ClinicVoice in production environments.

## Required Environment Variables

### Database Configuration
```bash
# PostgreSQL Database (Neon or compatible)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

### Authentication (Replit Auth)
```bash
# OpenID Connect configuration (provided by Replit)
OIDC_CLIENT_ID="your-replit-client-id"
OIDC_CLIENT_SECRET="your-replit-client-secret"
OIDC_ISSUER="https://auth.replit.com"
OIDC_REDIRECT_URI="https://your-domain.com/api/callback"
```

### Session Management
```bash
# Secure session secret (generate with: openssl rand -base64 32)
SESSION_SECRET="your-secure-session-secret-here"
```

### AI Services
```bash
# OpenAI API for AI receptionist functionality
OPENAI_API_KEY="sk-your-openai-api-key"

# ElevenLabs for voice synthesis (optional)
ELEVENLABS_API_KEY="your-elevenlabs-api-key"
```

### Telephony Services (Twilio)
```bash
# Twilio configuration for UK phone numbers
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_NUMBER="+44-your-uk-phone-number"

# Webhook URLs for production
TWILIO_WEBHOOK_URL="https://your-domain.com/api/voice/webhook"
TWILIO_STATUS_CALLBACK_URL="https://your-domain.com/api/twilio/status"
```

### Calendar Integration (Optional)
```bash
# Cal.com integration for appointment booking
CALCOM_API_KEY="your-calcom-api-key"
CALCOM_EVENT_TYPE_ID="your-event-type-id"
```

### Application Configuration
```bash
# Production environment
NODE_ENV="production"
PORT="5000"

# Public base URL for webhooks and redirects
PUBLIC_BASE_URL="https://your-domain.com"
```

### Google Services (Optional)
```bash
# Google Sheets integration
GOOGLE_SHEETS_CREDENTIALS="base64-encoded-service-account-json"
```

### Security Configuration
```bash
# Encryption key for sensitive data (generate with: openssl rand -base64 32)
ENCRYPTION_KEY="your-encryption-key-for-sensitive-data"

# Rate limiting configuration
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
RATE_LIMIT_MAX_REQUESTS="100"
```

## Security Best Practices

### Environment Variable Management
1. **Never commit secrets to version control**
2. **Use environment-specific configurations**
3. **Rotate secrets regularly**
4. **Use strong, randomly generated secrets**

### Secret Generation
```bash
# Generate secure session secret
openssl rand -base64 32

# Generate encryption key
openssl rand -base64 32

# Generate webhook secret
openssl rand -base64 24
```

### Production Deployment Checklist
- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] Twilio webhooks configured with correct URLs
- [ ] SSL/TLS certificates configured
- [ ] Rate limiting configured
- [ ] Error monitoring set up
- [ ] Log aggregation configured
- [ ] Backup procedures in place

## Environment-Specific Configurations

### Development Environment
```bash
NODE_ENV="development"
PUBLIC_BASE_URL="http://localhost:5000"
# Use test/sandbox credentials for external services
```

### Staging Environment
```bash
NODE_ENV="staging"
PUBLIC_BASE_URL="https://staging-your-domain.com"
# Use separate staging credentials
```

### Production Environment
```bash
NODE_ENV="production"
PUBLIC_BASE_URL="https://your-domain.com"
# Use production credentials with proper security
```

## External Service Configuration

### Twilio Setup
1. Purchase UK phone number with voice capabilities
2. Configure voice webhook URL: `https://your-domain.com/api/voice/webhook`
3. Configure status callback URL: `https://your-domain.com/api/twilio/status`
4. Enable call recording if required
5. Set up emergency routing (999 calls)

### OpenAI Configuration
1. Create OpenAI account with sufficient credits
2. Generate API key with appropriate permissions
3. Monitor usage and set billing alerts
4. Configure rate limiting as needed

### Database Setup (Neon PostgreSQL)
1. Create Neon database project
2. Configure connection pooling
3. Set up automated backups
4. Configure read replicas if needed
5. Monitor performance and storage

## Monitoring and Alerts

### Required Monitoring
- Application uptime and response times
- Database connection and query performance
- External API success rates and latency
- Error rates and exception tracking
- Security event monitoring

### Recommended Tools
- **Error Tracking**: Sentry or similar
- **Performance Monitoring**: New Relic or DataDog
- **Log Aggregation**: LogDNA or Papertrail
- **Uptime Monitoring**: Pingdom or UptimeRobot

## Security Considerations

### HIPAA Compliance
- Encrypt all patient data at rest and in transit
- Implement audit logging for all data access
- Use secure session management
- Regular security assessments
- Staff training on data handling

### Data Protection
- Regular automated backups
- Disaster recovery procedures
- Data retention policies
- Secure data deletion procedures
- Compliance with UK GDPR requirements

## Troubleshooting

### Common Issues
1. **Database Connection Failures**: Check DATABASE_URL and network connectivity
2. **Authentication Issues**: Verify OIDC configuration and redirect URIs
3. **Twilio Webhook Failures**: Ensure PUBLIC_BASE_URL is accessible and HTTPS
4. **OpenAI API Errors**: Check API key validity and credit balance
5. **Session Issues**: Verify SESSION_SECRET is consistent across deployments

### Debug Mode
For debugging in development:
```bash
DEBUG="app:*"
LOG_LEVEL="debug"
```

## Contact Information
For deployment assistance or security questions, contact your development team or refer to the main README.md file.