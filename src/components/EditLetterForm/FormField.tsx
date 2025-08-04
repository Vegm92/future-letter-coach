import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import type { FormFieldProps } from "@/types/components";

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

  const isTextarea = type === 'textarea';
  const isDateField = type === 'date';
  const showCalendarIcon = isDateField;
  const inputType = isDateField ? 'date' : 'text';

  return (
    <div>
      <Label htmlFor={id}>
        {label} {required && '*'}
      </Label>
      <div className={`relative ${isDateField ? 'mt-1' : ''}`}>
        {isTextarea ? (
          <Textarea
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={`resize-none ${className} ${!isDateField ? 'mt-1' : ''}`}
            rows={rows}
          />
        ) : (
          <Input
            id={id}
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            min={min}
            className={`${isDateField ? 'pl-10' : ''} ${className} ${type === 'input' ? 'mt-1' : ''}`}
          />
        )}
        {showCalendarIcon && (
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