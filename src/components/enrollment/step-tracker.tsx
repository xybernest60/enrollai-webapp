import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Step = {
  id: number;
  name: string;
};

type StepTrackerProps = {
  currentStep: number;
  steps: Step[];
  goToStep: (step: number) => void;
};

export const StepTracker = ({ currentStep, steps, goToStep }: StepTrackerProps) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={cn("relative", {
              "flex-1": stepIdx !== steps.length - 1,
            })}
          >
            {step.id < currentStep ? (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <button
                  onClick={() => goToStep(step.id)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-200 hover:scale-110"
                >
                  <Check className="h-5 w-5" />
                  <span className="sr-only">{step.name}</span>
                </button>
              </>
            ) : step.id === currentStep ? (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-border" />
                </div>
                <button
                  onClick={() => goToStep(step.id)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background ring-4 ring-primary/20"
                  aria-current="step"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.name}</span>
                </button>
              </>
            ) : (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-border" />
                </div>
                <button
                  disabled
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-transparent"
                    aria-hidden="true"
                  />
                  <span className="sr-only">{step.name}</span>
                </button>
              </>
            )}
             <p className="absolute -bottom-6 w-max -translate-x-1/2 left-1/2 text-xs font-medium text-foreground/70">{step.name}</p>
          </li>
        ))}
      </ol>
    </nav>
  );
};
