import { downloadFile } from "@/lib/download";
import type { RangeFilter, Report, ReportFormat, ReportType } from "@/types/insights";
import { get, getPaginated, send } from "./api-client";

export type ReportScope = "customer" | "admin";

export interface ReportRequest extends RangeFilter {
  type?: ReportType;
  format: ReportFormat;
  account_id?: number;
  platform?: string;
}

const base = (scope: ReportScope) => (scope === "admin" ? "/admin/reports" : "/customer/reports");

export const reportsService = {
  list: (scope: ReportScope, page = 1) => getPaginated<Report>(base(scope), { page }),
  show: (scope: ReportScope, id: number) => get<Report>(`${base(scope)}/${id}`),
  create: (scope: ReportScope, input: ReportRequest) => send<Report>("post", base(scope), input),
  remove: (scope: ReportScope, id: number) => send<null>("delete", `${base(scope)}/${id}`),
  download: (scope: ReportScope, report: Report) =>
    downloadFile(`${base(scope)}/${report.id}/download`, report.filename),
};
