// Auth feature types
export interface AuthFormProps {
  onBack: () => void;
}

export interface AuthFormData {
  email: string;
  password: string;
  fullName: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}
