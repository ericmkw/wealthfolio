import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

describe("theme-ready UI primitives", () => {
  it("renders card and input with CSS variable tokens", () => {
    const cardMarkup = renderToStaticMarkup(React.createElement(Card, null, "content"));
    const inputMarkup = renderToStaticMarkup(React.createElement(Input, { defaultValue: "demo" }));

    expect(cardMarkup).toContain("var(--wf-border)");
    expect(cardMarkup).toContain("var(--wf-card)");
    expect(inputMarkup).toContain("var(--wf-border)");
    expect(inputMarkup).toContain("var(--wf-card)");
  });

  it("renders table with CSS variable tokens instead of fixed zinc classes", () => {
    const tableMarkup = renderToStaticMarkup(
      React.createElement(
        Table,
        null,
        React.createElement(
          TableHeader,
          null,
          React.createElement(TableRow, null, React.createElement(TableHead, null, "Header")),
        ),
        React.createElement(
          "tbody",
          null,
          React.createElement(TableRow, null, React.createElement(TableCell, null, "Value")),
        ),
      ),
    );

    expect(tableMarkup).toContain("var(--wf-border)");
    expect(tableMarkup).toContain("var(--wf-muted)");
    expect(tableMarkup).toContain("var(--wf-fg)");
    expect(tableMarkup).not.toContain("border-zinc-800");
  });
});
