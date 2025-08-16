import { ReactNode } from "react";

// Button component types
export interface ButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

// Input component types
export interface InputProps {
  type?: "text" | "email" | "password" | "number" | "date" | "time";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  min?: string;
  max?: string;
  step?: string;
}

// Textarea component types
export interface TextareaProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  rows?: number;
  cols?: number;
  maxLength?: number;
}

// Select component types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

// Checkbox component types
export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  label?: string;
}

// Radio group component types
export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name: string;
}

// Switch component types
export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  label?: string;
}

// Slider component types
export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  label?: string;
}

// Progress component types
export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  id?: string;
  label?: string;
}

// Badge component types
export interface BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline";
  children: ReactNode;
  className?: string;
}

// Card component types
export interface CardProps {
  children: ReactNode;
  className?: string;
}

export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

// Dialog component types
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export interface DialogTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

export interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

export interface DialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

export interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

// Toast component types
export interface ToastProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
}

// Form component types
export interface FormFieldProps {
  name: string;
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

export interface FormProps {
  children: ReactNode;
  onSubmit: (data: Record<string, unknown>) => void;
  className?: string;
}

// Table component types
export interface TableProps {
  children: ReactNode;
  className?: string;
}

export interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

export interface TableCellProps {
  children: ReactNode;
  className?: string;
}

// Navigation component types
export interface NavigationMenuProps {
  children: ReactNode;
  className?: string;
}

export interface NavigationMenuItemProps {
  children: ReactNode;
  className?: string;
}

export interface NavigationMenuLinkProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}

// Sidebar component types
export interface SidebarProps {
  children: ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface SidebarTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export interface SidebarContentProps {
  children: ReactNode;
  className?: string;
}

export interface SidebarHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface SidebarFooterProps {
  children: ReactNode;
  className?: string;
}
