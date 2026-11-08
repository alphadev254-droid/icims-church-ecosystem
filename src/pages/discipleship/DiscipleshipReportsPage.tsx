import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Printer,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
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
            <Metric icon={Users} label="Intake" value={data.totals.intake} />
            <Metric
              icon={UserCheck}
              label="Completion rate"
              value={`${data.totals.completionRate}%`}
            />
            <Metric
              icon={UserMinus}
              label="Dropout rate"
              value={`${data.totals.dropoutRate}%`}
            />
            <Metric
              icon={TrendingUp}
              label="Avg. completion"
              value={`${data.totals.averageCompletionDays} days`}
            />
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
function Metric({ icon: Icon, label, value }: any) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
