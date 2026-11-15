import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ClockAlert,
  FileBarChart,
  MapPinned,
  RefreshCw,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
  UserRoundX,
} from "lucide-react";
import { discipleshipService } from "@/services/discipleship";
import { churchesService } from "@/services/churches";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExportImportButtons } from "@/components/ExportImportButtons";

type ReportType = "overview" | "intake" | "stages" | "dropouts" | "milestones" | "regions" | "workflows" | "sources" | "outcomes";
type ReportRow = Record<string, string | number>;
type GeneratedReport = { title: string; headers: Array<{ label: string; key: string }>; rows: ReportRow[] };

const initialConfig = { mode: "cohort" as "cohort" | "activity", region: "all", churchId: "all", workflowId: "all", sourceType: "all", from: "", to: "", reportType: "overview" as ReportType };

export default function DiscipleshipReportsPage() {
  const [config, setConfig] = useState(initialConfig);
  const [applied, setApplied] = useState(initialConfig);
  const { data: churches = [] } = useQuery({
    queryKey: ["churches-select"],
    queryFn: churchesService.getSelectable,
  });
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["discipleship-report", applied.mode, applied.region, applied.churchId, applied.workflowId, applied.sourceType, applied.from, applied.to],
    queryFn: () =>
      discipleshipService.getReport({
        churchId: applied.churchId === "all" ? undefined : applied.churchId,
        region: applied.region === "all" ? undefined : applied.region,
        workflowId: applied.workflowId === "all" ? undefined : applied.workflowId,
        sourceType: applied.sourceType === "all" ? undefined : applied.sourceType,
        mode: applied.mode,
        from: applied.from || undefined,
        to: applied.to || undefined,
      }),
  });

  const generatedReport = useMemo<GeneratedReport>(() => {
    if (!data) return { title: "Discipleship report", headers: [], rows: [] };
    if (applied.reportType === "intake") return {
      title: "Discipleship intake trend",
      headers: [{ label: "Period", key: "period" }, { label: "Candidates entered", key: "count" }],
      rows: data.intakeTrend,
    };
    if (applied.reportType === "stages") return {
      title: "Candidates by discipleship stage",
      headers: [{ label: "Current stage", key: "stage" }, { label: "Candidates", key: "count" }],
      rows: data.candidatesByStage,
    };
    if (applied.reportType === "dropouts") return {
      title: "Discipleship dropout points",
      headers: [{ label: "Stage at withdrawal", key: "stage" }, { label: "Withdrawn candidates", key: "count" }],
      rows: data.dropoutsByStage,
    };
    if (applied.reportType === "milestones") return {
      title: "Time to discipleship milestones",
      headers: [{ label: "Milestone", key: "milestone" }, { label: "Completed", key: "completed" }, { label: "Average days", key: "averageDays" }, { label: "Median days", key: "medianDays" }],
      rows: data.timeToMilestone,
    };
    if (applied.reportType === "regions") return {
      title: "Discipleship journeys by region",
      headers: [{ label: "Region", key: "region" }, { label: "Journeys", key: "count" }],
      rows: data.byRegion,
    };
    if (applied.reportType === "workflows") return {
      title: "Discipleship journeys by workflow",
      headers: [{ label: "Workflow", key: "workflow" }, { label: "Journeys", key: "count" }],
      rows: data.byWorkflow,
    };
    if (applied.reportType === "sources") return {
      title: "Discipleship journeys by intake source",
      headers: [{ label: "Intake source", key: "source" }, { label: "Journeys", key: "count" }],
      rows: data.bySource.map(item => ({ ...item, source: item.source.replaceAll("_", " ") })),
    };
    if (applied.reportType === "outcomes") return {
      title: "Discipleship outcomes and follow-up",
      headers: [{ label: "Outcome", key: "metric" }, { label: "Value", key: "value" }],
      rows: [
        { metric: "Completed journeys", value: data.totals.completed },
        { metric: "Completion rate", value: `${data.totals.completionRate}%` },
        { metric: "Withdrawn journeys", value: data.totals.withdrawn },
        { metric: "Dropout rate", value: `${data.totals.dropoutRate}%` },
        { metric: "Average completion time", value: `${data.totals.averageCompletionDays} days` },
        { metric: "Candidates without mentors", value: data.totals.unassignedMentors },
        { metric: "Overdue mentor follow-ups", value: data.totals.overdueFollowUps },
        { metric: "Awaiting placement", value: data.totals.pendingPlacements },
      ],
    };
    return {
      title: "Discipleship performance overview",
      headers: [{ label: "Metric", key: "metric" }, { label: "Value", key: "value" }],
      rows: [
        { metric: "People entered", value: data.totals.intake },
        { metric: "Active journeys", value: data.totals.active },
        { metric: "Completed journeys", value: data.totals.completed },
        { metric: "Completion rate", value: `${data.totals.completionRate}%` },
        { metric: "Withdrawn journeys", value: data.totals.withdrawn },
        { metric: "Dropout rate", value: `${data.totals.dropoutRate}%` },
        { metric: "Class attendance rate", value: `${data.totals.attendanceRate}%` },
        { metric: "Upcoming sessions", value: data.totals.upcomingSessions },
      ],
    };
  }, [data, applied.reportType]);

  const visibleChurches = useMemo(() => churches.filter(church => config.region === "all" || church.region === config.region), [churches, config.region]);
  const visibleWorkflows = useMemo(() => (data?.filterOptions.workflows || []).filter(workflow => config.churchId === "all" || workflow.church.id === config.churchId), [data?.filterOptions.workflows, config.churchId]);

  const generate = () => {
    if (JSON.stringify(config) === JSON.stringify(applied)) void refetch();
    else setApplied({ ...config });
  };
  return (
    <div className="space-y-6 print:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Discipleship</p>
          <h1 className="font-heading text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Intake, completion, dropout and stage performance.
          </p>
        </div>
      </div>
      {isLoading || !data ? (
        <p>Loading report…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={Users} label={applied.mode === "cohort" ? "People entered" : "Journeys with activity"} value={applied.mode === "cohort" ? data.totals.intake : data.totals.inScope} note={applied.mode === "cohort" ? `${data.totals.active} currently active` : `${data.totals.intake} new journeys in the period`} />
            <Metric
              icon={UserCheck}
              label="Completion rate"
              value={`${data.totals.completionRate}%`}
              note={`${data.totals.completed} completed journeys`}
            />
            <Metric
              icon={UserMinus}
              label="Dropout rate"
              value={`${data.totals.dropoutRate}%`}
              note={`${data.totals.withdrawn} withdrawn journeys`}
            />
            <Metric
              icon={TrendingUp}
              label="Avg. completion"
              value={`${data.totals.averageCompletionDays} days`}
              note="Average journey duration"
            />
            <Metric icon={UserCheck} label="Class attendance" value={`${data.totals.attendanceRate}%`} note="Present and late check-ins" />
            <Metric icon={UserRoundX} label="Need a mentor" value={data.totals.unassignedMentors} note="Active candidates unassigned" />
            <Metric icon={ClockAlert} label="Overdue follow-ups" value={data.totals.overdueFollowUps} note="Mentor action required" />
            <Metric icon={CalendarDays} label="Sessions this week" value={data.totals.upcomingSessions} note="Scheduled in the next 7 days" />
            <Metric icon={MapPinned} label="Awaiting placement" value={data.totals.pendingPlacements} note="Team or cell placement planned" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-semibold">Intake trend</h2>
                {data.intakeTrend.map(x => (
                  <div key={x.period} className="mb-3">
                    <div className="flex justify-between text-sm">
                      <span>{x.period}</span>
                      <b>{x.count}</b>
                    </div>
                    <div className="h-2 rounded bg-muted">
                      <div
                        className="h-2 rounded bg-primary"
                        style={{
                          width: `${Math.min(100, (x.count / Math.max(...data.intakeTrend.map(i => i.count))) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-semibold">Dropout points</h2>
                {data.dropoutsByStage.length ? data.dropoutsByStage.map(x => (
                  <div key={x.stage} className="flex justify-between border-b py-3 text-sm">
                    <span>{x.stage}</span>
                    <b>{x.count}</b>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No withdrawals in this reporting period.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-semibold">
                  Candidates by current stage
                </h2>
                {data.candidatesByStage.map(x => (
                  <div
                    key={x.stage}
                    className="flex justify-between border-b py-3 text-sm"
                  >
                    <span>{x.stage}</span>
                    <b>{x.count}</b>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardContent className="p-5"><h2 className="mb-4 font-semibold">Time to milestone</h2>{data.timeToMilestone.length ? data.timeToMilestone.slice(0, 8).map(item => <div key={item.milestone} className="grid grid-cols-[1fr_auto] gap-3 border-b py-3 text-sm"><div><p className="font-medium">{item.milestone}</p><p className="text-xs text-muted-foreground">{item.completed} completed · median {item.medianDays} days</p></div><b className="tabular-nums">{item.averageDays} days avg.</b></div>) : <p className="text-sm text-muted-foreground">No milestone completions in this scope.</p>}</CardContent></Card>
            <Card><CardContent className="p-5"><h2 className="mb-4 font-semibold">Regional distribution</h2>{data.byRegion.length ? data.byRegion.map(item => <div key={item.region} className="flex justify-between border-b py-3 text-sm"><span>{item.region}</span><b>{item.count}</b></div>) : <p className="text-sm text-muted-foreground">No regional data in this scope.</p>}</CardContent></Card>
          </div>

          <Card className="print:hidden">
            <CardContent className="space-y-5 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <FileBarChart className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Generate a discipleship report</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Configure the scope and output, then generate a report separate from the live summary above.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2"><Label>Report</Label><Select value={config.reportType} onValueChange={(reportType: ReportType) => setConfig(current => ({ ...current, reportType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="overview">Performance overview</SelectItem><SelectItem value="intake">Intake trend</SelectItem><SelectItem value="stages">Candidates by stage</SelectItem><SelectItem value="dropouts">Dropout points</SelectItem><SelectItem value="milestones">Time to milestone</SelectItem><SelectItem value="regions">Journeys by region</SelectItem><SelectItem value="workflows">Journeys by workflow</SelectItem><SelectItem value="sources">Journeys by source</SelectItem><SelectItem value="outcomes">Outcomes and follow-up</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Date basis</Label><Select value={config.mode} onValueChange={(mode: "cohort" | "activity") => setConfig(current => ({ ...current, mode }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cohort">Cohort started in period</SelectItem><SelectItem value="activity">Any activity in period</SelectItem></SelectContent></Select><p className="text-xs text-muted-foreground">{config.mode === "cohort" ? "Tracks the eventual outcomes of people who started during the dates." : "Includes journeys with starts, updates, attendance, milestones or status changes during the dates."}</p></div>
                <div className="space-y-2"><Label>Region</Label><Select value={config.region} onValueChange={(region) => setConfig(current => ({ ...current, region, churchId: "all", workflowId: "all" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All accessible regions</SelectItem>{data.filterOptions.regions.map(region => <SelectItem key={region} value={region}>{region}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Church</Label><Select value={config.churchId} onValueChange={(churchId) => setConfig(current => ({ ...current, churchId, workflowId: "all" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All accessible churches</SelectItem>{visibleChurches.map(church => <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Workflow</Label><Select value={config.workflowId} onValueChange={(workflowId) => setConfig(current => ({ ...current, workflowId }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All workflows</SelectItem>{visibleWorkflows.map(workflow => <SelectItem key={workflow.id} value={workflow.id}>{workflow.name} · {workflow.church.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Intake source</Label><Select value={config.sourceType} onValueChange={(sourceType) => setConfig(current => ({ ...current, sourceType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All intake sources</SelectItem>{data.filterOptions.sources.map(source => <SelectItem key={source} value={source}>{source.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>From</Label><Input type="date" value={config.from} onChange={(event) => setConfig(current => ({ ...current, from: event.target.value }))} /></div>
                <div className="space-y-2"><Label>To</Label><Input type="date" min={config.from || undefined} value={config.to} onChange={(event) => setConfig(current => ({ ...current, to: event.target.value }))} /></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={generate} disabled={isFetching || (!!config.from && !!config.to && config.from > config.to)}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />{isFetching ? "Generating…" : "Generate report"}</Button>
                <Button variant="outline" onClick={() => setConfig(initialConfig)}>Reset configuration</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div><h2 className="font-semibold">{generatedReport.title}</h2><p className="text-xs text-muted-foreground">{applied.mode === "cohort" ? "Cohort" : "Activity"} · {applied.region === "all" ? "All accessible regions" : applied.region} · {applied.churchId === "all" ? "All accessible churches" : churches.find(church => church.id === applied.churchId)?.name || "Selected church"} · {applied.from || "Last 90 days"} to {applied.to || "today"}</p></div>
                <ExportImportButtons data={generatedReport.rows} filename={`discipleship-${applied.reportType}-report`} headers={generatedReport.headers} pdfTitle={generatedReport.title} summary={[{ label: "Date basis", value: applied.mode === "cohort" ? "Cohort started in period" : "Any activity in period" }, { label: "Region", value: applied.region === "all" ? "All accessible regions" : applied.region }, { label: "Church scope", value: applied.churchId === "all" ? "All accessible churches" : churches.find(church => church.id === applied.churchId)?.name || "Selected church" }, { label: "From", value: applied.from || "Last 90 days" }, { label: "To", value: applied.to || "Today" }]} />
              </div>
              <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/60"><tr>{generatedReport.headers.map(header => <th key={header.key} className="px-4 py-3 text-left font-medium">{header.label}</th>)}</tr></thead><tbody>{generatedReport.rows.map((row, index) => <tr key={`${index}-${Object.values(row).join("-")}`} className="border-t">{generatedReport.headers.map(header => <td key={header.key} className="px-4 py-3">{String(row[header.key] ?? "—")}</td>)}</tr>)}{generatedReport.rows.length === 0 && <tr><td colSpan={Math.max(1, generatedReport.headers.length)} className="px-4 py-8 text-center text-muted-foreground">No records matched this report configuration.</td></tr>}</tbody></table></div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
function Metric({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string | number; note?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {note && <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
