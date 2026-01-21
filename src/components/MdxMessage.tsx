import { evaluate } from "@mdx-js/mdx";
import {
  startTransition,
  useEffect,
  useState,
  type ComponentType,
  type FC,
  type ReactNode,
} from "react";
import * as runtime from "react/jsx-runtime";

type MdxMessageProps = {
  source: string;
  className?: string;
};

type MdxContent = ComponentType<{ components?: Record<string, unknown> }>;

const scheduleIdleCallback = (callback: IdleRequestCallback): number => {
  if (typeof globalThis.requestIdleCallback === "function") {
    return globalThis.requestIdleCallback(callback);
  }

  const start = Date.now();
  return globalThis.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    } as IdleDeadline);
  }, 1);
};

const cancelScheduledIdleCallback = (handle: number) => {
  if (typeof globalThis.cancelIdleCallback === "function") {
    globalThis.cancelIdleCallback(handle);
  } else {
    globalThis.clearTimeout(handle);
  }
};

const mdxComponents = {
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="rounded-md bg-muted/60 p-3 overflow-auto text-xs leading-relaxed">
      {children}
    </pre>
  ),
  code: ({
    children,
    className,
  }: {
    children?: ReactNode;
    className?: string;
  }) => (
    <code className={className ?? "font-mono text-[0.85em]"}>{children}</code>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-black text-destructive">{children}</strong>
  ),
  p: ({ children }: { children?: ReactNode }) => <p>{children}</p>,
};

export const MdxMessage: FC<MdxMessageProps> = ({ source, className }) => {
  const [Content, setContent] = useState<MdxContent | null>(null);

  useEffect(() => {
    if (!source.trim()) {
      return;
    }

    let cancelled = false;
    const handle = scheduleIdleCallback(() => {
      evaluate(source, { ...runtime }).then((mod) => {
        if (!cancelled) {
          startTransition(() => {
            setContent(() => mod.default as MdxContent);
          });
        }
      });
    });

    return () => {
      cancelled = true;
      cancelScheduledIdleCallback(handle);
    };
  }, [source]);

  if (!Content) {
    return (
      <div className={className}>
        <span className="whitespace-pre-wrap">{source}</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <Content components={mdxComponents} />
    </div>
  );
};
