// Voice memo feature public interface
export * from './components';
export * from './services/VoiceMemoService';
export * from './types';

// Export singleton service instance
import { VoiceMemoService } from './services/VoiceMemoService';
export const voiceMemoService = new VoiceMemoService();
