import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  CalendarDays,
  ClockAlert,
  MapPinned,
  Printer,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
  UserRoundX,
} from "lucide-react";
import { discipleshipService } from "@/services/discipleship";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DiscipleshipReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["discipleship-report", from, to],
    queryFn: () =>
      discipleshipService.getReport({
        from: from || undefined,
        to: to || undefined,
      }),
  });
  const csv = () => {
    if (!data) return;
    const rows = [
      ["Metric", "Value"],
      ...Object.entries(data.totals),
      [],
      ["Period", "Intake"],
      ...data.intakeTrend.map((x: any) => [x.period, x.count]),
      [],
      ["Stage", "Candidates"],
      ...data.candidatesByStage.map((x: any) => [x.stage, x.count]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "discipleship-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
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
        <div className="flex items-end gap-2 print:hidden">
          <label className="text-xs">
            From
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="text-xs">
            To
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <Button variant="outline" onClick={csv}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            PDF
          </Button>
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
