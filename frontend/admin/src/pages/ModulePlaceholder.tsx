import {
  Construction,
} from "lucide-react";

export default function ModulePlaceholder({
  title,
  pass,
  description,
}: {
  title: string;
  pass: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--text)" }}
        >
          {title}
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--muted)" }}
        >
          {description}
        </p>
      </header>

      <section
        className="grid min-h-[420px] place-items-center rounded-[var(--radius-card)] border p-8 text-center"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-sm">
          <div
            className="mx-auto grid size-14 place-items-center rounded-2xl"
            style={{
              color: "var(--brand-accent)",
              background: "var(--surface-alt)",
            }}
          >
            <Construction size={25} />
          </div>
          <h2
            className="mt-4 text-lg font-semibold"
            style={{ color: "var(--text)" }}
          >
            {title} is enabled in {pass}
          </h2>
          <p
            className="mt-2 text-sm leading-6"
            style={{ color: "var(--muted)" }}
          >
            The navigation structure is locked now so the
            administration console does not need to be reorganized
            between passes.
          </p>
        </div>
      </section>
    </div>
  );
}
