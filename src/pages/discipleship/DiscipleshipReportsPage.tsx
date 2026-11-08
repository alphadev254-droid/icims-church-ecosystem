import { useMemo, useState } from "react";
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

type ReportType = "overview" | "intake" | "stages" | "outcomes";

const initialConfig = { churchId: "all", from: "", to: "", reportType: "overview" as ReportType };

export default function DiscipleshipReportsPage() {
  const [config, setConfig] = useState(initialConfig);
  const [applied, setApplied] = useState(initialConfig);
  const { data: churches = [] } = useQuery({
    queryKey: ["churches-select"],
    queryFn: churchesService.getSelectable,
  });
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["discipleship-report", applied.churchId, applied.from, applied.to],
    queryFn: () =>
      discipleshipService.getReport({
        churchId: applied.churchId === "all" ? undefined : applied.churchId,
        from: applied.from || undefined,
        to: applied.to || undefined,
      }),
  });

  const generatedReport = useMemo(() => {
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
            <Metric icon={Users} label="People entered" value={data.totals.intake} note={`${data.totals.active} currently active`} />
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
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-semibold">Intake trend</h2>
                {data.intakeTrend.map((x: any) => (
                  <div key={x.period} className="mb-3">
                    <div className="flex justify-between text-sm">
                      <span>{x.period}</span>
                      <b>{x.count}</b>
                    </div>
                    <div className="h-2 rounded bg-muted">
                      <div
                        className="h-2 rounded bg-primary"
                        style={{
                          width: `${Math.min(100, (x.count / Math.max(...data.intakeTrend.map((i: any) => i.count))) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-semibold">
                  Candidates by current stage
                </h2>
                {data.candidatesByStage.map((x: any) => (
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
                <div className="space-y-2"><Label>Report</Label><Select value={config.reportType} onValueChange={(reportType: ReportType) => setConfig(current => ({ ...current, reportType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="overview">Performance overview</SelectItem><SelectItem value="intake">Intake trend</SelectItem><SelectItem value="stages">Candidates by stage</SelectItem><SelectItem value="outcomes">Outcomes and follow-up</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Church</Label><Select value={config.churchId} onValueChange={(churchId) => setConfig(current => ({ ...current, churchId }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All accessible churches</SelectItem>{churches.map(church => <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>)}</SelectContent></Select></div>
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
                <div><h2 className="font-semibold">{generatedReport.title}</h2><p className="text-xs text-muted-foreground">{applied.churchId === "all" ? "All accessible churches" : churches.find(church => church.id === applied.churchId)?.name || "Selected church"} · {applied.from || "Last 90 days"} to {applied.to || "today"}</p></div>
                <ExportImportButtons data={generatedReport.rows} filename={`discipleship-${applied.reportType}-report`} headers={generatedReport.headers} pdfTitle={generatedReport.title} summary={[{ label: "Church scope", value: applied.churchId === "all" ? "All accessible churches" : churches.find(church => church.id === applied.churchId)?.name || "Selected church" }, { label: "From", value: applied.from || "Last 90 days" }, { label: "To", value: applied.to || "Today" }]} />
              </div>
              <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/60"><tr>{generatedReport.headers.map(header => <th key={header.key} className="px-4 py-3 text-left font-medium">{header.label}</th>)}</tr></thead><tbody>{generatedReport.rows.map((row: any, index: number) => <tr key={`${index}-${Object.values(row).join("-")}`} className="border-t">{generatedReport.headers.map(header => <td key={header.key} className="px-4 py-3">{String(row[header.key] ?? "—")}</td>)}</tr>)}{generatedReport.rows.length === 0 && <tr><td colSpan={Math.max(1, generatedReport.headers.length)} className="px-4 py-8 text-center text-muted-foreground">No records matched this report configuration.</td></tr>}</tbody></table></div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
function Metric({ icon: Icon, label, value, note }: any) {
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
