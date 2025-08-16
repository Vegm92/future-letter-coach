import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Archive,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/shared/config/client";
import { useToast } from "@/shared/hooks/use-toast";
import { DashboardProps } from "@/shared/types";
import type { Letter, Milestone } from "@/shared/types";

interface DashboardStats {
  total: number;
  scheduled: number;
  completed: number;
  overallProgress: number;
}

interface LetterWithMilestones extends Letter {
  milestones?: Milestone[];
}

const Dashboard = ({
  onCreateClick,
  onViewAllLetters,
  onViewLetter,
}: DashboardProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    scheduled: 0,
    completed: 0,
    overallProgress: 0,
  });
  const [recentLetters, setRecentLetters] = useState<LetterWithMilestones[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: lettersData, error: lettersError } = await supabase
        .from("letters")
        .select(
          `
          *,
          milestones (
            id,
            title,
            percentage,
            completed,
            target_date
          )
        `
        )
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (lettersError) throw lettersError;

      // Properly type the data from Supabase
      const typedLetters = (lettersData || []).map((letter) => ({
        ...letter,
        status: letter.status as Letter["status"],
        milestones: letter.milestones || [],
      })) as LetterWithMilestones[];

      setRecentLetters(typedLetters);

      // Calculate stats
      const total = lettersData?.length || 0;
      const scheduled =
        lettersData?.filter((l) => l.status === "scheduled").length || 0;
      const completed =
        lettersData?.filter((l) => l.status === "sent").length || 0;

      // Calculate overall progress across all letters
      let totalMilestones = 0;
      let completedMilestones = 0;

      lettersData?.forEach((letter) => {
        if (letter.milestones) {
          totalMilestones += letter.milestones.length;
          completedMilestones += letter.milestones.filter(
            (m: Milestone) => m.completed
          ).length;
        }
      });

      const overallProgress =
        totalMilestones > 0
          ? Math.round((completedMilestones / totalMilestones) * 100)
          : 0;

      setStats({ total, scheduled, completed, overallProgress });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Failed to load dashboard",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track your progress and manage your future letters
        </p>
      </div>

      {/* Compact Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-card border rounded-md p-3 hover-scale">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Total
              </p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
            <Archive className="h-3.5 w-3.5 text-primary opacity-50" />
          </div>
        </div>

        <div className="bg-card border rounded-md p-3 hover-scale">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Scheduled
              </p>
              <p className="text-lg font-bold">{stats.scheduled}</p>
            </div>
            <Clock className="h-3.5 w-3.5 text-warning opacity-50" />
          </div>
        </div>

        <div className="bg-card border rounded-md p-3 hover-scale">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Delivered
              </p>
              <p className="text-lg font-bold">{stats.completed}</p>
            </div>
            <CheckCircle className="h-3.5 w-3.5 text-success opacity-50" />
          </div>
        </div>

        <div className="bg-card border rounded-md p-3 hover-scale">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Progress
              </p>
              <p className="text-lg font-bold">{stats.overallProgress}%</p>
            </div>
            <TrendingUp className="h-3.5 w-3.5 text-primary opacity-50" />
          </div>
          {stats.overallProgress > 0 && (
            <Progress value={stats.overallProgress} className="mt-1.5 h-1" />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onCreateClick}>
          <CardContent className="p-6 text-center space-y-2">
            <Plus className="h-8 w-8 text-primary mx-auto group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold">Write New Letter</h3>
            <p className="text-sm text-muted-foreground">
              Create a new letter to your future self
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onViewAllLetters}>
          <CardContent className="p-6 text-center space-y-2">
            <Archive className="h-8 w-8 text-primary mx-auto group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold">View All Letters</h3>
            <p className="text-sm text-muted-foreground">
              Browse and manage your letter collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Letters */}
      {recentLetters.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Letters</h2>
            <Button variant="ghost" size="sm" onClick={onViewAllLetters}>
              View all
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {recentLetters.map((letter) => (
              <Card
                key={letter.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onViewLetter?.(letter)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base line-clamp-1">
                    {letter.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {letter.ai_enhanced_goal || letter.goal}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {letter.milestones?.length || 0} milestones
                    </span>
                    <span className="text-primary font-medium">
                      {letter.milestones
                        ? Math.round(
                            (letter.milestones.filter((m) => m.completed).length /
                              letter.milestones.length) *
                              100
                          )
                        : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
