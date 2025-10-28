export interface ContextualHelpRequest {
  question: string;
  context: string;
  page: string;
  userId?: string;
}

export interface ContextualHelpResponse {
  answer: string;
  suggestions?: string[];
  relatedTopics?: string[];
}

export class ContextualHelpService {
  private readonly perplexityApiKey: string | undefined;
  private readonly baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  }

  private getSystemPrompt(context: string, page: string): string {
    return `You are an AI assistant for ClinicVoice, a healthcare clinic management platform with AI-powered receptionist services. 

Current context: ${context}
Current page: ${page}

You should provide helpful, accurate, and concise answers related to:
- Healthcare clinic management
- AI receptionist functionality  
- Appointment booking and scheduling
- Call handling and patient communication
- Platform features and navigation
- HIPAA compliance and healthcare privacy
- Medical office workflows

Keep responses professional, helpful, and specific to healthcare clinic operations. If the question is outside your expertise, suggest contacting support or refer to documentation.

Focus on practical, actionable advice that helps clinic staff use the platform effectively.`;
  }

  private buildContextualPrompt(request: ContextualHelpRequest): string {
    const pageSpecificContext = {
      '/': 'The user is viewing the main dashboard with analytics, recent calls, appointments, and system status.',
      '/call-logs': 'The user is reviewing call logs and conversation transcripts with patients.',
      '/appointments': 'The user is managing appointment scheduling and booking system.',
      '/simulations': 'The user is testing AI receptionist features with various simulation scenarios.',
      '/ai-config': 'The user is configuring AI behavior, voice settings, and response patterns.',
      '/settings': 'The user is managing platform settings, integrations, and clinic preferences.',
      '/analytics': 'The user is viewing detailed performance metrics and analytics data.'
    };

    const contextInfo = pageSpecificContext[request.page as keyof typeof pageSpecificContext] || 
                      'The user is navigating the ClinicVoice platform.';

    return `${contextInfo}

User question: ${request.question}

Please provide a helpful response that addresses their question in the context of their current page and healthcare clinic management.`;
  }

  async getContextualHelp(request: ContextualHelpRequest): Promise<ContextualHelpResponse> {
    if (!this.perplexityApiKey) {
      return this.getFallbackResponse(request);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(request.context, request.page)
            },
            {
              role: 'user',
              content: this.buildContextualPrompt(request)
            }
          ],
          max_tokens: 500,
          temperature: 0.2,
          top_p: 0.9,
          stream: false,
          presence_penalty: 0,
          frequency_penalty: 0.1
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const answer = data.choices[0]?.message?.content || 'I apologize, but I cannot provide an answer right now.';

      return {
        answer,
        suggestions: this.generateSuggestions(request.page),
        relatedTopics: this.getRelatedTopics(request.page)
      };

    } catch (error) {
      console.error('Contextual help error:', error);
      return this.getFallbackResponse(request);
    }
  }

  private getFallbackResponse(request: ContextualHelpRequest): ContextualHelpResponse {
    const fallbackResponses = {
      '/': {
        answer: "The dashboard provides a comprehensive view of your clinic's performance. Key metrics include call volume, appointment bookings, AI response quality, and patient satisfaction scores. The status indicators show system health - green means everything is working optimally. You can customize what metrics appear here in Settings.",
        suggestions: ["How do I customize dashboard widgets?", "What do the color codes mean?", "How often is data updated?"]
      },
      '/call-logs': {
        answer: "Call logs show all interactions between your AI receptionist and patients. You can review transcripts for quality assurance, monitor response accuracy, and identify areas for improvement. Look for patterns in patient inquiries to optimize your AI configuration. All data is HIPAA-compliant and encrypted.",
        suggestions: ["How do I export call data?", "Can I search through transcripts?", "How long are logs stored?"]
      },
      '/appointments': {
        answer: "The appointment system allows patients to book directly through your AI receptionist. You can set availability windows, manage cancellations, and sync with existing calendar systems. The AI can handle complex scheduling including provider preferences and appointment types.",
        suggestions: ["How do I set business hours?", "Can patients reschedule automatically?", "How do I handle no-shows?"]
      },
      '/simulations': {
        answer: "Simulations let you test your AI receptionist with realistic scenarios before going live. Try different conversation flows, emergency protocols, and edge cases. This is essential for ensuring your AI handles all patient interactions professionally and accurately.",
        suggestions: ["Which simulation should I start with?", "How realistic are the test scenarios?", "Can I create custom scenarios?"]
      },
      '/ai-config': {
        answer: "Here you can customize your AI's personality, response patterns, and behavior. Adjust empathy levels, formality, and specific medical protocols. Remember to test changes in simulations before applying them to live interactions.",
        suggestions: ["What are the recommended settings?", "How do I handle medical emergencies?", "Can I create custom responses?"]
      },
      '/settings': {
        answer: "Platform settings control integrations, security, and clinic-specific preferences. Ensure your HIPAA compliance settings are properly configured and integrate with your existing EMR system for seamless workflows.",
        suggestions: ["How do I integrate with my EMR?", "What security options are available?", "How do I backup my settings?"]
      }
    };

    const pageResponse = fallbackResponses[request.page as keyof typeof fallbackResponses];
    
    if (pageResponse) {
      return {
        answer: pageResponse.answer,
        suggestions: pageResponse.suggestions,
        relatedTopics: this.getRelatedTopics(request.page)
      };
    }

    return {
      answer: "I'm here to help you with ClinicVoice! This platform provides AI-powered receptionist services for healthcare clinics. You can manage appointments, review call logs, test AI simulations, and configure your system. What specific area would you like help with?",
      suggestions: ["How do I get started?", "What features are available?", "How do I contact support?"],
      relatedTopics: ["Getting Started", "Platform Overview", "Support"]
    };
  }

  private generateSuggestions(page: string): string[] {
    const suggestions = {
      '/': ["How do I improve my clinic's performance metrics?", "What should I monitor daily?"],
      '/call-logs': ["How do I analyze call quality?", "What patterns should I look for?"],
      '/appointments': ["How do I reduce no-shows?", "Can I set automatic reminders?"],
      '/simulations': ["How do I test emergency scenarios?", "What's the best testing strategy?"],
      '/ai-config': ["How do I make my AI more empathetic?", "What are HIPAA-compliant settings?"],
      '/settings': ["How do I secure my clinic data?", "What integrations are recommended?"]
    };

    return suggestions[page as keyof typeof suggestions] || [
      "How does ClinicVoice work?",
      "What support is available?"
    ];
  }

  private getRelatedTopics(page: string): string[] {
    const topics = {
      '/': ["Analytics", "Performance Monitoring", "System Status"],
      '/call-logs': ["Call Quality", "Transcript Analysis", "Patient Communication"],
      '/appointments': ["Scheduling", "Calendar Integration", "Patient Experience"],
      '/simulations': ["Testing Strategies", "Quality Assurance", "AI Training"],
      '/ai-config': ["AI Behavior", "Voice Settings", "Response Patterns"],
      '/settings': ["Security", "Integrations", "Compliance"]
    };

    return topics[page as keyof typeof topics] || [
      "Platform Features",
      "Getting Started",
      "Support"
    ];
  }
}