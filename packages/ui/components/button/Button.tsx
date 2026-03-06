import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
    "inline-flex border-1 items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-95",
    {
        variants: {
            variant: {
                primary: 'bg-emerald-default text-white border-emerald-default',
                secondary:
                    'disabled:bg-accent-hover active:bg-accent-active focus:border-none hover:bg-accent-hover hover:border-accent-hover border-accent-default bg-accent-default text-primary-foreground shadow-xs',
                destructive:
                    'active:bg-red-active active:border-red-active border-red-default bg-red-default text-white shadow-xs hover:bg-red-hover focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
                tertiary:
                    'bg-bg-offwhite-b1-base active:bg-bg-offwhite-b3 border-stroke-offwhite-secondary border-1 text-text-offwhite-primary shadow-xs hover:bg-bg-offwhite-b3 hover:border-none focus:shadow-[0_0_0_1px_var(--accent-stroke,_#B8DCFF),_0_0_0_4px_var(--accent-fill,_#EDF6FF),_0_1px_1px_0.5px_rgba(24,24,27,0.05)]',
                icon: 'bg-bg-offwhite-b1 active:bg-bg-offwhite-b0',
                outline:
                    'text-primary border-none hover:bg-fill-quaternary focused:bg-bg-offwhite-b1 active:bg-fill-tertiary underline-offset-4'
            },
            size: {
                tiny: 'px-2 py-1 h-[28px] rounded-[8px] text-[12px] gap-1.5 has-[>svg]:px-2.5',
                sm: 'px-3 py-2 h-9 rounded-[12px] text-[14px]',
                md: 'px-4 py-[10px] h-10 h-10 rounded-[14px] text-[16px] has-[>svg]:px-4',
                lg: 'px-5 py-3 h-11 rounded-[16px] text-[18px]',
                icon: 'size-9'
            }
        },
        defaultVariants: {
            variant: 'primary',
            size: 'sm'
        }
    }
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot : 'button';

    return (
        <button
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
