# 📏 Coding Standards & Best Practices Guide

## 🎯 **Architectural Principles**

### **SOLID Principles Implementation**

#### **Single Responsibility Principle (SRP)**
```typescript
// ❌ Bad - Component doing too many things
const LetterCard = ({ letter }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { updateLetter, deleteLetter } = useLetters();
  
  // UI rendering + business logic + data fetching = violation
  const handleSave = async (data) => {
    try {
      await supabase.from('letters').update(data).eq('id', letter.id);
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update letter');
    }
  };
  
  return (
    // Complex JSX with business logic
  );
};

// ✅ Good - Separated concerns
const LetterCard = ({ letter, onEdit, onDelete, onView }) => {
  // Only UI rendering and user interactions
  return (
    <Card onClick={() => onView(letter)}>
      <CardHeader>
        <CardTitle>{letter.title}</CardTitle>
      </CardHeader>
      <CardActions>
        <Button onClick={() => onEdit(letter)}>Edit</Button>
        <Button variant="danger" onClick={() => onDelete(letter.id)}>Delete</Button>
      </CardActions>
    </Card>
  );
};
```

#### **Open/Closed Principle (OCP)**
```typescript
// ✅ Extensible service pattern
interface EnhancementProvider {
  enhance(content: string): Promise<EnhancementResult>;
}

class OpenAIProvider implements EnhancementProvider {
  async enhance(content: string): Promise<EnhancementResult> {
    // OpenAI implementation
  }
}

class ClaudeProvider implements EnhancementProvider {
  async enhance(content: string): Promise<EnhancementResult> {
    // Claude implementation
  }
}

// Easy to extend without modifying existing code
class EnhancementService {
  constructor(private provider: EnhancementProvider) {}
  
  async enhanceLetter(content: string) {
    return this.provider.enhance(content);
  }
}
```

#### **Dependency Inversion Principle (DIP)**
```typescript
// ✅ Depend on abstractions, not implementations
interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(user: CreateUserRequest): Promise<User>;
}

class UserService {
  constructor(
    private userRepository: UserRepository, // Abstraction
    private emailService: EmailService      // Abstraction
  ) {}
  
  async createUser(data: CreateUserRequest): Promise<User> {
    const user = await this.userRepository.create(data);
    await this.emailService.sendWelcomeEmail(user.email);
    return user;
  }
}

// Concrete implementations injected at runtime
const userService = new UserService(
  new SupabaseUserRepository(),
  new SendGridEmailService()
);
```

---

## 🧬 **Atomic Design Guidelines**

### **Atoms - Pure UI Components**

#### **Button Component Pattern**
```typescript
// src/atoms/Button/Button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils';

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
```

#### **Atom File Structure**
```
atoms/Button/
├── Button.tsx              # Component implementation
├── Button.test.tsx         # Unit tests
├── Button.stories.tsx      # Storybook stories
├── Button.module.css       # Component-specific styles (if needed)
└── index.ts                # Exports
```

#### **Atom Export Pattern**
```typescript
// atoms/Button/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';

// atoms/index.ts - Barrel exports
export { Button } from './Button';
export { Input } from './Input';
export { Label } from './Label';
export { Card } from './Card';
export type { ButtonProps } from './Button';
export type { InputProps } from './Input';
```

### **Molecules - Component Combinations**

#### **FormField Pattern**
```typescript
// src/molecules/FormField/FormField.tsx
import React from 'react';
import { Label, Input, ErrorMessage } from '@/atoms';
import { cn } from '@/shared/utils';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children?: React.ReactNode; // For custom input components
  // Extend input props
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required,
  className,
  children,
  inputProps,
}) => {
  const id = inputProps?.id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={cn("space-y-2", className)}>
      <Label 
        htmlFor={id} 
        required={required}
        className={error ? "text-destructive" : undefined}
      >
        {label}
      </Label>
      
      {children || (
        <Input
          id={id}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={!!error}
          error={!!error}
          {...inputProps}
        />
      )}
      
      {error && (
        <ErrorMessage id={`${id}-error`}>
          {error}
        </ErrorMessage>
      )}
      
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
};
```

### **Organisms - Complex Components**

#### **LetterList Pattern**
```typescript
// src/organisms/LetterList/LetterList.tsx
import React from 'react';
import { LetterCard } from '@/features/letters/components';
import { Button, Input } from '@/atoms';
import { LoadingSpinner, EmptyState } from '@/molecules';
import type { Letter } from '@/shared/types';

interface LetterListProps {
  letters: Letter[];
  selectedId?: string;
  isLoading?: boolean;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  onSelect?: (letter: Letter) => void;
  onCreateNew?: () => void;
  onEdit?: (letter: Letter) => void;
  onDelete?: (id: string) => void;
}

export const LetterList: React.FC<LetterListProps> = ({
  letters,
  selectedId,
  isLoading,
  searchQuery,
  onSearch,
  onSelect,
  onCreateNew,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return <LoadingSpinner message="Loading your letters..." />;
  }

  if (letters.length === 0) {
    return (
      <EmptyState
        title="No letters yet"
        description="Create your first letter to your future self"
        action={
          <Button onClick={onCreateNew}>
            Create Letter
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Search letters..."
            value={searchQuery || ''}
            onChange={(e) => onSearch?.(e.target.value)}
            className="flex-1"
          />
          <Button onClick={onCreateNew} size="sm">
            New Letter
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {letters.map((letter) => (
          <LetterCard
            key={letter.id}
            letter={letter}
            isSelected={letter.id === selectedId}
            onSelect={() => onSelect?.(letter)}
            onEdit={() => onEdit?.(letter)}
            onDelete={() => onDelete?.(letter.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## 🎯 **Feature Organization**

### **Feature Structure Pattern**
```
features/letters/
├── components/              # Feature-specific components
│   ├── LetterCard/
│   │   ├── LetterCard.tsx
│   │   ├── LetterCard.test.tsx
│   │   └── index.ts
│   ├── LetterForm/
│   └── index.ts            # Feature component exports
├── hooks/                  # Feature-specific hooks
│   ├── useLetters.ts
│   ├── useLetterForm.ts
│   └── index.ts
├── services/               # Business logic & API calls
│   ├── letterService.ts
│   ├── letterValidation.ts
│   └── index.ts
├── types/                  # Feature-specific types
│   ├── letter.types.ts
│   ├── api.types.ts
│   └── index.ts
├── constants/              # Feature constants
│   └── index.ts
└── index.ts               # Feature public API
```

### **Feature Public API Pattern**
```typescript
// features/letters/index.ts - Control what's exposed
export { LetterCard, LetterForm, LetterDetail } from './components';
export { useLetters, useLetterForm } from './hooks';
export { letterService } from './services';
export type { Letter, CreateLetterRequest } from './types';

// Don't export internal implementation details
// export { letterRepository } from './services'; // ❌ Internal detail
```

---

## 🔧 **Custom Hooks Patterns**

### **Data Fetching Hook Pattern**
```typescript
// features/letters/hooks/useLetters.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { letterService } from '../services';
import { useAuth } from '@/features/auth/hooks';
import { useToast } from '@/shared/hooks';

interface UseLettersOptions {
  enabled?: boolean;
  searchQuery?: string;
}

export const useLetters = (options: UseLettersOptions = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { enabled = true, searchQuery } = options;

  // Query
  const lettersQuery = useQuery({
    queryKey: ['letters', user?.id, { search: searchQuery }],
    queryFn: () => letterService.findAll(user?.id!, searchQuery),
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: letterService.create,
    onSuccess: (newLetter) => {
      // Optimistic update
      queryClient.setQueryData(['letters', user?.id], (old: Letter[] = []) => [
        newLetter,
        ...old,
      ]);
      
      toast.success('Letter created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create letter');
      console.error('Create letter error:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Letter>) =>
      letterService.update(id, updates),
    onSuccess: (updatedLetter) => {
      queryClient.setQueryData(['letters', user?.id], (old: Letter[] = []) =>
        old.map((letter) =>
          letter.id === updatedLetter.id ? updatedLetter : letter
        )
      );
      
      toast.success('Letter updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update letter');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: letterService.delete,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['letters', user?.id], (old: Letter[] = []) =>
        old.filter((letter) => letter.id !== deletedId)
      );
      
      toast.success('Letter deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete letter');
    },
  });

  return {
    // Data
    letters: lettersQuery.data || [],
    
    // Loading states
    isLoading: lettersQuery.isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Error states
    error: lettersQuery.error,
    
    // Actions
    createLetter: createMutation.mutate,
    updateLetter: updateMutation.mutate,
    deleteLetter: deleteMutation.mutate,
    
    // Utility
    refetch: lettersQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['letters'] }),
  };
};
```

### **Form Hook Pattern**
```typescript
// features/letters/hooks/useLetterForm.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { letterFormSchema, type LetterFormData } from '../types';
import { letterService } from '../services';

interface UseLetterFormOptions {
  initialData?: Partial<LetterFormData>;
  onSuccess?: (letter: Letter) => void;
  onError?: (error: Error) => void;
}

export const useLetterForm = (options: UseLetterFormOptions = {}) => {
  const { initialData, onSuccess, onError } = options;

  const form = useForm<LetterFormData>({
    resolver: zodResolver(letterFormSchema),
    defaultValues: {
      title: '',
      goal: '',
      content: '',
      send_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ...initialData,
    },
    mode: 'onBlur',
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const letter = await letterService.create(data);
      onSuccess?.(letter);
      form.reset();
    } catch (error) {
      onError?.(error as Error);
    }
  });

  const validateField = async (field: keyof LetterFormData) => {
    await form.trigger(field);
  };

  return {
    // Form state
    ...form,
    
    // Custom handlers
    handleSubmit,
    validateField,
    
    // Computed state
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    isSubmitting: form.formState.isSubmitting,
    
    // Field helpers
    getFieldError: (field: keyof LetterFormData) => form.formState.errors[field]?.message,
    getFieldProps: (field: keyof LetterFormData) => ({
      ...form.register(field),
      error: !!form.formState.errors[field],
    }),
  };
};
```

---

## 🏗️ **Service Layer Patterns**

### **Repository Pattern**
```typescript
// infrastructure/api/supabase/repositories/letterRepository.ts
import { supabase } from '../client';
import type { Letter, CreateLetterRequest } from '@/shared/types';

export interface LetterRepository {
  findAll(userId: string, search?: string): Promise<Letter[]>;
  findById(id: string): Promise<Letter | null>;
  create(letter: CreateLetterRequest): Promise<Letter>;
  update(id: string, updates: Partial<Letter>): Promise<Letter>;
  delete(id: string): Promise<void>;
}

export class SupabaseLetterRepository implements LetterRepository {
  async findAll(userId: string, search?: string): Promise<Letter[]> {
    let query = supabase
      .from('letters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch letters: ${error.message}`);
    }

    return data || [];
  }

  async findById(id: string): Promise<Letter | null> {
    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch letter: ${error.message}`);
    }

    return data;
  }

  async create(letter: CreateLetterRequest): Promise<Letter> {
    const { data, error } = await supabase
      .from('letters')
      .insert(letter)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create letter: ${error.message}`);
    }

    return data;
  }

  async update(id: string, updates: Partial<Letter>): Promise<Letter> {
    const { data, error } = await supabase
      .from('letters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update letter: ${error.message}`);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('letters')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete letter: ${error.message}`);
    }
  }
}
```

### **Service Layer Pattern**
```typescript
// features/letters/services/letterService.ts
import { SupabaseLetterRepository } from '@/infrastructure/api/supabase/repositories';
import { ValidationError } from '@/shared/errors';
import type { Letter, CreateLetterRequest } from '../types';

export class LetterService {
  constructor(private repository: SupabaseLetterRepository) {}

  async findAll(userId: string, search?: string): Promise<Letter[]> {
    return this.repository.findAll(userId, search);
  }

  async findById(id: string): Promise<Letter | null> {
    return this.repository.findById(id);
  }

  async create(request: CreateLetterRequest): Promise<Letter> {
    // Validation
    const validation = this.validateLetter(request);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    // Business logic
    const enhancedRequest = {
      ...request,
      send_date: this.normalizeSendDate(request.send_date),
      content: this.sanitizeContent(request.content),
    };

    return this.repository.create(enhancedRequest);
  }

  async update(id: string, updates: Partial<Letter>): Promise<Letter> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Letter not found');
    }

    // Prevent updating certain fields
    const allowedUpdates = this.filterAllowedUpdates(updates);
    
    return this.repository.update(id, allowedUpdates);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  private validateLetter(letter: CreateLetterRequest): ValidationResult {
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

    if (new Date(letter.send_date) <= new Date()) {
      errors.push('Send date must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private normalizeSendDate(date: string): string {
    return new Date(date).toISOString();
  }

  private sanitizeContent(content: string): string {
    return content.trim().replace(/\s+/g, ' ');
  }

  private filterAllowedUpdates(updates: Partial<Letter>): Partial<Letter> {
    const { id, user_id, created_at, ...allowed } = updates;
    return allowed;
  }
}

// Export singleton instance
export const letterService = new LetterService(new SupabaseLetterRepository());
```

---

## 📝 **Naming Conventions**

### **Files & Folders**
```
// Components: PascalCase
Button.tsx
LetterCard.tsx
FormField.tsx

// Hooks: camelCase with 'use' prefix
useLetters.ts
useAuth.ts
useLocalStorage.ts

// Services: camelCase with 'Service' suffix
letterService.ts
authService.ts
enhancementService.ts

// Types: camelCase with '.types' suffix
letter.types.ts
api.types.ts
form.types.ts

// Utilities: camelCase
formatDate.ts
validation.ts
apiUtils.ts

// Constants: UPPER_SNAKE_CASE
const MAX_LETTERS = 100;
const API_ENDPOINTS = { ... };

// Folders: kebab-case
letter-card/
form-field/
api-utils/
```

### **Variables & Functions**
```typescript
// Variables: camelCase
const letterCount = letters.length;
const isFormValid = form.isValid;

// Functions: camelCase with descriptive verbs
const createLetter = async (data) => { ... };
const validateEmail = (email) => { ... };
const formatDateForDisplay = (date) => { ... };

// Event handlers: handle + Action
const handleSubmit = () => { ... };
const handleLetterSelect = (letter) => { ... };
const handleFormChange = (field, value) => { ... };

// Boolean variables: is/has/can/should prefix
const isLoading = true;
const hasError = false;
const canEdit = user?.role === 'admin';
const shouldShowModal = isAuthenticated && hasPermission;

// Constants: UPPER_SNAKE_CASE
const DEFAULT_PAGE_SIZE = 20;
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';
```

---

## 🧪 **Testing Standards**

### **Component Testing Pattern**
```typescript
// src/atoms/Button/Button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('applies correct variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary');
  });
});
```

### **Hook Testing Pattern**
```typescript
// src/features/letters/hooks/useLetters.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLetters } from './useLetters';
import { letterService } from '../services';

// Mock the service
jest.mock('../services', () => ({
  letterService: {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useLetters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches letters on mount', async () => {
    const mockLetters = [{ id: '1', title: 'Test Letter' }];
    (letterService.findAll as jest.Mock).mockResolvedValue(mockLetters);

    const { result } = renderHook(() => useLetters(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.letters).toEqual(mockLetters);
    });
  });

  it('creates a new letter', async () => {
    const newLetter = { title: 'New Letter', content: 'Content' };
    const createdLetter = { id: '1', ...newLetter };
    
    (letterService.create as jest.Mock).mockResolvedValue(createdLetter);

    const { result } = renderHook(() => useLetters(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      result.current.createLetter(newLetter);
    });

    expect(letterService.create).toHaveBeenCalledWith(newLetter);
  });
});
```

---

## 📚 **Error Handling Standards**

### **Custom Error Classes**
```typescript
// shared/errors/index.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}
```

### **Error Boundary Pattern**
```typescript
// shared/components/ErrorBoundary/ErrorBoundary.tsx
import React from 'react';
import { Button, Alert } from '@/atoms';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to error reporting service
    // errorReportingService.captureException(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-lg mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {this.state.error?.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>
          
          <Button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4"
            variant="outline"
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 🔄 **State Management Patterns**

### **Context Pattern for Feature State**
```typescript
// features/auth/providers/AuthProvider.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' };

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
} | null>(null);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, isLoading: false, user: action.payload };
    case 'LOGIN_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: false,
    error: null,
  });

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
```

---

## 📊 **Performance Standards**

### **Lazy Loading Pattern**
```typescript
// pages/index.ts
import { lazy } from 'react';

export const Dashboard = lazy(() => 
  import('./Dashboard').then(module => ({ 
    default: module.Dashboard 
  }))
);

export const Letters = lazy(() => 
  import('./Letters').then(module => ({ 
    default: module.Letters 
  }))
);

// With loading fallback
const LazyLetters = lazy(() => 
  import('./Letters').then(module => ({ 
    default: module.Letters 
  }))
);

export const Letters = () => (
  <Suspense fallback={<PageSkeleton />}>
    <LazyLetters />
  </Suspense>
);
```

### **Memoization Pattern**
```typescript
// Expensive computation memoization
const ExpensiveComponent = React.memo(({ data, filters }) => {
  const processedData = useMemo(() => {
    return data
      .filter(item => filters.includes(item.category))
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);
  }, [data, filters]);

  const handleClick = useCallback((item) => {
    onItemClick(item.id);
  }, [onItemClick]);

  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} data={item} onClick={handleClick} />
      ))}
    </div>
  );
});
```

---

This comprehensive guide ensures consistent, maintainable, and scalable code following modern React and TypeScript best practices. 

## 🚀 **Ready to Start?**

Would you like me to help you begin implementing Phase 1 of the refactoring plan?
