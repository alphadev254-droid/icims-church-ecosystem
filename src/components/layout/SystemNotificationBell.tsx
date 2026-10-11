import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { systemNotificationApi, type SystemNotification } from '@/services/systemNotifications';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function SystemNotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: count } = useQuery({ queryKey: ['system-notification-count'], queryFn: () => systemNotificationApi.unreadCount().then(r => r.data.data), refetchInterval: 60000, refetchOnWindowFocus: true });
  const { data: notifications = [] } = useQuery({ queryKey: ['system-notifications', 'recent'], queryFn: () => systemNotificationApi.list({ limit: 10 }).then(r => r.data.data) });
  const markRead = useMutation({ mutationFn: systemNotificationApi.markRead, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['system-notifications'] }); queryClient.invalidateQueries({ queryKey: ['system-notification-count'] }); } });
  const open = (item: SystemNotification) => { if (!item.readAt) markRead.mutate(item.id); navigate('/dashboard/notifications', { state: { selectedId: item.id } }); };
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="relative"><Bell className="h-5 w-5" />{!!count?.unread && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{count.unread > 99 ? '99+' : count.unread}</span>}</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-80"><div className="px-3 py-2"><p className="font-semibold">System notifications</p><p className="text-xs text-muted-foreground">{count?.unread || 0} unread</p></div><DropdownMenuSeparator />{notifications.length === 0 ? <p className="p-4 text-center text-sm text-muted-foreground">No notifications</p> : notifications.slice(0, 5).map(item => <DropdownMenuItem key={item.id} className="cursor-pointer items-start gap-2 p-3" onClick={() => open(item)}><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.readAt ? 'bg-muted' : item.campaign.priority === 'urgent' ? 'bg-destructive' : 'bg-accent'}`} /><span><span className="block font-medium">{item.campaign.title}</span><span className="line-clamp-2 text-xs text-muted-foreground">{item.campaign.summary || item.campaign.message}</span></span></DropdownMenuItem>)}<DropdownMenuSeparator /><DropdownMenuItem className="justify-center cursor-pointer" onClick={() => navigate('/dashboard/notifications')}>View all notifications</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
