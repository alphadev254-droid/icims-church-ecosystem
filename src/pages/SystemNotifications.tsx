import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { systemNotificationApi } from '@/services/systemNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SystemNotifications() {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery({ queryKey: ['system-notifications'], queryFn: () => systemNotificationApi.list({ limit: 50 }).then(r => r.data.data) });
  const refresh = () => { queryClient.invalidateQueries({ queryKey: ['system-notifications'] }); queryClient.invalidateQueries({ queryKey: ['system-notification-count'] }); };
  const markRead = useMutation({ mutationFn: systemNotificationApi.markRead, onSuccess: refresh });
  const markAll = useMutation({ mutationFn: systemNotificationApi.markAllRead, onSuccess: refresh });
  return <div className="mx-auto max-w-4xl space-y-5"><div className="flex items-center justify-between gap-3"><div><h1 className="font-heading text-2xl font-bold">System Notifications</h1><p className="text-sm text-muted-foreground">Official ICIMS updates for your account.</p></div><Button variant="outline" onClick={() => markAll.mutate()}><CheckCheck className="mr-2 h-4 w-4" />Mark all read</Button></div>{isLoading ? <p className="text-muted-foreground">Loading…</p> : notifications.length === 0 ? <Card><CardContent className="py-12 text-center"><Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p>No system notifications yet.</p></CardContent></Card> : notifications.map(item => <Card key={item.id} className={!item.readAt ? 'border-accent/60 bg-accent/5' : ''}><CardContent className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex flex-wrap gap-2"><Badge variant={item.campaign.priority === 'urgent' ? 'destructive' : 'secondary'}>{item.campaign.priority}</Badge><Badge variant="outline">{item.campaign.category.replace('_', ' ')}</Badge>{!item.readAt && <Badge>New</Badge>}</div><span className="text-xs text-muted-foreground">{new Date(item.campaign.sentAt || item.createdAt).toLocaleString()}</span></div><h2 className="mt-3 text-lg font-semibold">{item.campaign.title}</h2>{item.campaign.summary && <p className="mt-1 text-sm font-medium text-muted-foreground">{item.campaign.summary}</p>}<p className="mt-3 whitespace-pre-wrap text-sm leading-6">{item.campaign.message}</p><div className="mt-4 flex gap-2">{!item.readAt && <Button size="sm" variant="outline" onClick={() => markRead.mutate(item.id)}>Mark as read</Button>}{item.campaign.actionLabel && item.campaign.actionUrl && <Button size="sm" asChild><a href={item.campaign.actionUrl}>{item.campaign.actionLabel}<ExternalLink className="ml-2 h-3.5 w-3.5" /></a></Button>}</div></CardContent></Card>)}</div>;
}
