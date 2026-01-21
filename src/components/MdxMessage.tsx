import { evaluate } from "@mdx-js/mdx";
import {
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
    const handle = requestIdleCallback(() => {
      evaluate(source, { ...runtime }).then((mod) => {
        if (!cancelled) {
          setContent(() => mod.default as MdxContent);
        }
      });
    });

    return () => {
      cancelled = true;
      cancelIdleCallback(handle);
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
