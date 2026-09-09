import Link from 'next/link';
export const dynamic = 'force-dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Handshake,
  Users,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  Plus,
  Settings,
} from 'lucide-react';
import { getSponsorPipeline, getSponsorshipStats } from '@/modules/sponsorships';
import { SponsorPipeline } from '@/modules/sponsorships/components/sponsor-pipeline';

/**
 * Sponsorships page - Kanban pipeline view.
 */
export default async function SponsorshipsPage() {
  let columns = [];
  let stats = {
    totalSponsors: 0,
    activeAmount: 0,
    confirmedCount: 0,
    activeCount: 0,
  };

  try {
    [columns, stats] = await Promise.all([
      getSponsorPipeline(),
      getSponsorshipStats(),
    ]);
  } catch (error) {
    console.error('Error fetching sponsorship data:', error);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statsCards = [
    {
      title: 'Total Sponsors',
      value: stats.totalSponsors.toLocaleString(),
      icon: Users,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      subtitle: 'In pipeline',
    },
    {
      title: 'Active Revenue',
      value: formatCurrency(stats.activeAmount),
      icon: DollarSign,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      subtitle: 'Active sponsorships',
    },
    {
      title: 'Confirmed',
      value: stats.confirmedCount.toString(),
      icon: CheckCircle2,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      subtitle: 'Awaiting start',
    },
    {
      title: 'Active',
      value: stats.activeCount.toString(),
      icon: TrendingUp,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      subtitle: 'Current sponsors',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="px-6 py-6 max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Handshake className="h-6 w-6 text-primary-600" />
              <h1 className="text-2xl font-semibold text-neutral-900">
                Sponsorships
              </h1>
            </div>
            <p className="text-neutral-500 text-sm mt-1">
              Track and manage sponsor relationships through the pipeline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="shadow-sm">
              <Link href="/settings/sponsorships">
                <Settings className="h-4 w-4 mr-2" />
                Manage Tiers
              </Link>
            </Button>
            <Button asChild className="bg-primary-600 hover:bg-primary-700 shadow-sm">
              <Link href="/contacts">
                <Plus className="h-4 w-4 mr-2" />
                Add Sponsor
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="shadow-sm border-neutral-200/60 bg-white"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-semibold tracking-tight text-neutral-900">
                        {stat.value}
                      </p>
                      <p className="text-xs text-neutral-400">{stat.subtitle}</p>
                    </div>
                    <div
                      className={`h-10 w-10 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Kanban Pipeline */}
        <SponsorPipeline columns={columns} />
      </div>
    </div>
  );
}
