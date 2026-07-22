import type { ComponentProps } from 'react';

import { type InputProps, Input as PickleInput } from 'pickle-ui/input';
import { InputGroup as PickleInputGroup } from 'pickle-ui/input-group';

import { cn } from '../lib/utils';

type InputGroupAddonProps = ComponentProps<typeof PickleInputGroup.Addon>;
type InputGroupProps = ComponentProps<typeof PickleInputGroup>;

const shellClassName =
  'overflow-hidden rounded-xl bg-card shadow-(--shadow-border)';

function Input({ className, ...props }: InputProps) {
  return (
    <PickleInput
      className={cn(
        'rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0',
        className,
      )}
      {...props}
    />
  );
}

function InputGroupAddon({ className, ...props }: InputGroupAddonProps) {
  return (
    <PickleInputGroup.Addon
      className={cn(
        'rounded-none border-y-0 border-l-0 border-r border-border/70 bg-transparent shadow-none',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Search field shell: one outer shadow ring. Children must use
 * InputGroup.Addon + Input (not raw bordered pickle-ui parts).
 */
function InputGroupRoot({ className, ...props }: InputGroupProps) {
  return (
    <PickleInputGroup className={cn(shellClassName, className)} {...props} />
  );
}

const InputGroup = Object.assign(InputGroupRoot, {
  Addon: InputGroupAddon,
});

export { Input, InputGroup };
