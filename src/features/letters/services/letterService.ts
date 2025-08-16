import { SupabaseLetterRepository, type LetterRepository, type CreateLetterRequest } from '@/shared/services/repositories';
import type { Letter } from '@/shared/types/database';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class LetterService {
  constructor(private repository: LetterRepository) {}

  async validateLetter(letter: Partial<CreateLetterRequest>): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!letter.title?.trim()) {
      errors.push('Title is required');
    }

    if (!letter.content?.trim()) {
      errors.push('Content is required');
    }

    if (!letter.goal?.trim()) {
      errors.push('Goal is required');
    }

    if (!letter.send_date?.trim()) {
      errors.push('Send date is required');
    }

    if (!letter.user_id?.trim()) {
      errors.push('User ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async createLetter(request: CreateLetterRequest): Promise<Letter> {
    const validation = await this.validateLetter(request);
    
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    return this.repository.create(request);
  }

  async updateLetter(id: string, updates: Partial<Letter>): Promise<Letter> {
    return this.repository.update(id, updates);
  }

  async deleteLetter(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async getLetterById(id: string): Promise<Letter | null> {
    return this.repository.findById(id);
  }

  async getUserLetters(userId: string): Promise<Letter[]> {
    return this.repository.findAll(userId);
  }

  async getLettersByStatus(userId: string, status: Letter['status']): Promise<Letter[]> {
    return this.repository.findByStatus(userId, status);
  }

  async updateLetterStatus(id: string, status: Letter['status']): Promise<Letter> {
    return this.repository.updateStatus(id, status);
  }

  async lockLetter(id: string): Promise<Letter> {
    return this.repository.lock(id);
  }

  async unlockLetter(id: string): Promise<Letter> {
    return this.repository.unlock(id);
  }
}

// Create singleton instance
export const letterRepository = new SupabaseLetterRepository();
export const letterService = new LetterService(letterRepository);
