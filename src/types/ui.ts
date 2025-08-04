// UI component types

export type CarouselApi = {
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  scrollTo: (index: number) => void;
  selectedScrollSnap: () => number;
  scrollSnapList: () => number[];
  on: (event: string, callback: () => void) => void;
  off: (event: string, callback: () => void) => void;
};

export interface CommandDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  shouldFilter?: boolean;
  filter?: (value: string, search: string) => number;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  loop?: boolean;
  disablePointerSelection?: boolean;
  modal?: boolean;
}

export type FormFieldContextValue<
  TFieldValues extends Record<string, unknown> = Record<string, unknown>,
  TName extends string = string
> = {
  name: TName;
};