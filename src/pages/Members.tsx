import { useEffect, useState } from 'react';
import { membersApi } from '@/services/api';
import type { Member } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = () => membersApi.getAll().then(r => { if (r.success) setMembers(r.data); });
  useEffect(() => { load(); }, []);

  const filtered = members.filter(m =>
    `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const member: Member = {
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      churchId: 'c1',
      firstName: form.get('firstName') as string,
      lastName: form.get('lastName') as string,
      email: form.get('email') as string,
      phone: form.get('phone') as string,
      status: (form.get('status') as Member['status']) || 'pending',
      joinDate: new Date().toISOString().split('T')[0],
      roles: [],
    };
    await membersApi.create(member);
    toast.success('Member added');
    setDialogOpen(false);
    load();
  };

  const statusColor = (s: string) => {
    if (s === 'active') return 'default';
    if (s === 'pending') return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Members</h1>
          <p className="text-sm text-muted-foreground">{members.length} total members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              <Plus className="h-4 w-4" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Add New Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>First Name</Label><Input name="firstName" required /></div>
                <div><Label>Last Name</Label><Input name="lastName" required /></div>
              </div>
              <div><Label>Email</Label><Input name="email" type="email" required /></div>
              <div><Label>Phone</Label><Input name="phone" /></div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue="pending">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Add Member</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.firstName} {m.lastName}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{m.email}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{m.phone}</TableCell>
                  <TableCell><Badge variant={statusColor(m.status)}>{m.status}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{m.joinDate}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
