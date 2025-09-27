"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, Home, Users } from "lucide-react"

export function ModelInsights() {
  const insights = [
    {
      icon: <Home className="h-5 w-5" />,
      title: "Home Advantage",
      description: "Teams playing at home have a 15-20% higher win rate",
      impact: "High",
      color: "bg-green-500",
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Shots on Target",
      description: "Teams with 6+ shots on target win 65% of matches",
      impact: "High",
      color: "bg-blue-500",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Possession Control",
      description: "55%+ possession correlates with better outcomes",
      impact: "Medium",
      color: "bg-yellow-500",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Team Strength",
      description: "Historical performance is the strongest predictor",
      impact: "Very High",
      color: "bg-purple-500",
    },
  ]

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Model Insights</CardTitle>
        <CardDescription>Key factors that influence match predictions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
              <div className={`p-2 rounded-full ${insight.color} text-white`}>{insight.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{insight.title}</h4>
                  <Badge variant={insight.impact === "Very High" ? "default" : "secondary"}>{insight.impact}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h4 className="font-semibold mb-2">Model Performance</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">78%</div>
              <div className="text-sm text-muted-foreground">Overall Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">82%</div>
              <div className="text-sm text-muted-foreground">Win Prediction</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">71%</div>
              <div className="text-sm text-muted-foreground">Draw Prediction</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
