"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { predictMatch } from "@/lib/prediction"

const formSchema = z.object({
  team: z.string().min(1, "Team name is required"),
  opponent: z.string().min(1, "Opponent name is required"),
  venue: z.enum(["Home", "Away", "Neutral"]),
  formation: z.string().min(1, "Formation is required"),
  poss: z.coerce.number().min(0).max(100),
  sh: z.coerce.number().min(0),
  sot: z.coerce.number().min(0),
})

export default function PredictionForm() {
  const [prediction, setPrediction] = useState<{ result: string; confidence: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      team: "",
      opponent: "",
      venue: "Home",
      formation: "4-3-3",
      poss: 50,
      sh: 10,
      sot: 4,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    try {
      const result = await predictMatch(values)
      setPrediction(result)
    } catch (error) {
      console.error("Prediction error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Predict Match Outcome</CardTitle>
        <CardDescription>Enter the match details to get a prediction</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="team"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team</FormLabel>
                  <FormControl>
                    <Input placeholder="Your team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="opponent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opponent</FormLabel>
                  <FormControl>
                    <Input placeholder="Opponent team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select venue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Home">Home</SelectItem>
                      <SelectItem value="Away">Away</SelectItem>
                      <SelectItem value="Neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="formation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formation</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select formation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="4-3-3">4-3-3</SelectItem>
                      <SelectItem value="4-4-2">4-4-2</SelectItem>
                      <SelectItem value="3-5-2">3-5-2</SelectItem>
                      <SelectItem value="3-4-3">3-4-3</SelectItem>
                      <SelectItem value="5-3-2">5-3-2</SelectItem>
                      <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="poss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Possession %</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shots</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shots on Target</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Predicting...
                </>
              ) : (
                "Predict Result"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      {prediction && (
        <CardFooter>
          <Alert className="w-full">
            <AlertTitle className="flex items-center justify-between">
              Predicted Result:
              <Badge
                className={
                  prediction.result === "W"
                    ? "bg-green-500"
                    : prediction.result === "D"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }
              >
                {prediction.result === "W" ? "Win" : prediction.result === "D" ? "Draw" : "Loss"}
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
              Confidence: {(prediction.confidence * 100).toFixed(1)}%
            </AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  )
}
