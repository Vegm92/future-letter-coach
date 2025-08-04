import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'input' | 'textarea' | 'date';
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  rows?: number;
  min?: string;
  helpText?: string;
}

export const FormField = ({
  id,
  label,
  type = 'input',
  value,
  placeholder,
  disabled = false,
  onChange,
  required = false,
  className = "",
  rows,
  min,
  helpText
}: FormFieldProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div>
      <Label htmlFor={id}>
        {label} {required && '*'}
      </Label>
      <div className={`relative ${type === 'date' ? 'mt-1' : ''}`}>
        {type === 'textarea' ? (
          <Textarea
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={`resize-none ${className} ${type === 'textarea' ? 'mt-1' : ''}`}
            rows={rows}
          />
        ) : (
          <Input
            id={id}
            type={type === 'date' ? 'date' : 'text'}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            min={min}
            className={`${type === 'date' ? 'pl-10' : ''} ${className} ${type === 'input' ? 'mt-1' : ''}`}
          />
        )}
        {type === 'date' && (
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
      </div>
      {helpText && (
        <p className="text-xs text-muted-foreground mt-1">
          {helpText}
        </p>
      )}
    </div>
  );
};