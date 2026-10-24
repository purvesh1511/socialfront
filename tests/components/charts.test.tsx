import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BarList } from "@/components/charts/bar-list";
import { ChartCard } from "@/components/charts/chart-card";
import { LineChart } from "@/components/charts/line-chart";

const data = [
  { date: "2026-10-01", a: 10, b: 4 },
  { date: "2026-10-02", a: 20, b: null },
  { date: "2026-10-03", a: 15, b: 6 },
];

describe("LineChart", () => {
  it("shows a legend for multiple series and reads values with the keyboard", () => {
    render(
      <LineChart
        data={data}
        series={[
          { key: "a", label: "Impressions", color: "#2a78d6" },
          { key: "b", label: "Reach", color: "#eb6834" },
        ]}
        x={(row) => row.date}
        y={(row, key) => row[key as "a" | "b"]}
        formatX={(d) => d.slice(5)}
        ariaLabel="Daily impressions and reach"
      />,
    );

    expect(screen.getByRole("list", { name: "Legend" })).toHaveTextContent("Impressions");
    const chart = screen.getByRole("img", { name: /Daily impressions and reach/ });
    fireEvent.keyDown(chart, { key: "ArrowRight" });
    fireEvent.keyDown(chart, { key: "ArrowRight" });

    const tooltip = screen.getByRole("status");
    expect(tooltip).toHaveTextContent("10-02");
    expect(tooltip).toHaveTextContent("20");
    expect(tooltip).toHaveTextContent("—");
  });

  it("has no legend for a single series", () => {
    render(
      <LineChart
        data={data}
        series={[{ key: "a", label: "Engagement", color: "#2a78d6" }]}
        x={(r) => r.date}
        y={(r) => r.a}
        formatX={(d) => d}
        ariaLabel="Engagement"
      />,
    );
    expect(screen.queryByRole("list", { name: "Legend" })).not.toBeInTheDocument();
  });
});

describe("ChartCard", () => {
  it("toggles to an accessible table", async () => {
    render(
      <ChartCard
        title="Followers"
        table={{ columns: ["Date", "Followers"], rows: [["2026-10-01", 1200]] }}
      >
        <p>chart</p>
      </ChartCard>,
    );

    await userEvent.click(screen.getByRole("button", { name: "View as table" }));
    expect(screen.getByRole("table", { name: "Followers" })).toHaveTextContent("1,200");
  });
});

describe("BarList", () => {
  it("labels each bar with its value and shows detail on focus", async () => {
    render(
      <BarList
        ariaLabel="By platform"
        rows={[{ key: "x", label: "X", value: 1500, detail: "3 posts" }]}
      />,
    );

    expect(screen.getByText("1,500")).toBeInTheDocument();
    await userEvent.tab();
    expect(screen.getByRole("status")).toHaveTextContent("3 posts");
  });
});
