"use client"

import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchAndAnalyzeData } from "@/lib/data-service"

type AnalyticsData = {
  resultDistribution: Array<{ name: string; value: number; color: string }>
  teamPerformance: Array<{ team: string; wins: number; draws: number; losses: number }>
  homeAwayStats: Array<{ name: string; home: number; away: number }>
  formationSuccess: Array<{ formation: string; winRate: number; matches: number }>
}

export function DataAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const analyticsData = await fetchAndAnalyzeData()
        setData(analyticsData)
      } catch (error) {
        console.error("Error loading analytics data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        <span className="ml-2 text-slate-500">Loading match data...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center p-8 border rounded-lg bg-slate-50 dark:bg-slate-800">
        <p className="text-slate-500">Failed to load analytics data</p>
      </div>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Match Data Analytics</CardTitle>
        <CardDescription>Insights from historical match data</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="results">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="venues">Home/Away</TabsTrigger>
            <TabsTrigger value="formations">Formations</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.resultDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.resultDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} matches`, "Count"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="teams" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.teamPerformance.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="team" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="wins" stackId="a" fill="#22c55e" />
                <Bar dataKey="draws" stackId="a" fill="#eab308" />
                <Bar dataKey="losses" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="venues" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.homeAwayStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="home" fill="#3b82f6" />
                <Bar dataKey="away" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="formations" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.formationSuccess} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formation" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="winRate" fill="#8884d8" name="Win Rate %" />
                <Bar yAxisId="right" dataKey="matches" fill="#82ca9d" name="Matches Played" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
