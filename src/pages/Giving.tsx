import { useEffect, useState } from 'react';
import { donationsApi } from '@/services/api';
import type { Donation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, HandCoins, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function GivingPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = () => donationsApi.getAll().then(r => { if (r.success) setDonations(r.data); });
  useEffect(() => { load(); }, []);

  const total = donations.filter(d => d.status === 'completed').reduce((s, d) => s + d.amount, 0);
  const tithes = donations.filter(d => d.type === 'tithe' && d.status === 'completed').reduce((s, d) => s + d.amount, 0);
  const offerings = donations.filter(d => d.type === 'offering' && d.status === 'completed').reduce((s, d) => s + d.amount, 0);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const donation: Donation = {
      id: crypto.randomUUID(),
      memberId: crypto.randomUUID(),
      memberName: form.get('memberName') as string,
      churchId: 'c1',
      amount: Number(form.get('amount')),
      type: (form.get('type') as Donation['type']) || 'tithe',
      date: new Date().toISOString().split('T')[0],
      method: (form.get('method') as Donation['method']) || 'cash',
      status: 'completed',
    };
    await donationsApi.create(donation);
    toast.success('Donation recorded');
    setDialogOpen(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Giving & Donations</h1>
          <p className="text-sm text-muted-foreground">{donations.length} transactions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              <Plus className="h-4 w-4" /> Record Donation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Record Donation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><Label>Donor Name</Label><Input name="memberName" required /></div>
              <div><Label>Amount (KES)</Label><Input name="amount" type="number" required min={1} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select name="type" defaultValue="tithe">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tithe">Tithe</SelectItem>
                      <SelectItem value="offering">Offering</SelectItem>
                      <SelectItem value="pledge">Pledge</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Method</Label>
                  <Select name="method" defaultValue="cash">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Record Donation</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: 'Total Giving', value: `KES ${total.toLocaleString()}`, icon: HandCoins },
          { title: 'Tithes', value: `KES ${tithes.toLocaleString()}`, icon: TrendingUp },
          { title: 'Offerings', value: `KES ${offerings.toLocaleString()}`, icon: HandCoins },
        ].map(s => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold font-heading">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.memberName}</TableCell>
                  <TableCell>KES {d.amount.toLocaleString()}</TableCell>
                  <TableCell className="hidden sm:table-cell capitalize">{d.type}</TableCell>
                  <TableCell className="hidden md:table-cell capitalize">{d.method.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === 'completed' ? 'default' : d.status === 'pending' ? 'secondary' : 'destructive'}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{d.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
