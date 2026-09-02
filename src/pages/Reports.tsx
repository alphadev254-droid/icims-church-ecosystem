import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import { membersService } from '@/services/members';
import { givingService } from '@/services/giving';
import { attendanceService } from '@/services/attendance';
import { kpiService, KPI, CreateKPIData } from '@/services/kpi';
import { churchesService } from '@/services/churches';
import { transactionsService } from '@/services/transactions';
import { cellsService } from '@/services/cells';
import { teamsService } from '@/services/teams';
import { useAuth } from '@/contexts/AuthContext';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Users, HandCoins, ClipboardList, Calendar, Download, FileText, Lock, Target, Plus, RefreshCw, Pencil, StopCircle, PlayCircle, UserX, Group, CreditCard, Handshake, UserCheck, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService } from '@/services/events';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

type ReportCellValue = string | number | boolean | null | undefined;

async function downloadReportWorkbook(filename: string, rows: ReportCellValue[][], headers: string[]) {
  const XLSX = await import('xlsx-js-style');
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const ref = worksheet['!ref'];
  const range = ref ? XLSX.utils.decode_range(ref) : { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } };
  const totalColumnIndex = range.e.c;
  const totalRowIndex = rows.length > 0 && String(rows[rows.length - 1]?.[0] ?? '').toUpperCase().startsWith('TOTAL')
    ? range.e.r
    : -1;
  const blueStyle = {
    fill: { patternType: 'solid', fgColor: { rgb: '1F4E78' } },
    font: { color: { rgb: 'FFFFFF' }, bold: true },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'D9EAF7' } },
      bottom: { style: 'thin', color: { rgb: 'D9EAF7' } },
      left: { style: 'thin', color: { rgb: 'D9EAF7' } },
      right: { style: 'thin', color: { rgb: 'D9EAF7' } },
    },
  };
  const bodyStyle = {
    alignment: { vertical: 'top', wrapText: true },
    border: {
      bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
    },
  };

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      if (!worksheet[cellRef]) worksheet[cellRef] = { t: 's', v: '' };
      const isHeader = rowIndex === 0;
      const isTotalColumn = colIndex === totalColumnIndex;
      const isTotalRow = rowIndex === totalRowIndex;
      worksheet[cellRef].s = isHeader || isTotalColumn || isTotalRow ? blueStyle : bodyStyle;
    }
  }

  worksheet['!cols'] = headers.map((header, colIndex) => {
    const maxLength = [header, ...rows.map(row => String(row[colIndex] ?? ''))]
      .reduce((max, value) => Math.max(max, value.length), 0);
    return { wch: Math.min(Math.max(maxLength + 2, 12), 34) };
  });

  worksheet['!rows'] = [{ hpt: 24 }, ...rows.map(() => ({ hpt: 22 }))];

  const sheetName = filename
    .replace(/\.xlsx$/i, '')
    .replace(/[:\\/?*\[\]]/g, ' ')
    .slice(0, 31) || 'Report';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

function appendUniqueValue(existing: string, value: string) {
  if (!value) return existing;
  const values = existing ? existing.split('; ').filter(Boolean) : [];
  return values.includes(value) ? existing : [...values, value].join('; ');
}

function toReportAmount(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatReportAmount(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

function blankColumns(count: number) {
  return Array.from({ length: count }, () => '');
}

function countTruthy<T>(items: T[], predicate: (item: T) => boolean) {
  return items.reduce((total, item) => total + (predicate(item) ? 1 : 0), 0);
}

function summarizeAmountsByCurrency<T>(items: T[], getCurrency: (item: T) => string, getAmount: (item: T) => unknown) {
  const totals = new Map<string, number>();
  for (const item of items) {
    const currency = getCurrency(item) || 'Unknown';
    totals.set(currency, (totals.get(currency) ?? 0) + toReportAmount(getAmount(item)));
  }
  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, total]) => `${currency} ${formatReportAmount(total)}`)
    .join('; ');
}

type GivingCampaignExportRow = {
  donorKey?: string;
  userId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  donorType?: string;
  church?: string;
  cell?: string;
  currency?: string;
  campaign?: string;
  campaigns?: string;
  totalAmount?: number | string | null;
  totalGiven?: number | string | null;
};

type PledgeCampaignExportRow = {
  pledgerKey?: string;
  name?: string;
  email?: string;
  phone?: string;
  pledgerType?: string;
  campaign?: string;
  church?: string;
  currency?: string;
  pledgedTotal?: number | string | null;
  paidTotal?: number | string | null;
  outstandingTotal?: number | string | null;
  pledgeCount?: number | string | null;
  statuses?: string;
};

function buildGivingCampaignMatrix(data: GivingCampaignExportRow[], options: { includeDonorType?: boolean } = {}) {
  const campaignNames: string[] = [];
  const campaignTotals = new Map<string, number>();
  const members = new Map<string, {
    name: string;
    email: string;
    phone: string;
    donorType: string;
    church: string;
    cell: string;
    currency: string;
    campaignAmounts: Map<string, number>;
    total: number;
  }>();

  for (const row of data) {
    const campaignName = row.campaign || row.campaigns || 'Unassigned Campaign';
    if (!campaignNames.includes(campaignName)) campaignNames.push(campaignName);

    const name = row.name || [row.firstName, row.lastName].filter(Boolean).join(' ').trim() || row.email || row.phone || 'Unknown Donor';
    const key = row.userId || row.donorKey || `${row.email || ''}|${row.phone || ''}|${name}`;
    const amount = toReportAmount(row.totalGiven ?? row.totalAmount);

    const member = members.get(key) ?? {
      name,
      email: row.email || '',
      phone: row.phone || '',
      donorType: '',
      church: '',
      cell: '',
      currency: '',
      campaignAmounts: new Map<string, number>(),
      total: 0,
    };

    member.donorType = appendUniqueValue(member.donorType, row.donorType || '');
    member.church = appendUniqueValue(member.church, row.church || '');
    member.cell = appendUniqueValue(member.cell, row.cell || '');
    member.currency = appendUniqueValue(member.currency, row.currency || '');
    member.campaignAmounts.set(campaignName, (member.campaignAmounts.get(campaignName) ?? 0) + amount);
    member.total += amount;
    members.set(key, member);

    campaignTotals.set(campaignName, (campaignTotals.get(campaignName) ?? 0) + amount);
  }

  const rows = Array.from(members.values())
    .sort((a, b) => b.total - a.total)
    .map(member => {
      const baseColumns = options.includeDonorType
        ? [member.name, member.email, member.phone, member.donorType, member.church, member.cell, member.currency]
        : [member.name, member.email, member.phone, member.church, member.cell, member.currency];

      return [
        ...baseColumns,
        ...campaignNames.map(campaign => formatReportAmount(member.campaignAmounts.get(campaign) ?? 0)),
        formatReportAmount(member.total),
      ];
    });

  const emptyMetadataColumns = options.includeDonorType ? ['', '', '', '', '', ''] : ['', '', '', '', ''];

  const grandTotal = campaignNames.reduce((sum, campaign) => sum + (campaignTotals.get(campaign) ?? 0), 0);
  if (rows.length > 0) {
    rows.push([
      'TOTAL',
      ...emptyMetadataColumns,
      ...campaignNames.map(campaign => formatReportAmount(campaignTotals.get(campaign) ?? 0)),
      formatReportAmount(grandTotal),
    ]);
  }

  return {
    headers: options.includeDonorType
      ? ['Name', 'Email', 'Phone', 'Type', 'Church', 'Cell', 'Currency', ...campaignNames, 'Total']
      : ['Name', 'Email', 'Phone', 'Church', 'Cell', 'Currency', ...campaignNames, 'Total'],
    rows,
  };
}

function buildPledgeCampaignMatrix(data: PledgeCampaignExportRow[]) {
  const campaignNames: string[] = [];
  const campaignTotals = new Map<string, { pledged: number; paid: number; outstanding: number }>();
  const pledgers = new Map<string, {
    name: string;
    email: string;
    phone: string;
    type: string;
    church: string;
    currency: string;
    statuses: string;
    campaignAmounts: Map<string, { pledged: number; paid: number; outstanding: number }>;
    pledgedTotal: number;
    paidTotal: number;
    outstandingTotal: number;
  }>();

  for (const row of data) {
    const campaignName = row.campaign || 'Unassigned Campaign';
    if (!campaignNames.includes(campaignName)) campaignNames.push(campaignName);

    const name = row.name || row.email || row.phone || 'Unknown Pledger';
    const key = row.pledgerKey || `${row.email || ''}|${row.phone || ''}|${name}`;
    const pledged = toReportAmount(row.pledgedTotal);
    const paid = toReportAmount(row.paidTotal);
    const outstanding = row.outstandingTotal == null ? pledged - paid : toReportAmount(row.outstandingTotal);

    const pledger = pledgers.get(key) ?? {
      name,
      email: row.email || '',
      phone: row.phone || '',
      type: '',
      church: '',
      currency: '',
      statuses: '',
      campaignAmounts: new Map<string, { pledged: number; paid: number; outstanding: number }>(),
      pledgedTotal: 0,
      paidTotal: 0,
      outstandingTotal: 0,
    };

    pledger.type = appendUniqueValue(pledger.type, row.pledgerType || '');
    pledger.church = appendUniqueValue(pledger.church, row.church || '');
    pledger.currency = appendUniqueValue(pledger.currency, row.currency || '');
    pledger.statuses = appendUniqueValue(pledger.statuses, row.statuses || '');

    const existingCampaign = pledger.campaignAmounts.get(campaignName) ?? { pledged: 0, paid: 0, outstanding: 0 };
    existingCampaign.pledged += pledged;
    existingCampaign.paid += paid;
    existingCampaign.outstanding += outstanding;
    pledger.campaignAmounts.set(campaignName, existingCampaign);
    pledger.pledgedTotal += pledged;
    pledger.paidTotal += paid;
    pledger.outstandingTotal += outstanding;
    pledgers.set(key, pledger);

    const totals = campaignTotals.get(campaignName) ?? { pledged: 0, paid: 0, outstanding: 0 };
    totals.pledged += pledged;
    totals.paid += paid;
    totals.outstanding += outstanding;
    campaignTotals.set(campaignName, totals);
  }

  const campaignHeaders = campaignNames.flatMap(campaign => [
    `${campaign} Pledged`,
    `${campaign} Paid`,
    `${campaign} Outstanding`,
  ]);

  const rows = Array.from(pledgers.values())
    .sort((a, b) => b.pledgedTotal - a.pledgedTotal || a.name.localeCompare(b.name))
    .map(pledger => [
      pledger.name,
      pledger.email,
      pledger.phone,
      pledger.type,
      pledger.church,
      pledger.currency,
      pledger.statuses,
      ...campaignNames.flatMap(campaign => {
        const amounts = pledger.campaignAmounts.get(campaign) ?? { pledged: 0, paid: 0, outstanding: 0 };
        return [
          formatReportAmount(amounts.pledged),
          formatReportAmount(amounts.paid),
          formatReportAmount(amounts.outstanding),
        ];
      }),
      formatReportAmount(pledger.pledgedTotal),
      formatReportAmount(pledger.paidTotal),
      formatReportAmount(pledger.outstandingTotal),
    ]);

  if (rows.length > 0) {
    const grandTotals = Array.from(campaignTotals.values()).reduce(
      (totals, campaign) => ({
        pledged: totals.pledged + campaign.pledged,
        paid: totals.paid + campaign.paid,
        outstanding: totals.outstanding + campaign.outstanding,
      }),
      { pledged: 0, paid: 0, outstanding: 0 },
    );

    rows.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      ...campaignNames.flatMap(campaign => {
        const totals = campaignTotals.get(campaign) ?? { pledged: 0, paid: 0, outstanding: 0 };
        return [
          formatReportAmount(totals.pledged),
          formatReportAmount(totals.paid),
          formatReportAmount(totals.outstanding),
        ];
      }),
      formatReportAmount(grandTotals.pledged),
      formatReportAmount(grandTotals.paid),
      formatReportAmount(grandTotals.outstanding),
    ]);
  }

  return {
    headers: ['Name', 'Email', 'Phone', 'Type', 'Church', 'Currency', 'Statuses', ...campaignHeaders, 'Total Pledged', 'Total Paid', 'Total Outstanding'],
    rows,
  };
}

export default function ReportsPage() {
  const { user } = useAuth();
  const hasReports = useHasFeature('reports_analytics');
  const { hasPermission } = useRole();
  const queryClient = useQueryClient();
  const [deleteKpi, setDeleteKpi] = useState<KPI | null>(null);
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KPI | null>(null);
  
  // Filter states
  const [memberChurchFilter, setMemberChurchFilter] = useState('all');
  const [givingCampaignFilter, setGivingCampaignFilter] = useState('all');
  const [givingChurchFilter, setGivingChurchFilter] = useState('all');
  const [attendanceServiceFilter, setAttendanceServiceFilter] = useState('all');
  const [attendanceChurchFilter, setAttendanceChurchFilter] = useState('all');
  // New report filters
  const [inactiveMemberChurchFilter, setInactiveMemberChurchFilter] = useState('all');
  const [pledgeChurchFilter, setPledgeChurchFilter] = useState('all');
  const [pledgeStatusFilter, setPledgeStatusFilter] = useState('all');
  const [pledgeCategoryFilter, setPledgeCategoryFilter] = useState('all');
  const [pledgeCampaignFilter, setPledgeCampaignFilter] = useState('all');
  const [txChurchFilter, setTxChurchFilter] = useState('all');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [txStartDate, setTxStartDate] = useState('');
  const [txEndDate, setTxEndDate] = useState('');
  const [givingByMemberChurchFilter, setGivingByMemberChurchFilter] = useState('all');
  const [givingByMemberCategoryFilter, setGivingByMemberCategoryFilter] = useState('all');
  const [givingByMemberCampaignFilter, setGivingByMemberCampaignFilter] = useState('all');
  const [givingByMemberStartDate, setGivingByMemberStartDate] = useState('');
  const [givingByMemberEndDate, setGivingByMemberEndDate] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('all');
  const [memberCellFilter, setMemberCellFilter] = useState('all');
  const [memberTeamFilter, setMemberTeamFilter] = useState('all');
  const [givingCellFilter, setGivingCellFilter] = useState('all');
  const [batchSizeMap, setBatchSizeMap] = useState<Record<string, number>>({});
  const [batchPageMap, setBatchPageMap] = useState<Record<string, number>>({});
  const [batchTotalPagesMap, setBatchTotalPagesMap] = useState<Record<string, number>>({});

  // ── Batch-export helpers ─────────────────────────────────────────────────────
  const getBatchParams = (title: string) => {
    const bSize = batchSizeMap[title] ?? 0;
    const bPage = batchPageMap[title] ?? 1;
    return bSize > 0 ? { limit: bSize, page: bPage, export: true } : { export: true };
  };
  const handleBatchResponse = (title: string, response: any) => {
    if (response?.pagination?.totalPages) {
      setBatchTotalPagesMap(prev => ({ ...prev, [title]: response.pagination.totalPages }));
    }
  };

  const [cellChurchFilter, setCellChurchFilter] = useState('all');
  const [cellGroupCellFilter, setCellGroupCellFilter] = useState('all');
  const [cellGroupStartDate, setCellGroupStartDate] = useState('');
  const [cellGroupEndDate, setCellGroupEndDate] = useState('');
  const [givingCategoryFilter, setGivingCategoryFilter] = useState('all');
  const [givingStartDate, setGivingStartDate] = useState('');
  const [givingEndDate, setGivingEndDate] = useState('');
  const [attendanceStartDate, setAttendanceStartDate] = useState('');
  const [attendanceEndDate, setAttendanceEndDate] = useState('');
  const [pledgeStartDate, setPledgeStartDate] = useState('');
  const [pledgeEndDate, setPledgeEndDate] = useState('');
  const [visitorChurchFilter, setVisitorChurchFilter] = useState('all');
  const [visitorCellFilter, setVisitorCellFilter] = useState('all');
  const [visitorStartDate, setVisitorStartDate] = useState('');
  const [visitorEndDate, setVisitorEndDate] = useState('');
  const [churchVisitorChurchFilter, setChurchVisitorChurchFilter] = useState('all');
  const [churchVisitorServiceType, setChurchVisitorServiceType] = useState('all');
  const [churchVisitorStartDate, setChurchVisitorStartDate] = useState('');
  const [churchVisitorEndDate, setChurchVisitorEndDate] = useState('');

  // ── Fetch batch total-pages when filters change ──────────────────────────
  // Proactively fetch totalPages so page nav shows "P1 of 47" immediately
  // instead of only after the first export.
  useEffect(() => {
    const timer = setTimeout(async () => {
      const cards = Object.entries(batchSizeMap).filter(([_, s]) => s > 0);
      if (cards.length === 0) return;

      await Promise.allSettled(
        cards.map(async ([title, limit]) => {
          let response: any;
          const page = 1;

          switch (title) {
            case 'Membership Report': {
              const p: any = { limit, page, export: true };
              if (memberChurchFilter !== 'all') p.churchId = memberChurchFilter;
              if (memberStatusFilter !== 'all') p.status = memberStatusFilter;
              if (memberCellFilter !== 'all') p.cellId = memberCellFilter;
              if (memberTeamFilter !== 'all') p.teamId = memberTeamFilter;
              response = await membersService.getAll(p);
              break;
            }
            case 'Giving Report': {
              const p: any = {
                limit, page, export: true,
                groupByPersonCampaign: true,
                category: givingCategoryFilter !== 'all' ? givingCategoryFilter : undefined,
                cellId: givingCategoryFilter === 'fellowship_offering' && givingCellFilter !== 'all' ? givingCellFilter : undefined,
                startDate: givingStartDate || undefined,
                endDate: givingEndDate || undefined,
              };
              response = await givingService.getDonations(
                givingCampaignFilter !== 'all' ? givingCampaignFilter : undefined,
                givingChurchFilter !== 'all' ? givingChurchFilter : undefined,
                p,
              );
              break;
            }
            case 'Giving by Member': {
              const p: any = {
                limit, page, export: true,
                groupByCampaign: true,
                category: givingByMemberCategoryFilter !== 'all' ? givingByMemberCategoryFilter : undefined,
                campaignId: givingByMemberCampaignFilter !== 'all' ? givingByMemberCampaignFilter : undefined,
                startDate: givingByMemberStartDate || undefined,
                endDate: givingByMemberEndDate || undefined,
              };
              if (givingByMemberChurchFilter !== 'all') p.churchId = givingByMemberChurchFilter;
              response = await transactionsService.getGivingByMember(p);
              break;
            }
            case 'Attendance Report': {
              const p: any = { limit, page, export: true };
              if (attendanceServiceFilter !== 'all') p.serviceType = attendanceServiceFilter;
              if (attendanceChurchFilter !== 'all') p.churchId = attendanceChurchFilter;
              if (attendanceStartDate) p.startDate = attendanceStartDate;
              if (attendanceEndDate) p.endDate = attendanceEndDate;
              response = await attendanceService.getAll(p);
              break;
            }
            case 'Inactive Members Report': {
              const p: any = { limit, page, export: true, status: 'inactive' };
              if (inactiveMemberChurchFilter !== 'all') p.churchId = inactiveMemberChurchFilter;
              response = await membersService.getAll(p);
              break;
            }
            case 'Pledge Report': {
              const p: any = { limit, page, export: true, groupByPersonCampaign: true };
              if (pledgeChurchFilter !== 'all') p.churchId = pledgeChurchFilter;
              if (pledgeStatusFilter !== 'all') p.status = pledgeStatusFilter;
              if (pledgeCategoryFilter !== 'all') p.category = pledgeCategoryFilter;
              if (pledgeCampaignFilter !== 'all') p.campaignId = pledgeCampaignFilter;
              if (pledgeStartDate) p.startDate = pledgeStartDate;
              if (pledgeEndDate) p.endDate = pledgeEndDate;
              response = await givingService.getMinistryPledges(p);
              break;
            }
            case 'Transaction Report': {
              const p: any = { limit, page, export: true };
              if (txChurchFilter !== 'all') p.churchId = txChurchFilter;
              if (txTypeFilter !== 'all') p.type = txTypeFilter;
              if (txStartDate) p.startDate = txStartDate;
              if (txEndDate) p.endDate = txEndDate;
              response = await transactionsService.exportAll(p);
              break;
            }
            case 'Cell Groups Report': {
              const p: any = { limit, page, export: true };
              if (cellChurchFilter !== 'all') p.churchId = cellChurchFilter;
              if (cellGroupCellFilter !== 'all') p.cellId = cellGroupCellFilter;
              if (cellGroupStartDate) p.startDate = cellGroupStartDate;
              if (cellGroupEndDate) p.endDate = cellGroupEndDate;
              response = await cellsService.getAll(p);
              break;
            }
            case 'Cell Visitors Report': {
              const p: any = { limit, page, export: true, groupByVisitor: true };
              if (visitorChurchFilter !== 'all') p.churchId = visitorChurchFilter;
              if (visitorCellFilter !== 'all') p.cellId = visitorCellFilter;
              if (visitorStartDate) p.startDate = visitorStartDate;
              if (visitorEndDate) p.endDate = visitorEndDate;
              response = await cellsService.getVisitors(p);
              break;
            }
            case 'Church Visitors Report': {
              const p: any = { limit, page, export: true, groupByVisitor: true };
              if (churchVisitorChurchFilter !== 'all') p.churchId = churchVisitorChurchFilter;
              if (churchVisitorServiceType !== 'all') p.serviceType = churchVisitorServiceType;
              if (churchVisitorStartDate) p.startDate = churchVisitorStartDate;
              if (churchVisitorEndDate) p.endDate = churchVisitorEndDate;
              response = await attendanceService.getServiceVisitors(p);
              break;
            }
            default:
              return;
          }

          // Extract pagination — response is either { data, pagination } or raw array
          const pagination =
            response?.pagination ??
            (response as any)?.pagination;

          if (pagination?.totalPages != null) {
            setBatchTotalPagesMap(prev => ({ ...prev, [title]: pagination.totalPages }));
          }
        })
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [
    batchSizeMap,
    memberChurchFilter, memberStatusFilter, memberCellFilter, memberTeamFilter,
    givingCategoryFilter, givingCampaignFilter, givingChurchFilter, givingCellFilter,
    givingStartDate, givingEndDate,
    givingByMemberChurchFilter, givingByMemberCategoryFilter, givingByMemberCampaignFilter,
    givingByMemberStartDate, givingByMemberEndDate,
    attendanceServiceFilter, attendanceChurchFilter, attendanceStartDate, attendanceEndDate,
    inactiveMemberChurchFilter,
    pledgeChurchFilter, pledgeStatusFilter, pledgeStartDate, pledgeEndDate,
    txChurchFilter, txTypeFilter, txStartDate, txEndDate,
    cellChurchFilter, cellGroupCellFilter, cellGroupStartDate, cellGroupEndDate,
    visitorChurchFilter, visitorCellFilter, visitorStartDate, visitorEndDate,
    churchVisitorChurchFilter, churchVisitorServiceType, churchVisitorStartDate, churchVisitorEndDate,
  ]);

  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => dashboardService.getStats(), enabled: !!user && hasReports });
  const { data: churches = [] } = useQuery({ queryKey: ['churches-select'], queryFn: () => churchesService.getSelectable(), enabled: hasReports });
  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns-select'], queryFn: () => givingService.getSelectableCampaigns(), enabled: hasReports });
  const { data: simpleCells = [] } = useQuery({ queryKey: ['cells-simple'], queryFn: () => cellsService.getSimple(), enabled: hasReports });
  const { data: teams = [] } = useQuery({ queryKey: ['teams-report', memberChurchFilter], queryFn: () => teamsService.getAll(memberChurchFilter !== 'all' ? memberChurchFilter : undefined), enabled: hasReports });
  const givingCells = useMemo(
    () => (simpleCells as any[]).filter((c: any) => givingChurchFilter === 'all' || c.churchId === givingChurchFilter),
    [simpleCells, givingChurchFilter],
  );
  const cellGroupCells = (simpleCells as any[]).filter((c: any) => cellChurchFilter === 'all' || c.churchId === cellChurchFilter);
  const visitorCells = (simpleCells as any[]).filter((c: any) => visitorChurchFilter === 'all' || c.churchId === visitorChurchFilter);

  // Flatten grouped campaigns if needed
  const flatCampaigns = useMemo(
    () => Array.isArray(campaigns) && (campaigns as any[])[0]?.label
      ? (campaigns as any[]).flatMap((group: any) => group.posts || [])
      : (campaigns as any[]),
    [campaigns],
  );
  const givingCampaignOptions = useMemo(
    () => (flatCampaigns as any[]).filter((campaign: any) => {
      const availableChurchIds = Array.isArray(campaign.availableChurchIds)
        ? campaign.availableChurchIds
        : [campaign.churchId].filter(Boolean);

      return (givingCategoryFilter === 'all' || campaign.category === givingCategoryFilter)
        && (givingChurchFilter === 'all' || availableChurchIds.includes(givingChurchFilter));
    }),
    [flatCampaigns, givingCategoryFilter, givingChurchFilter],
  );
  const givingByMemberCampaignOptions = useMemo(
    () => (flatCampaigns as any[]).filter((campaign: any) => {
      const availableChurchIds = Array.isArray(campaign.availableChurchIds)
        ? campaign.availableChurchIds
        : [campaign.churchId].filter(Boolean);

      return (givingByMemberCategoryFilter === 'all' || campaign.category === givingByMemberCategoryFilter)
        && (givingByMemberChurchFilter === 'all' || availableChurchIds.includes(givingByMemberChurchFilter));
    }),
    [flatCampaigns, givingByMemberCategoryFilter, givingByMemberChurchFilter],
  );
  const pledgeCampaignOptions = useMemo(
    () => (flatCampaigns as any[]).filter((campaign: any) => {
      const availableChurchIds = Array.isArray(campaign.availableChurchIds)
        ? campaign.availableChurchIds
        : [campaign.churchId].filter(Boolean);

      return (pledgeCategoryFilter === 'all' || campaign.category === pledgeCategoryFilter)
        && (pledgeChurchFilter === 'all' || availableChurchIds.includes(pledgeChurchFilter));
    }),
    [flatCampaigns, pledgeCategoryFilter, pledgeChurchFilter],
  );
  const shouldUseGivingCellFilter = givingCategoryFilter === 'fellowship_offering';
  const effectiveGivingCellFilter = shouldUseGivingCellFilter && givingCellFilter !== 'all'
    ? givingCellFilter
    : undefined;
  const { data: kpisData = [], isLoading: kl } = useQuery({ queryKey: ['kpis'], queryFn: () => kpiService.getAll(), enabled: hasReports });
  const kpis = kpisData as KPI[];

  useEffect(() => {
    if (!shouldUseGivingCellFilter && givingCellFilter !== 'all') {
      setGivingCellFilter('all');
    }
  }, [shouldUseGivingCellFilter, givingCellFilter]);

  useEffect(() => {
    if (!shouldUseGivingCellFilter || givingCellFilter === 'all') return;
    const selectedCellStillVisible = givingCells.some((cell: any) => cell.id === givingCellFilter);
    if (!selectedCellStillVisible) {
      setGivingCellFilter('all');
    }
  }, [shouldUseGivingCellFilter, givingCellFilter, givingCells]);

  useEffect(() => {
    if (givingCampaignFilter === 'all') return;
    const selectedCampaignStillVisible = givingCampaignOptions.some((campaign: any) => campaign.id === givingCampaignFilter);
    if (!selectedCampaignStillVisible) {
      setGivingCampaignFilter('all');
    }
  }, [givingCampaignFilter, givingCampaignOptions]);

  useEffect(() => {
    if (givingByMemberCampaignFilter === 'all') return;
    const selectedCampaignStillVisible = givingByMemberCampaignOptions.some((campaign: any) => campaign.id === givingByMemberCampaignFilter);
    if (!selectedCampaignStillVisible) {
      setGivingByMemberCampaignFilter('all');
    }
  }, [givingByMemberCampaignFilter, givingByMemberCampaignOptions]);

  useEffect(() => {
    if (pledgeCampaignFilter === 'all') return;
    const selectedCampaignStillVisible = pledgeCampaignOptions.some((campaign: any) => campaign.id === pledgeCampaignFilter);
    if (!selectedCampaignStillVisible) {
      setPledgeCampaignFilter('all');
    }
  }, [pledgeCampaignFilter, pledgeCampaignOptions]);

  const calculateMutation = useMutation({
    mutationFn: kpiService.calculate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('KPIs updated successfully');
    },
  });

  const deleteKpiMutation = useMutation({
    mutationFn: kpiService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('KPI deleted');
    },
  });

  const toggleRecurringMutation = useMutation({
    mutationFn: ({ id, recurringActive }: { id: string; recurringActive: boolean }) =>
      kpiService.update(id, { recurringActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('Recurring status updated');
    },
  });

  if (!hasReports) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and export comprehensive reports across all modules</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Reports & Analytics is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">
              Upgrade now
            </Link>{' '}
            to unlock advanced reporting features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasPermission('reports:read')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and export comprehensive reports across all modules</p>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You do not have permission to access Reports & Analytics.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isLoading = false;

  const handleExportMembers = async () => {
    const batchParams = getBatchParams('Membership Report');
    const response = await membersService.getAll({
      ...(memberChurchFilter !== 'all' ? { churchId: memberChurchFilter } : {}),
      ...(memberStatusFilter !== 'all' ? { status: memberStatusFilter } : {}),
      ...(memberCellFilter !== 'all' ? { cellId: memberCellFilter } : {}),
      ...(memberTeamFilter !== 'all' ? { teamId: memberTeamFilter } : {}),
      ...batchParams,
    });
    handleBatchResponse('Membership Report', response);
    const members: any[] = Array.isArray(response) ? response : (response as any)?.data ?? [];
    const memberRows = members.map(m => [
      m.firstName,
      m.lastName,
      m.email ?? '',
      m.phone ?? '',
      m.gender ?? '',
      m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString() : '',
      m.maritalStatus ?? '',
      m.weddingDate ? new Date(m.weddingDate).toLocaleDateString() : '',
      m.residentialNeighbourhood ?? '',
      m.serviceInterest ?? '',
      m.membershipType ?? '',
      m.baptizedByImmersion ? 'Yes' : 'No',
      m.church?.name ?? '',
      m.roleName ?? '',
      m.status,
      Array.isArray((m as any).cells) ? (m as any).cells.map((c: any) => c.name).join('; ') : '',
      Array.isArray(m.teams) ? m.teams.join('; ') : '',
      new Date(m.createdAt).toLocaleDateString()
    ]);
    if (memberRows.length > 0) {
      memberRows.push([
        'TOTAL MEMBERS',
        members.length.toString(),
        `Active: ${countTruthy(members, m => m.status === 'active')}`,
        `Inactive: ${countTruthy(members, m => m.status === 'inactive')}`,
        `Baptized: ${countTruthy(members, m => !!m.baptizedByImmersion)}`,
        ...blankColumns(13),
      ]);
    }
    await downloadReportWorkbook(
      'members-report.xlsx',
      memberRows,
      [
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Gender',
        'Date of Birth',
        'Marital Status',
        'Wedding Date',
        'Neighbourhood',
        'Service Interest',
        'Membership Type',
        'Baptized',
        'Church',
        'Role',
        'Status',
        'Cell',
        'Teams',
        'Joined'
      ],
    );
  };

  const handleExportGiving = async () => {
    const batchParams = getBatchParams('Giving Report');
    const response = await givingService.getDonations(
      givingCampaignFilter !== 'all' ? givingCampaignFilter : undefined,
      givingChurchFilter !== 'all' ? givingChurchFilter : undefined,
      {
        groupByPersonCampaign: true,
        category: givingCategoryFilter !== 'all' ? givingCategoryFilter : undefined,
        cellId: effectiveGivingCellFilter,
        startDate: givingStartDate || undefined,
        endDate: givingEndDate || undefined,
        ...batchParams,
      }
    );
    handleBatchResponse('Giving Report', response);
    const donations: any[] = Array.isArray(response) ? response : (response as any)?.data ?? [];
    const { rows, headers } = buildGivingCampaignMatrix(donations, { includeDonorType: true });
    
    await downloadReportWorkbook(
      'giving-report.xlsx',
      rows,
      headers,
    );
  };

  const handleExportAttendance = async () => {
    const batchParams = getBatchParams('Attendance Report');
    const params: any = { ...batchParams };
    if (attendanceServiceFilter !== 'all') params.serviceType = attendanceServiceFilter;
    if (attendanceChurchFilter !== 'all') params.churchId = attendanceChurchFilter;
    if (attendanceStartDate) params.startDate = attendanceStartDate;
    if (attendanceEndDate) params.endDate = attendanceEndDate;
    
    const response = await attendanceService.getAll(params);
    handleBatchResponse('Attendance & Service Report', response);
    const attendance: any[] = Array.isArray(response) ? response : (response as any)?.data ?? [];
    const attendanceTotals = {
      totalAttendees: 0,
      checkedInParticipants: 0,
      maleCount: 0,
      femaleCount: 0,
      children: 0,
      youth: 0,
      youngAdults: 0,
      adults: 0,
      seniors: 0,
      visitors: 0,
      firstTimeVisitors: 0,
      ministryMemberGuests: 0,
      newConverts: 0,
    };
    const attendanceRows = attendance.map(a => {
      const checkedInParticipants = (a as any).checkedInParticipants ?? (a as any)._count?.participants ?? 0;
      const visitors = (a as any).trueVisitors ?? (a as any).newVisitors ?? 0;
      const firstTimeVisitors = (a as any).firstTimeVisitors ?? 0;
      const ministryMemberGuests = (a as any).ministryMemberGuests ?? 0;
      const newConverts = (a as any).newConverts ?? 0;
      attendanceTotals.totalAttendees += toReportAmount(a.totalAttendees);
      attendanceTotals.checkedInParticipants += toReportAmount(checkedInParticipants);
      attendanceTotals.maleCount += toReportAmount((a as any).maleCount);
      attendanceTotals.femaleCount += toReportAmount((a as any).femaleCount);
      attendanceTotals.children += toReportAmount((a as any).children);
      attendanceTotals.youth += toReportAmount((a as any).youth);
      attendanceTotals.youngAdults += toReportAmount((a as any).youngAdults);
      attendanceTotals.adults += toReportAmount((a as any).adults);
      attendanceTotals.seniors += toReportAmount((a as any).seniors);
      attendanceTotals.visitors += toReportAmount(visitors);
      attendanceTotals.firstTimeVisitors += toReportAmount(firstTimeVisitors);
      attendanceTotals.ministryMemberGuests += toReportAmount(ministryMemberGuests);
      attendanceTotals.newConverts += toReportAmount(newConverts);
      return [
        new Date(a.date).toLocaleDateString(),
        (a as any).church?.name || '',
        a.serviceType,
        a.totalAttendees.toString(),
        checkedInParticipants.toString(),
        ((a as any).maleCount ?? 0).toString(),
        ((a as any).femaleCount ?? 0).toString(),
        ((a as any).children ?? 0).toString(),
        ((a as any).youth ?? 0).toString(),
        ((a as any).youngAdults ?? 0).toString(),
        ((a as any).adults ?? 0).toString(),
        ((a as any).seniors ?? 0).toString(),
        visitors.toString(),
        firstTimeVisitors.toString(),
        ministryMemberGuests.toString(),
        newConverts.toString(),
        (a as any).notes ?? ''
      ];
    });
    if (attendanceRows.length > 0) {
      attendanceRows.push([
        'TOTAL',
        '',
        '',
        formatReportAmount(attendanceTotals.totalAttendees),
        formatReportAmount(attendanceTotals.checkedInParticipants),
        formatReportAmount(attendanceTotals.maleCount),
        formatReportAmount(attendanceTotals.femaleCount),
        formatReportAmount(attendanceTotals.children),
        formatReportAmount(attendanceTotals.youth),
        formatReportAmount(attendanceTotals.youngAdults),
        formatReportAmount(attendanceTotals.adults),
        formatReportAmount(attendanceTotals.seniors),
        formatReportAmount(attendanceTotals.visitors),
        formatReportAmount(attendanceTotals.firstTimeVisitors),
        formatReportAmount(attendanceTotals.ministryMemberGuests),
        formatReportAmount(attendanceTotals.newConverts),
        '',
      ]);
    }
    await downloadReportWorkbook(
      'attendance-report.xlsx',
      attendanceRows,
      ['Date', 'Church', 'Service Type', 'Total', 'Checked-in Participants', 'Male', 'Female', 'Children', 'Youth', 'Young Adults', 'Adults', 'Seniors', 'Visitors', 'First Time Visitors', 'Ministry Member Guests', 'New Converts', 'Notes'],
    );
  };

  const handleExportKPIs = async () => {
    const kpiRows = (kpis as KPI[]).map(k => {
      const achievement = k.targetValue > 0 ? Math.round((k.currentValue / k.targetValue) * 100) : 0;
      return [
        k.name,
        k.description || '',
        k.category,
        k.metricType,
        k.attendanceType || 'N/A',
        k.targetValue.toString(),
        k.currentValue.toString(),
        `${achievement}%`,
        k.unit,
        k.period,
        new Date(k.startDate).toLocaleDateString(),
        new Date(k.endDate).toLocaleDateString(),
        k.isRecurring ? 'Yes' : 'No',
        k.recurringActive ? 'Active' : 'Paused',
        k.status,
        k.church?.name || 'All Churches',
      ];
    });
    if (kpiRows.length > 0) {
      const targetTotal = (kpis as KPI[]).reduce((sum, k) => sum + toReportAmount(k.targetValue), 0);
      const currentTotal = (kpis as KPI[]).reduce((sum, k) => sum + toReportAmount(k.currentValue), 0);
      const achievement = targetTotal > 0 ? Math.round((currentTotal / targetTotal) * 100) : 0;
      kpiRows.push([
        'TOTAL',
        '',
        '',
        '',
        '',
        formatReportAmount(targetTotal),
        formatReportAmount(currentTotal),
        `${achievement}%`,
        ...blankColumns(8),
      ]);
    }
    await downloadReportWorkbook(
      'kpi-report.xlsx',
      kpiRows,
      ['KPI Name', 'Description', 'Category', 'Metric Type', 'Attendance Type', 'Target', 'Current', 'Achievement', 'Unit', 'Period', 'Start Date', 'End Date', 'Recurring', 'Recurring Status', 'Status', 'Church'],
    );
  };

  // ── New report export handlers ─────────────────────────────────────────────

  const handleExportInactiveMembers = async () => {
    const batchParams = getBatchParams('Inactive Members Report');
    const response = await membersService.getAll({
      ...(inactiveMemberChurchFilter !== 'all' ? { churchId: inactiveMemberChurchFilter } : {}),
      status: 'inactive',
      ...batchParams,
    } as any);
    handleBatchResponse('Inactive Members Report', response);
    const members: any[] = Array.isArray(response) ? response : (response as any)?.data ?? [];
    const inactiveRows = members.map((m: any) => [
      m.firstName, m.lastName, m.email ?? '', m.phone ?? '',
      m.gender ?? '', m.membershipType ?? '',
      m.baptizedByImmersion ? 'Yes' : 'No',
      m.church?.name ?? '',
      Array.isArray(m.cells) ? m.cells.map((c: any) => c.name).join('; ') : '',
      m.residentialNeighbourhood ?? '',
      m.roleName ?? '', m.status, new Date(m.createdAt).toLocaleDateString(),
    ]);
    if (inactiveRows.length > 0) {
      inactiveRows.push([
        'TOTAL INACTIVE MEMBERS',
        members.length.toString(),
        `Baptized: ${countTruthy(members, m => !!m.baptizedByImmersion)}`,
        ...blankColumns(10),
      ]);
    }
    await downloadReportWorkbook(
      'inactive-members-report.xlsx',
      inactiveRows,
      ['First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Membership Type', 'Baptized', 'Church', 'Cell', 'Neighbourhood', 'Role', 'Status', 'Joined'],
    );
  };

  const handleExportPledges = async () => {
    const batchParams = getBatchParams('Pledge Report');
    const response = await givingService.getMinistryPledges({
      ...(pledgeChurchFilter !== 'all' ? { churchId: pledgeChurchFilter } : {}),
      ...(pledgeStatusFilter !== 'all' ? { status: pledgeStatusFilter } : {}),
      ...(pledgeCategoryFilter !== 'all' ? { category: pledgeCategoryFilter } : {}),
      ...(pledgeCampaignFilter !== 'all' ? { campaignId: pledgeCampaignFilter } : {}),
      ...(pledgeStartDate ? { startDate: pledgeStartDate } : {}),
      ...(pledgeEndDate ? { endDate: pledgeEndDate } : {}),
      groupByPersonCampaign: true,
      ...batchParams,
    });
    handleBatchResponse('Pledge Report', response);
    const pledges: any[] = (response as any)?.data ?? [];
    const { rows, headers } = buildPledgeCampaignMatrix(pledges);
    await downloadReportWorkbook(
      'pledges-report.xlsx',
      rows,
      headers,
    );
  };

  const handleExportTransactions = async () => {
    const batchParams = getBatchParams('Transaction Report');
    const params: any = { ...batchParams };
    if (txChurchFilter !== 'all') params.churchId = txChurchFilter;
    if (txTypeFilter !== 'all') params.type = txTypeFilter;
    if (txStartDate) params.startDate = txStartDate;
    if (txEndDate) params.endDate = txEndDate;
    const response = await transactionsService.exportAll(params);
    handleBatchResponse('Transaction Report', response);
    const transactions: any[] = (response as any)?.data ?? [];
    const transactionRows = transactions.map((t: any) => [
      t.user ? `${t.user.firstName} ${t.user.lastName}` : (t.guestName || 'Guest'),
      t.user?.email || t.guestEmail || '',
      t.amount.toString(),
      t.baseAmount?.toString() || '',
      t.currency,
      t.type,
      t.campaignName || '',
      t.campaignCategory || '',
      t.cellName || '',
      t.paymentMethod,
      t.status,
      t.gateway || '',
      t.church?.name || '',
      t.isManual ? 'Manual' : 'Online',
      t.reference || '',
      t.paidAt ? new Date(t.paidAt).toLocaleDateString() : '',
      new Date(t.createdAt).toLocaleDateString(),
    ]);
    if (transactionRows.length > 0) {
      transactionRows.push([
        'TOTAL',
        `${transactions.length} transactions`,
        summarizeAmountsByCurrency(transactions, t => t.currency, t => t.amount),
        summarizeAmountsByCurrency(transactions, t => t.currency, t => t.baseAmount ?? t.amount),
        ...blankColumns(13),
      ]);
    }
    await downloadReportWorkbook(
      'transactions-report.xlsx',
      transactionRows,
      ['Name', 'Email', 'Amount', 'Base Amount', 'Currency', 'Type', 'Campaign', 'Category', 'Cell', 'Method', 'Status', 'Gateway', 'Church', 'Entry', 'Reference', 'Paid At', 'Date'],
    );
  };

  const handleExportGivingByMember = async () => {
    const batchParams = getBatchParams('Giving by Member');
    const params: any = {
      groupByCampaign: true,
      category: givingByMemberCategoryFilter !== 'all' ? givingByMemberCategoryFilter : undefined,
      campaignId: givingByMemberCampaignFilter !== 'all' ? givingByMemberCampaignFilter : undefined,
      ...batchParams,
    };
    if (givingByMemberChurchFilter !== 'all') params.churchId = givingByMemberChurchFilter;
    if (givingByMemberStartDate) params.startDate = givingByMemberStartDate;
    if (givingByMemberEndDate) params.endDate = givingByMemberEndDate;
    const response = await transactionsService.getGivingByMember(params);
    handleBatchResponse('Giving by Member', response);
    const data = response?.data ?? [];
    const { rows, headers } = buildGivingCampaignMatrix(data || []);

    await downloadReportWorkbook(
      'giving-by-member-report.xlsx',
      rows,
      headers,
    );
  };

  const handleExportCellGroups = async () => {
    const batchParams = getBatchParams('Cell Groups Report');
    const params: any = { ...batchParams };
    if (cellChurchFilter !== 'all') params.churchId = cellChurchFilter;
    if (cellGroupCellFilter !== 'all') params.cellId = cellGroupCellFilter;
    if (cellGroupStartDate) params.startDate = cellGroupStartDate;
    if (cellGroupEndDate) params.endDate = cellGroupEndDate;
    const response = await cellsService.getAll(params);
    handleBatchResponse('Cell Groups Report', response);
    const cells: any[] = (response as any)?.data ?? [];
    const hasDates = !!(cellGroupStartDate || cellGroupEndDate);
    const cellRows = cells.map((c: any) => [
      c.name,
      c.zone || c.neighbourhood || '',
      c.church?.name || '',
      c.leaderName || '',
      c._count?.members?.toString() || '0',
      hasDates ? (c.meetingsInPeriod ?? 0).toString() : (c._count?.meetings ?? 0).toString(),
      (c.totalVisitors ?? 0).toString(),
      (c.totalOffering ?? 0).toString(),
      c.attendanceRate != null ? `${c.attendanceRate}%` : 'N/A',
      c.conversionRate != null ? `${c.conversionRate}%` : 'N/A',
      c.lastMeetingDate ? new Date(c.lastMeetingDate).toLocaleDateString() : 'Never',
      c.status,
      c.meetingDay || '',
      c.meetingTime || '',
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
    ]);
    if (cellRows.length > 0) {
      const memberTotal = cells.reduce((sum, c: any) => sum + toReportAmount(c._count?.members), 0);
      const meetingTotal = cells.reduce((sum, c: any) => sum + toReportAmount(hasDates ? c.meetingsInPeriod : c._count?.meetings), 0);
      const visitorTotal = cells.reduce((sum, c: any) => sum + toReportAmount(c.totalVisitors), 0);
      const offeringTotal = cells.reduce((sum, c: any) => sum + toReportAmount(c.totalOffering), 0);
      cellRows.push([
        'TOTAL',
        '',
        '',
        '',
        formatReportAmount(memberTotal),
        formatReportAmount(meetingTotal),
        formatReportAmount(visitorTotal),
        formatReportAmount(offeringTotal),
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ]);
    }
    await downloadReportWorkbook(
      'cell-groups-report.xlsx',
      cellRows,
      ['Cell Name', 'Location / Neighbourhood', 'Church', 'Leader', 'Active Members',
        hasDates ? 'Meetings (Period)' : 'Total Meetings',
        'Total Visitors', 'Total Offering', 'Attendance Rate', 'Conversion Rate',
        'Last Meeting', 'Status', 'Meeting Day', 'Meeting Time', 'Established'],
    );
  };

  const handleExportChurchVisitors = async () => {
    const batchParams = getBatchParams('Church Visitors Report');
    const response = await attendanceService.getServiceVisitors({
      groupByVisitor: true,
      ...(churchVisitorChurchFilter !== 'all' ? { churchId: churchVisitorChurchFilter } : {}),
      ...(churchVisitorServiceType !== 'all' ? { serviceType: churchVisitorServiceType } : {}),
      ...(churchVisitorStartDate ? { startDate: churchVisitorStartDate } : {}),
      ...(churchVisitorEndDate ? { endDate: churchVisitorEndDate } : {}),
      ...batchParams,
    });
    handleBatchResponse('Church Visitors Report', response);
    const visitors: any[] = Array.isArray(response) ? response : (response as any)?.data ?? [];
    const churchVisitorRows = visitors.map((v: any) => [
      v.name || '',
      v.phone || '',
      v.email || '',
      v.gender || '',
      v.ageBracket || '',
      v.residentialArea || '',
      v.howHeard || '',
      v.isFirstVisit ? 'Yes' : 'No',
      v.isReturnVisit ? 'Yes' : 'No',
      String(v.totalVisits ?? ''),
      v.firstVisitDate ? new Date(v.firstVisitDate).toLocaleDateString() : '',
      v.lastVisitDate ? new Date(v.lastVisitDate).toLocaleDateString() : '',
      v.isNewConvert ? 'Yes' : 'No',
      v.invitedBy || '',
      v.churchesVisited || '',
      v.serviceTypes || '',
      v.notes || '',
    ]);
    if (churchVisitorRows.length > 0) {
      churchVisitorRows.push([
        'TOTAL VISITORS',
        visitors.length.toString(),
        '',
        '',
        '',
        '',
        '',
        countTruthy(visitors, v => !!v.isFirstVisit).toString(),
        countTruthy(visitors, v => !!v.isReturnVisit).toString(),
        formatReportAmount(visitors.reduce((sum, v) => sum + toReportAmount(v.totalVisits), 0)),
        '',
        '',
        countTruthy(visitors, v => !!v.isNewConvert).toString(),
        ...blankColumns(4),
      ]);
    }
    await downloadReportWorkbook(
      'church-visitors-report.xlsx',
      churchVisitorRows,
      ['Name', 'Phone', 'Email', 'Gender', 'Age Bracket', 'Residential Area', 'How Heard', 'First Visit', 'Return Visit', 'Total Visits', 'First Visit Date', 'Last Visit Date', 'New Convert', 'Invited By', 'Churches Visited', 'Service Types', 'Notes'],
    );
  };

  const handleExportVisitors = async () => {
    const batchParams = getBatchParams('Cell Visitors Report');
    const response = await cellsService.getVisitors({
      groupByVisitor: true,
      ...(visitorChurchFilter !== 'all' ? { churchId: visitorChurchFilter } : {}),
      ...(visitorCellFilter !== 'all' ? { cellId: visitorCellFilter } : {}),
      ...(visitorStartDate ? { startDate: visitorStartDate } : {}),
      ...(visitorEndDate ? { endDate: visitorEndDate } : {}),
      ...batchParams,
    });
    handleBatchResponse('Cell Visitors Report', response);
    const visitors: any[] = (response as any)?.data ?? [];
    const visitorRows = visitors.map((v: any) => [
      v.visitorName || '',
      v.visitorPhone || '',
      v.visitorEmail || '',
      v.isFirstVisit ? 'Yes' : 'No',
      v.isReturnVisit ? 'Yes' : 'No',
      String(v.totalVisits ?? ''),
      v.firstVisitDate ? new Date(v.firstVisitDate).toLocaleDateString() : '',
      v.lastVisitDate ? new Date(v.lastVisitDate).toLocaleDateString() : '',
      v.isNewConvert ? 'Yes' : 'No',
      v.invitedBy || '',
      v.cellsVisited || '',
      v.zones || '',
      v.churchesVisited || '',
      v.meetingTopics || '',
      v.notes || '',
    ]);
    if (visitorRows.length > 0) {
      visitorRows.push([
        'TOTAL VISITORS',
        visitors.length.toString(),
        '',
        countTruthy(visitors, v => !!v.isFirstVisit).toString(),
        countTruthy(visitors, v => !!v.isReturnVisit).toString(),
        formatReportAmount(visitors.reduce((sum, v) => sum + toReportAmount(v.totalVisits), 0)),
        '',
        '',
        countTruthy(visitors, v => !!v.isNewConvert).toString(),
        ...blankColumns(6),
      ]);
    }
    await downloadReportWorkbook(
      'visitors-report.xlsx',
      visitorRows,
      ['Name', 'Phone', 'Email', 'First Visit', 'Return Visit', 'Total Visits', 'First Visit Date', 'Last Visit Date', 'New Convert', 'Invited By', 'Cells Visited', 'Zones', 'Churches Visited', 'Meeting Topics', 'Notes'],
    );
  };

  const reportCards = [
    {
      title: 'Membership Report',
      description: 'Complete list of all registered members — filter by status, cell, team, or church.',
      icon: Users,
      onExport: handleExportMembers,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={memberChurchFilter} onValueChange={v => { setMemberChurchFilter(v); setMemberCellFilter('all'); setMemberTeamFilter('all'); }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={memberStatusFilter} onValueChange={setMemberStatusFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Cell</Label>
            <Select value={memberCellFilter} onValueChange={setMemberCellFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Cells" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cells</SelectItem>
                {(simpleCells as any[])
                  .filter((c: any) => memberChurchFilter === 'all' || c.churchId === memberChurchFilter)
                  .map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Team</Label>
            <Select value={memberTeamFilter} onValueChange={setMemberTeamFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Teams" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {(teams as any[]).map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      title: 'Giving Report',
      description: 'Giving matrix by person, campaign, and total amount for stewardship review.',
      icon: HandCoins,
      onExport: handleExportGiving,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Category</Label>
            <Select value={givingCategoryFilter} onValueChange={setGivingCategoryFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="tithe">Tithe</SelectItem>
                <SelectItem value="offering">Offering</SelectItem>
                <SelectItem value="fellowship_offering">Cells/Fellowship Offering</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="welfare">Welfare</SelectItem>
                <SelectItem value="missions">Missions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Campaign</Label>
            <Select value={givingCampaignFilter} onValueChange={setGivingCampaignFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Campaigns" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {givingCampaignOptions.map((campaign: any) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                    {campaign.availableChurches?.length === 1 ? ` - ${campaign.availableChurches[0].name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={givingChurchFilter} onValueChange={setGivingChurchFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {givingCategoryFilter === 'fellowship_offering' && (
            <div>
              <Label className="text-xs">Filter by Cell</Label>
              <Select value={givingCellFilter} onValueChange={setGivingCellFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Cells" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cells</SelectItem>
                  {givingCells.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={givingStartDate} onChange={e => setGivingStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={givingEndDate} onChange={e => setGivingEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Giving by Member',
      description: 'Member giving matrix with campaign columns and overall totals.',
      icon: Handshake,
      onExport: handleExportGivingByMember,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={givingByMemberChurchFilter} onValueChange={setGivingByMemberChurchFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Category</Label>
            <Select value={givingByMemberCategoryFilter} onValueChange={setGivingByMemberCategoryFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="tithe">Tithe</SelectItem>
                <SelectItem value="offering">Offering</SelectItem>
                <SelectItem value="fellowship_offering">Cells/Fellowship Offering</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="welfare">Welfare</SelectItem>
                <SelectItem value="missions">Missions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Campaign</Label>
            <Select value={givingByMemberCampaignFilter} onValueChange={setGivingByMemberCampaignFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Campaigns" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {givingByMemberCampaignOptions.map((campaign: any) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                    {campaign.availableChurches?.length === 1 ? ` - ${campaign.availableChurches[0].name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="rounded-md border border-border/70 p-2 text-xs text-muted-foreground">
            Export shows one row per member, campaign amounts as columns, and totals on the right and bottom.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={givingByMemberStartDate} onChange={e => setGivingByMemberStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={givingByMemberEndDate} onChange={e => setGivingByMemberEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Pledge Report',
      description: 'Pledge matrix by person and campaign, including pledged, paid, and outstanding totals.',
      icon: Target,
      onExport: handleExportPledges,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Status</Label>
            <Select value={pledgeStatusFilter} onValueChange={setPledgeStatusFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={pledgeChurchFilter} onValueChange={setPledgeChurchFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Category</Label>
            <Select value={pledgeCategoryFilter} onValueChange={setPledgeCategoryFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="tithe">Tithe</SelectItem>
                <SelectItem value="offering">Offering</SelectItem>
                <SelectItem value="fellowship_offering">Cells/Fellowship Offering</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="welfare">Welfare</SelectItem>
                <SelectItem value="missions">Missions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Campaign</Label>
            <Select value={pledgeCampaignFilter} onValueChange={setPledgeCampaignFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Campaigns" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {pledgeCampaignOptions.map((campaign: any) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                    {campaign.availableChurches?.length === 1 ? ` - ${campaign.availableChurches[0].name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={pledgeStartDate} onChange={e => setPledgeStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={pledgeEndDate} onChange={e => setPledgeEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Attendance Report',
      description: 'Service attendance records with demographics, visitor counts, and bottom totals.',
      icon: ClipboardList,
      onExport: handleExportAttendance,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Service Type</Label>
            <Select value={attendanceServiceFilter} onValueChange={setAttendanceServiceFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Services" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="Sunday Service">Sunday Service</SelectItem>
                <SelectItem value="Midweek Service">Midweek Service</SelectItem>
                <SelectItem value="Communion Service">Communion Service</SelectItem>
                <SelectItem value="Prayer Meeting">Prayer Meeting</SelectItem>
                <SelectItem value="Youth Service">Youth Service</SelectItem>
                <SelectItem value="Special Service">Special Service</SelectItem>
                <SelectItem value="Event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={attendanceChurchFilter} onValueChange={setAttendanceChurchFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={attendanceStartDate} onChange={e => setAttendanceStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={attendanceEndDate} onChange={e => setAttendanceEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Cell Groups Report',
      description: 'Cell/fellowship summary with leaders, meetings, visitors, offerings, rates, and totals.',
      icon: Group,
      onExport: handleExportCellGroups,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={cellChurchFilter} onValueChange={v => { setCellChurchFilter(v); setCellGroupCellFilter('all'); }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Cell</Label>
            <Select value={cellGroupCellFilter} onValueChange={setCellGroupCellFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Cells" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cells</SelectItem>
                {cellGroupCells
                  .map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.zone ? ` — ${c.zone}` : ''}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Activity Date Range <span className="text-muted-foreground">(scopes meetings, attendance, visitors, conversion, and offering)</span></Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Input type="date" className="h-8 text-xs" value={cellGroupStartDate} onChange={e => setCellGroupStartDate(e.target.value)} placeholder="From" />
              <Input type="date" className="h-8 text-xs" value={cellGroupEndDate} onChange={e => setCellGroupEndDate(e.target.value)} placeholder="To" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Cell Visitors Report',
      description: 'Follow-up list of unique cell/fellowship guests with visit counts, first visit, return visit, inviter, and meeting context.',
      icon: UserCheck,
      onExport: handleExportVisitors,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={visitorChurchFilter} onValueChange={v => { setVisitorChurchFilter(v); setVisitorCellFilter('all'); }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Cell</Label>
            <Select value={visitorCellFilter} onValueChange={setVisitorCellFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Cells" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cells</SelectItem>
                {visitorCells.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}{c.zone ? ` — ${c.zone}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={visitorStartDate} onChange={e => setVisitorStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={visitorEndDate} onChange={e => setVisitorEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Church Visitors Report',
      description: 'Follow-up list of unique church service guests with contact details, first visit, return visit, inviter, and service context.',
      icon: UserCheck,
      onExport: handleExportChurchVisitors,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={churchVisitorChurchFilter} onValueChange={setChurchVisitorChurchFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Service Type</Label>
            <Select value={churchVisitorServiceType} onValueChange={setChurchVisitorServiceType}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Services" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="Sunday Service">Sunday Service</SelectItem>
                <SelectItem value="Midweek Service">Midweek Service</SelectItem>
                <SelectItem value="Communion Service">Communion Service</SelectItem>
                <SelectItem value="Prayer Meeting">Prayer Meeting</SelectItem>
                <SelectItem value="Youth Service">Youth Service</SelectItem>
                <SelectItem value="Special Event">Special Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={churchVisitorStartDate} onChange={e => setChurchVisitorStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={churchVisitorEndDate} onChange={e => setChurchVisitorEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Transactions Report',
      description: 'Financial transaction ledger with gateway, status, reference, and currency totals.',
      icon: CreditCard,
      onExport: handleExportTransactions,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Type</Label>
            <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="donation">Giving</SelectItem>
                <SelectItem value="event_ticket">Event Ticket</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={txChurchFilter} onValueChange={setTxChurchFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={txStartDate} onChange={e => setTxStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={txEndDate} onChange={e => setTxEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold">Reports</h1>
        <p className="text-xs text-muted-foreground">Generate and export comprehensive reports across all modules</p>
      </div>

      {/* Summary banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Members', value: stats.totalMembers, icon: Users },
            { label: 'Total Giving', value: `${(stats as any).currency ?? 'MWK'} ${Number(stats.totalDonations).toLocaleString()}`, icon: HandCoins },
            { label: 'Avg. Attendance', value: stats.averageAttendance, icon: ClipboardList },
            { label: 'First Time Visitors', value: (stats as any).totalFirstTimeVisitors ?? 0, icon: UserPlus },
            { label: 'Upcoming Events', value: stats.upcomingEvents ?? 0, icon: Calendar },
          ].map(item => {
            const Icon = item.icon;
            return (
              <Card key={item.label}>
                <CardContent className="p-3 flex items-center gap-2">
                  <div className="p-1.5 bg-accent/10 rounded-md shrink-0">
                    <Icon className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                    <p className="text-base font-bold font-heading truncate">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* KPI Section */}
      <Card>
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="p-2 bg-accent/10 rounded-md shrink-0">
            <Target className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">KPI Targets</CardTitle>
            <p className="text-xs text-muted-foreground">Track performance against your goals</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => calculateMutation.mutate()}
                disabled={calculateMutation.isPending}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${calculateMutation.isPending ? 'animate-spin' : ''}`} />
                Update
              </Button>
              {hasPermission('reports:create') && (
                <Dialog open={kpiDialogOpen} onOpenChange={setKpiDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> New KPI
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm sm:max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create KPI Target</DialogTitle>
                    </DialogHeader>
                    <KPIForm onClose={() => setKpiDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}
              {hasPermission('reports:update') && (
                <Dialog open={!!editingKpi} onOpenChange={(open) => !open && setEditingKpi(null)}>
                  <DialogContent className="max-w-sm sm:max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit KPI Target</DialogTitle>
                    </DialogHeader>
                    <KPIForm kpi={editingKpi!} onClose={() => setEditingKpi(null)} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
        </div>
        <CardContent>
          {kl ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : kpis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No KPIs yet. Create your first target to track performance.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(kpis as KPI[]).map(kpi => {
                const achievement = kpi.targetValue > 0 ? (kpi.currentValue / kpi.targetValue) * 100 : 0;
                const status = achievement >= 100 ? 'achieved' : achievement >= 75 ? 'on-track' : achievement >= 50 ? 'at-risk' : 'behind';
                const statusColors = {
                  achieved: 'text-green-600',
                  'on-track': 'text-blue-600',
                  'at-risk': 'text-amber-600',
                  behind: 'text-red-600',
                };
                return (
                  <div key={kpi.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{kpi.name}</h4>
                          <span className="text-xs px-2 py-0.5 bg-muted rounded">{kpi.category}</span>
                          {kpi.status === 'completed' && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">Completed</span>
                          )}
                          {kpi.isRecurring && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              🔄 Recurring ({kpi.period})
                            </span>
                          )}
                        </div>
                        {kpi.description && <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <span>{kpi.period}</span>
                          <span>{new Date(kpi.startDate).toLocaleDateString()} - {new Date(kpi.endDate).toLocaleDateString()}</span>
                          {kpi.church && <span>{kpi.church.name}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {kpi.isRecurring && kpi.status === 'active' && hasPermission('reports:update') && (
                          <button
                            onClick={() => toggleRecurringMutation.mutate({ id: kpi.id, recurringActive: !kpi.recurringActive })}
                            className="text-xs text-muted-foreground hover:text-accent"
                            title={kpi.recurringActive ? 'Stop Recurring' : 'Resume Recurring'}
                          >
                            {kpi.recurringActive ? <StopCircle className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        {kpi.status !== 'completed' && hasPermission('reports:update') && (
                          <button
                            onClick={() => setEditingKpi(kpi)}
                            className="text-xs text-muted-foreground hover:text-accent"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {hasPermission('reports:delete') && (
                          <button
                            onClick={() => setDeleteKpi(kpi)}
                            className="text-xs text-muted-foreground hover:text-destructive"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {kpi.currentValue.toLocaleString()} / {kpi.targetValue.toLocaleString()} {kpi.unit}
                        </span>
                        <span className={`font-semibold ${statusColors[status]}`}>
                          {Math.round(achievement)}%
                        </span>
                      </div>
                      <Progress value={Math.min(achievement, 100)} className="h-2" />
                    </div>
                  </div>
                );
              })}
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2"
                onClick={handleExportKPIs}
                disabled={kpis.length === 0}
              >
                <Download className="h-3.5 w-3.5" /> Export KPI Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete KPI Dialog */}
      <AlertDialog open={!!deleteKpi} onOpenChange={() => setDeleteKpi(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete KPI</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteKpi?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteKpi) {
                  deleteKpiMutation.mutate(deleteKpi.id);
                  setDeleteKpi(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {reportCards.map(card => {
              const Icon = card.icon;
              const bSize = batchSizeMap[card.title] ?? 0;
              const bPage = batchPageMap[card.title] ?? 1;
              const bTotalPages = batchTotalPagesMap[card.title] ?? 0;
              const setBSize = (v: number) => { setBatchSizeMap(p => ({ ...p, [card.title]: v })); setBatchPageMap(p => ({ ...p, [card.title]: 1 })); };
              const setBPage = (v: number) => setBatchPageMap(p => ({ ...p, [card.title]: Math.max(1, v) }));
              const fromRow = bSize > 0 ? (bPage - 1) * bSize + 1 : 0;
              const toRow = bSize > 0 ? bPage * bSize : 0;
              return (
                <Card key={card.title}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-md">
                        <Icon className="h-4 w-4 text-accent" />
                      </div>
                      <CardTitle className="text-sm">{card.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                    {(card as any).filterComponent}
                    <div className="flex items-center gap-1.5 pt-1 border-t">
                      <Select value={String(bSize)} onValueChange={v => setBSize(Number(v))}>
                        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All records</SelectItem>
                          <SelectItem value="500">Batch: 500 rows</SelectItem>
                          <SelectItem value="1000">Batch: 1,000 rows</SelectItem>
                          <SelectItem value="2000">Batch: 2,000 rows</SelectItem>
                          <SelectItem value="5000">Batch: 5,000 rows</SelectItem>
                        </SelectContent>
                      </Select>
                      {bSize > 0 && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7 p-0" disabled={bPage <= 1} onClick={() => setBPage(bPage - 1)}>
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-medium px-0.5 text-muted-foreground">
                            P{bPage}{bTotalPages > 0 ? ` of ${bTotalPages}` : ''}
                          </span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 p-0" disabled={bTotalPages > 0 && bPage >= bTotalPages} onClick={() => setBPage(bPage + 1)}>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={card.onExport}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {bSize > 0
                        ? `Export Batch ${bPage} (rows ${fromRow.toLocaleString()}-${toRow.toLocaleString()})${bTotalPages > 0 ? ` · P${bPage} of ${bTotalPages}` : ''}`
                        : 'Export CSV'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
function KPIForm({ kpi, onClose }: { kpi?: KPI | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: churches = [] } = useQuery({ queryKey: ['churches'], queryFn: churchesService.getAll });
  const [name, setName] = useState(kpi?.name || '');
  const [description, setDescription] = useState(kpi?.description || '');
  const [category, setCategory] = useState(kpi?.category || 'Attendance');
  const [metricType, setMetricType] = useState(kpi?.metricType || 'total_attendance');
  const [attendanceType, setAttendanceType] = useState(kpi?.attendanceType || 'regular');
  const [eventId, setEventId] = useState(kpi?.eventId || '');
  const [isRecurring, setIsRecurring] = useState(kpi?.isRecurring || false);
  const [targetValue, setTargetValue] = useState(kpi?.targetValue?.toString() || '');
  const [period, setPeriod] = useState(kpi?.period || 'monthly');
  const [startDate, setStartDate] = useState(kpi?.startDate?.split('T')[0] || '');
  const [endDate, setEndDate] = useState(kpi?.endDate?.split('T')[0] || '');
  const [churchId, setChurchId] = useState(kpi?.churchId || user?.churchId || '');

  // Auto-fill end date when recurring is enabled and start date changes
  useEffect(() => {
    if (isRecurring && startDate) {
      const start = new Date(startDate);
      let end = new Date(start);
      
      if (period === 'monthly') {
        end.setMonth(end.getMonth() + 1);
        end.setDate(end.getDate() - 1); // One day before next month
      } else if (period === 'quarterly') {
        end.setMonth(end.getMonth() + 3);
        end.setDate(end.getDate() - 1); // One day before next quarter
      } else if (period === 'yearly') {
        end.setFullYear(end.getFullYear() + 1);
        end.setDate(end.getDate() - 1); // One day before next year
      }
      
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [isRecurring, period, startDate]);

  // Reset to regular attendance when recurring is enabled
  useEffect(() => {
    if (isRecurring && attendanceType === 'event') {
      setAttendanceType('regular');
      setEventId('');
    }
  }, [isRecurring]);

  // Fetch all accessible events for dropdown — lightweight simple mode
  const { data: events = [] } = useQuery({
    queryKey: ['events-simple'],
    queryFn: () => eventsService.getSimple(),
    enabled: category === 'Attendance' && attendanceType === 'event',
  });

  const metricOptions: Record<string, { value: string; label: string; unit: string }[]> = {
    Attendance: [
      { value: 'total_attendance', label: 'Total Attendance', unit: 'people' },
      { value: 'average_attendance', label: 'Average Attendance', unit: 'people' },
    ],
    Giving: [
      { value: 'total_giving', label: 'Total Giving', unit: 'MWK' },
    ],
    Membership: [
      { value: 'new_members', label: 'New Members', unit: 'people' },
    ],
    Events: [
      { value: 'event_count', label: 'Event Count', unit: 'events' },
    ],
  };

  const currentMetrics = metricOptions[category] || [];
  const currentUnit = currentMetrics.find(m => m.value === metricType)?.unit || 'people';

  const createMutation = useMutation({
    mutationFn: (data: CreateKPIData) => kpiService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('KPI created successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create KPI');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateKPIData) => kpiService.update(kpi!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('KPI updated successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update KPI');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      name,
      description: description || undefined,
      category,
      metricType,
      targetValue: parseFloat(targetValue),
      unit: currentUnit,
      period,
      startDate,
      endDate,
      churchId,
      isRecurring,
    };
    
    // Add attendance-specific fields
    if (category === 'Attendance') {
      data.attendanceType = attendanceType;
      if (attendanceType === 'event' && eventId) {
        data.eventId = eventId;
      }
    }
    
    if (kpi) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div>
        <Label className="text-xs sm:text-sm">Church <span className="text-destructive">*</span></Label>
        <Select value={churchId} onValueChange={setChurchId} required>
          <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue placeholder="Select a church" /></SelectTrigger>
          <SelectContent>
            {(churches as any[]).map(church => (
              <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs sm:text-sm">KPI Name</Label>
        <Input className="h-8 text-xs sm:h-10 sm:text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Q1 Attendance Goal" required />
      </div>
      <div>
        <Label className="text-xs sm:text-sm">Description (Optional)</Label>
        <Textarea className="text-xs sm:text-sm" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this KPI" rows={2} />
      </div>
      <div className="flex items-center justify-between p-2 sm:p-3 border rounded-md">
        <div>
          <Label className="text-xs sm:text-sm font-medium">Recurring KPI</Label>
          <p className="text-xs text-muted-foreground">Auto-create this KPI for next period</p>
        </div>
        <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
      </div>
      {isRecurring && (
        <>
          <div>
            <Label className="text-xs sm:text-sm">Period <span className="text-destructive">*</span></Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-0.5">Dates will auto-fill for current {period} period</p>
          </div>
          <Alert className="border-green-200 bg-green-50 py-2">
            <p className="text-xs text-green-800">Select your start date and end date will auto-calculate based on the period.</p>
          </Alert>
        </>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label className="text-xs sm:text-sm">Category</Label>
          <Select value={category} onValueChange={(v) => { setCategory(v); setMetricType(metricOptions[v][0].value); }}>
            <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Attendance">Attendance</SelectItem>
              <SelectItem value="Giving">Giving</SelectItem>
              <SelectItem value="Membership">Membership</SelectItem>
              <SelectItem value="Events">Events</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs sm:text-sm">Metric Type</Label>
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {currentMetrics.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {category === 'Attendance' && !isRecurring && (
        <>
          <div>
            <Label className="text-xs sm:text-sm">Attendance Type</Label>
            <Select value={attendanceType} onValueChange={setAttendanceType}>
              <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Service</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {attendanceType === 'event' && (
            <div>
              <Label className="text-xs sm:text-sm">Select Event (Optional)</Label>
              <Select value={eventId || 'all'} onValueChange={(v) => setEventId(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue placeholder="All Events" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {(events as any[]).map(event => (
                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-0.5">Leave empty to track all event attendance</p>
            </div>
          )}
        </>
      )}
      <div>
        <Label className="text-xs sm:text-sm">Target Value</Label>
        <Input className="h-8 text-xs sm:h-10 sm:text-sm" type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="1000" required />
        <p className="text-xs text-muted-foreground mt-0.5">Unit: {currentUnit}</p>
      </div>
      {!isRecurring && (
        <div>
          <Label className="text-xs sm:text-sm">Period</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label className="text-xs sm:text-sm">Start Date</Label>
          <Input className="h-8 text-xs sm:h-10 sm:text-sm" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          {isRecurring && <p className="text-xs text-muted-foreground mt-0.5">Choose your period start</p>}
        </div>
        <div>
          <Label className="text-xs sm:text-sm">End Date</Label>
          <Input className="h-8 text-xs sm:h-10 sm:text-sm" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required disabled={isRecurring} />
          {isRecurring && <p className="text-xs text-muted-foreground mt-0.5">Auto-calculated</p>}
        </div>
      </div>
      <div className="flex gap-2 pt-1 sm:pt-2">
        <Button type="button" size="sm" variant="outline" onClick={onClose} className="flex-1 sm:h-10 sm:text-sm">Cancel</Button>
        <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 sm:h-10 sm:text-sm">
          {kpi ? (updateMutation.isPending ? 'Updating...' : 'Update KPI') : (createMutation.isPending ? 'Creating...' : 'Create KPI')}
        </Button>
      </div>
    </form>
  );
}
