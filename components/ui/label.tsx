import * as React from "react"
import { cn } from "@/lib/utils"

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => {
    // Process children to make asterisks red
    const processedChildren = React.useMemo(() => {
      if (typeof children === 'string') {
        // Split by asterisk and wrap it in red span
        const parts = children.split('*');
        if (parts.length > 1) {
          return (
            <>
              {parts[0]}
              <span style={{ color: '#ef4444', fontWeight: 600 }}>*</span>
              {parts.slice(1).join('*')}
            </>
          );
        }
      }
      return children;
    }, [children]);

    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      >
        {processedChildren}
      </label>
    )
  }
)
Label.displayName = "Label"

export { Label }
