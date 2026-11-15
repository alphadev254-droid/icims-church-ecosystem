import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { discipleshipService, type DiscipleshipRequirement } from "@/services/discipleship";
import { apiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Result = Awaited<ReturnType<typeof discipleshipService.submitJourneyAssessment>>;

export function AssessmentTakingDialog({ journeyId, requirement, onOpenChange, onCompleted }: { journeyId: string; requirement: DiscipleshipRequirement | null; onOpenChange: (open: boolean) => void; onCompleted: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<Result | null>(null);
  const query = useQuery({ queryKey: ["journey-assessment", journeyId, requirement?.id], queryFn: () => discipleshipService.getJourneyAssessment(journeyId, requirement!.id), enabled: !!requirement });
  const submit = useMutation({
    mutationFn: () => discipleshipService.submitJourneyAssessment(journeyId, requirement!.id, query.data!.questions.map(question => ({ questionId: question.id, selectedOptionIds: answers[question.id] || [] }))),
    onSuccess: submission => { setResult(submission); if (submission.passed) { toast.success("Assessment passed and requirement completed"); onCompleted(); } else toast.error("The pass score was not reached. Review the feedback and try again."); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not submit assessment")),
  });
  const select = (questionId: string, optionId: string, multiple: boolean, checked: boolean) => setAnswers(current => ({ ...current, [questionId]: multiple ? (checked ? [...new Set([...(current[questionId] || []), optionId])] : (current[questionId] || []).filter(id => id !== optionId)) : checked ? [optionId] : [] }));
  const close = () => { setAnswers({}); setResult(null); onOpenChange(false); };
  const answered = query.data?.questions.every(question => (answers[question.id] || []).length > 0) ?? false;

  return <Dialog open={!!requirement} onOpenChange={open => !open && close()}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{query.data?.title || requirement?.name || "Assessment"}</DialogTitle></DialogHeader>
    {query.isLoading ? <p className="py-10 text-center text-muted-foreground">Loading assessment…</p> : query.isError ? <p className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{apiErrorMessage(query.error, "This assessment is not available")}</p> : query.data && <div className="space-y-5">
      <div className="rounded-md border bg-muted/40 p-3 text-sm"><p>{query.data.description || "Answer every question and submit when ready."}</p><p className="mt-1 text-xs text-muted-foreground">Pass score: {query.data.passScore} / {query.data.maxScore} · {query.data.questions.length} questions</p></div>
      {query.data.questions.map((question, index) => { const feedback = result?.answers.find(answer => answer.questionId === question.id); return <div key={question.id} className="space-y-3 rounded-lg border p-4"><div className="flex items-start justify-between gap-3"><p className="font-medium">{index + 1}. {question.prompt}</p><span className="text-xs text-muted-foreground">{question.points} pt{question.points === 1 ? "" : "s"}</span></div><div className="space-y-2">{question.options.map(option => <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 hover:bg-muted/50"><Checkbox disabled={!!result} checked={(answers[question.id] || []).includes(option.id)} onCheckedChange={value => select(question.id, option.id, question.type === "multiple_choice", value === true)} /><span className="text-sm">{option.text}</span></label>)}</div>{feedback && <div className={`flex gap-2 rounded-md p-3 text-sm ${feedback.isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{feedback.isCorrect ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}<div><p className="font-medium">{feedback.isCorrect ? "Correct" : "Incorrect"}</p>{feedback.explanation && <p className="mt-1 text-foreground">{feedback.explanation}</p>}</div></div>}</div>; })}
      {result ? <div className={`rounded-lg border p-4 text-center ${result.passed ? "border-success/40 bg-success/10" : "border-destructive/30 bg-destructive/5"}`}><p className="text-2xl font-semibold">{result.score} / {result.maxScore}</p><p className="text-sm">{result.passed ? "Assessment passed" : `Pass score required: ${result.passScore}`}</p><div className="mt-4 flex justify-center gap-2">{!result.passed && <Button variant="outline" onClick={() => { setAnswers({}); setResult(null); }}>Try again</Button>}<Button onClick={close}>Close</Button></div></div> : <Button className="w-full" disabled={!answered || submit.isPending} onClick={() => submit.mutate()}>{submit.isPending ? "Grading…" : "Submit for automatic grading"}</Button>}
    </div>}
  </DialogContent></Dialog>;
}
