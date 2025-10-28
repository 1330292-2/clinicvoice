# AI-Powered Contextual Help System

## Overview
The AI-powered contextual help system provides intelligent, real-time assistance to users based on their current context within the ClinicVoice platform. It uses the Perplexity API to generate contextual responses and provides a seamless help experience.

## Components

### 1. ContextualHelp (`contextual-help.tsx`)
The main help interface component that displays as a floating chat widget.

**Features:**
- Contextual awareness based on current page
- Real-time AI responses using Perplexity API
- Contextual suggestions for each page
- Minimizable/expandable interface
- Message history
- Loading states

**Props:**
- `isMinimized`: Boolean to control minimized state
- `onToggleMinimize`: Function to toggle minimize state

### 2. HelpProvider (`help-provider.tsx`)
React context provider for managing help system state across the application.

**Context Values:**
- `isHelpVisible`: Whether help widget is visible
- `isHelpMinimized`: Whether help widget is minimized
- `showHelp()`: Show the help widget
- `hideHelp()`: Hide the help widget
- `toggleHelpMinimize()`: Toggle minimize state
- `triggerContextualHelp(context?)`: Show help with specific context

### 3. HelpTrigger (`help-trigger.tsx`)
Button component to trigger help from anywhere in the application.

**Props:**
- `context`: Optional context string
- `size`: "sm" | "md" | "lg"
- `variant`: Button variant
- `className`: Additional CSS classes

## Backend Service

### ContextualHelpService (`server/services/contextualHelp.ts`)
Backend service that handles AI-powered help requests.

**Key Methods:**
- `getContextualHelp(request)`: Main method to get AI responses
- `getSystemPrompt(context, page)`: Generate system prompt for AI
- `buildContextualPrompt(request)`: Build user prompt with context
- `getFallbackResponse(request)`: Fallback responses when API unavailable

**API Integration:**
- Uses Perplexity API with llama-3.1-sonar-small-128k-online model
- Configurable temperature and response parameters
- Rate limiting and security middleware

## API Endpoint

### POST `/api/help/contextual`
Endpoint for contextual help requests.

**Request Body:**
```json
{
  "question": "User's question",
  "context": "Current page context",
  "page": "Current page path"
}
```

**Response:**
```json
{
  "answer": "AI-generated response",
  "suggestions": ["Follow-up questions"],
  "relatedTopics": ["Related help topics"]
}
```

**Security:**
- Requires authentication
- Rate limited to 10 requests per minute
- Input validation with Zod schemas
- Audit logging

## Page Contexts

The system provides specialized help for each page:

### Dashboard (`/`)
- Analytics interpretation
- Dashboard navigation
- Performance metrics
- System status indicators

### Call Logs (`/call-logs`)
- Call transcript review
- Quality assurance
- Data export
- Pattern analysis

### Appointments (`/appointments`)
- Booking system usage
- Schedule management
- Cancellation handling
- Calendar integration

### Simulations (`/simulations`)
- Testing strategies
- Scenario selection
- Quality assurance
- AI training validation

### AI Configuration (`/ai-config`)
- Personality settings
- Response patterns
- Medical protocols
- Emergency handling

### Settings (`/settings`)
- Platform configuration
- Security settings
- Integration setup
- HIPAA compliance

## Fallback System

When the Perplexity API is unavailable:
- Comprehensive fallback responses for each page
- Contextual suggestions based on current location
- Related topics and helpful resources
- Graceful degradation with helpful information

## Usage Examples

### Basic Integration
```tsx
import { HelpProvider } from '@/components/help/help-provider';
import ContextualHelp from '@/components/help/contextual-help';

function App() {
  return (
    <HelpProvider>
      <YourApp />
      <ContextualHelp />
    </HelpProvider>
  );
}
```

### Adding Help Triggers
```tsx
import HelpTrigger from '@/components/help/help-trigger';

function MyComponent() {
  return (
    <div>
      <h1>My Page</h1>
      <HelpTrigger 
        context="specific-feature" 
        size="sm" 
        variant="outline" 
      />
    </div>
  );
}
```

### Using Help Context
```tsx
import { useHelp } from '@/components/help/help-provider';

function MyComponent() {
  const { triggerContextualHelp, showHelp } = useHelp();
  
  const handleNeedHelp = () => {
    triggerContextualHelp('complex-feature');
  };
  
  return (
    <button onClick={handleNeedHelp}>
      Need Help?
    </button>
  );
}
```

## Configuration

### Environment Variables
- `PERPLEXITY_API_KEY`: Required for AI responses
- If not provided, system falls back to static responses

### Rate Limiting
- 10 requests per minute per user
- Configurable in middleware

### Response Customization
- System prompts can be customized per page
- Fallback responses are comprehensive and helpful
- Related topics and suggestions are contextual

## Security Features
- Authentication required for all requests
- Input validation and sanitization
- Rate limiting to prevent abuse
- Audit logging for all help requests
- HIPAA-compliant data handling

## Testing
- Comprehensive fallback responses ensure functionality without API
- Context-aware suggestions for all pages
- Professional error handling and graceful degradation
- User-friendly loading states and error messages