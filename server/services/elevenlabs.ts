import { ElevenLabs } from 'elevenlabs';

export class ElevenLabsService {
  private elevenlabs: ElevenLabs;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('ElevenLabs API key is required');
    }
    
    this.elevenlabs = new ElevenLabs({
      apiKey: apiKey,
    });
  }

  async generateSpeech(text: string, voiceId: string): Promise<Buffer> {
    try {
      const audio = await this.elevenlabs.generate({
        voice: voiceId,
        text: text,
        model_id: "eleven_monolingual_v1"
      });

      const chunks: Buffer[] = [];
      for await (const chunk of audio) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error generating speech with ElevenLabs:', error);
      throw new Error('Failed to generate speech');
    }
  }

  async getVoices(): Promise<any[]> {
    try {
      const voices = await this.elevenlabs.voices.getAll();
      return voices.voices || [];
    } catch (error) {
      console.error('Error fetching voices from ElevenLabs:', error);
      throw new Error('Failed to fetch voices');
    }
  }

  async cloneVoice(audioFile: Buffer, name: string, description?: string): Promise<string> {
    try {
      const voice = await this.elevenlabs.voices.add({
        name: name,
        description: description || '',
        files: [audioFile],
      });

      return voice.voice_id;
    } catch (error) {
      console.error('Error cloning voice with ElevenLabs:', error);
      throw new Error('Failed to clone voice');
    }
  }

  async getVoiceSettings(voiceId: string): Promise<any> {
    try {
      const settings = await this.elevenlabs.voices.getSettings(voiceId);
      return settings;
    } catch (error) {
      console.error('Error getting voice settings from ElevenLabs:', error);
      throw new Error('Failed to get voice settings');
    }
  }
}