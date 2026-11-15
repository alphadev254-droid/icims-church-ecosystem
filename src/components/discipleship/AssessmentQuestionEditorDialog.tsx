import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { discipleshipService, type AssessmentQuestionType } from "@/services/discipleship";
import { apiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type EditableOption = { id: string; text: string };
type EditableQuestion = { prompt: string; type: AssessmentQuestionType; options: EditableOption[]; correctAnswerIds: string[]; points: number; explanation: string };
const identifier = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const emptyQuestion = (): EditableQuestion => {
  const first = identifier(); const second = identifier();
  return { prompt: "", type: "single_choice", options: [{ id: first, text: "" }, { id: second, text: "" }], correctAnswerIds: [], points: 1, explanation: "" };
};

export function AssessmentQuestionEditorDialog({ definition, onOpenChange }: { definition: { id: string; title: string } | null; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<EditableQuestion[]>([emptyQuestion()]);
  const query = useQuery({ queryKey: ["discipleship-assessment-questions", definition?.id], queryFn: () => discipleshipService.getAssessmentQuestions(definition!.id), enabled: !!definition });
  useEffect(() => {
    if (!definition || !query.data) return;
    setQuestions(query.data.questions.length ? query.data.questions.map(question => ({ prompt: question.prompt, type: question.type, options: question.options, correctAnswerIds: question.correctAnswerIds || [], points: question.points, explanation: question.explanation || "" })) : [emptyQuestion()]);
  }, [definition, query.data]);
  const save = useMutation({
    mutationFn: () => discipleshipService.replaceAssessmentQuestions(definition!.id, questions.map(question => ({ ...question, explanation: question.explanation || undefined }))),
    onSuccess: () => { toast.success("Assessment questions saved"); queryClient.invalidateQueries({ queryKey: ["discipleship-assessment-questions", definition?.id] }); queryClient.invalidateQueries({ queryKey: ["discipleship-requirement-definitions"] }); onOpenChange(false); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not save assessment questions")),
  });
  const updateQuestion = (index: number, patch: Partial<EditableQuestion>) => setQuestions(current => current.map((question, questionIndex) => questionIndex === index ? { ...question, ...patch } : question));
  const changeType = (index: number, type: AssessmentQuestionType) => {
    if (type === "true_false") updateQuestion(index, { type, options: [{ id: "true", text: "True" }, { id: "false", text: "False" }], correctAnswerIds: [] });
    else updateQuestion(index, { type, correctAnswerIds: [] });
  };
  const toggleCorrect = (questionIndex: number, optionId: string, checked: boolean) => {
    const question = questions[questionIndex];
    updateQuestion(questionIndex, { correctAnswerIds: question.type === "multiple_choice" ? (checked ? [...new Set([...question.correctAnswerIds, optionId])] : question.correctAnswerIds.filter(id => id !== optionId)) : checked ? [optionId] : [] });
  };
  const valid = questions.length > 0 && questions.every(question => question.prompt.trim() && question.points > 0 && question.options.length >= 2 && question.options.every(option => option.text.trim()) && question.correctAnswerIds.length > 0);

  return <Dialog open={!!definition} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-3xl"><DialogHeader className="border-b px-6 py-4"><DialogTitle>Assessment questions · {definition?.title}</DialogTitle></DialogHeader><div className="max-h-[calc(92vh-150px)] space-y-4 overflow-y-auto px-6 py-4">
    {query.isLoading ? <p className="py-10 text-center text-muted-foreground">Loading questions…</p> : questions.map((question, questionIndex) => <div key={questionIndex} className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between"><p className="font-medium">Question {questionIndex + 1}</p>{questions.length > 1 && <Button type="button" size="icon" variant="ghost" onClick={() => setQuestions(current => current.filter((_, index) => index !== questionIndex))}><Trash2 className="h-4 w-4" /></Button>}</div>
      <div className="grid gap-2"><Label>Question</Label><Textarea value={question.prompt} onChange={event => updateQuestion(questionIndex, { prompt: event.target.value })} placeholder="Write a clear question" /></div>
      <div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-2"><Label>Answer type</Label><Select value={question.type} onValueChange={(value: AssessmentQuestionType) => changeType(questionIndex, value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="single_choice">One correct answer</SelectItem><SelectItem value="multiple_choice">Multiple correct answers</SelectItem><SelectItem value="true_false">True or false</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label>Points</Label><Input type="number" min="0.1" step="0.1" value={question.points} onChange={event => updateQuestion(questionIndex, { points: Number(event.target.value) })} /></div></div>
      <div className="space-y-2"><div><Label>Answer options</Label><p className="text-xs text-muted-foreground">Tick every correct answer.</p></div>{question.options.map((option, optionIndex) => <div key={option.id} className="flex items-center gap-2"><Checkbox checked={question.correctAnswerIds.includes(option.id)} onCheckedChange={value => toggleCorrect(questionIndex, option.id, value === true)} /><Input disabled={question.type === "true_false"} value={option.text} onChange={event => updateQuestion(questionIndex, { options: question.options.map((item, index) => index === optionIndex ? { ...item, text: event.target.value } : item) })} placeholder={`Option ${optionIndex + 1}`} />{question.type !== "true_false" && question.options.length > 2 && <Button type="button" size="icon" variant="ghost" onClick={() => updateQuestion(questionIndex, { options: question.options.filter(item => item.id !== option.id), correctAnswerIds: question.correctAnswerIds.filter(id => id !== option.id) })}><Trash2 className="h-4 w-4" /></Button>}</div>)}{question.type !== "true_false" && question.options.length < 10 && <Button type="button" size="sm" variant="outline" onClick={() => updateQuestion(questionIndex, { options: [...question.options, { id: identifier(), text: "" }] })}><Plus className="mr-1 h-4 w-4" />Answer option</Button>}</div>
      <div className="grid gap-2"><Label>Explanation shown after submission (optional)</Label><Textarea value={question.explanation} onChange={event => updateQuestion(questionIndex, { explanation: event.target.value })} /></div>
    </div>)}
    <Button type="button" variant="outline" onClick={() => setQuestions(current => [...current, emptyQuestion()])}><Plus className="mr-2 h-4 w-4" />Add question</Button>
  </div><div className="flex justify-end gap-2 border-t px-6 py-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!valid || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Save questions"}</Button></div></DialogContent></Dialog>;
}
