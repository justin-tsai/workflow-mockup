import type { ReactNode } from 'react';

type DetailsPanelProps = { children: ReactNode };

export default function DetailsPanel({ children }: DetailsPanelProps) {
    return <section className="details-panel">{children}</section>;
}
