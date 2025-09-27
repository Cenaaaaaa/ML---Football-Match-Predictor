"use server"

import Papa from "papaparse"

type MatchData = {
  date: string
  time: string
  comp: string
  round: string
  day: string
  venue: string
  result: string
  gf: string
  ga: string
  opponent: string
  xg: string
  xga: string
  poss: number
  attendance: string
  captain: string
  formation: string
  referee: string
  "match report": string
  notes: null
  sh: number
  sot: number
  dist: string
  fk: number
  pk: number
  pkatt: number
  season: string
  team: string
}

export async function fetchAndAnalyzeData() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/matches-GJ9G0e8J352Sm03vTkuDWtFPkS4gfk.csv",
    )
    const csvText = await response.text()

    const { data } = Papa.parse<MatchData>(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    })

    // Filter out rows with missing critical data
    const validMatches = data.filter((match) => match.result && match.team && match.opponent && match.venue)

    // Result distribution
    const resultCounts = validMatches.reduce(
      (acc, match) => {
        const result = match.result
        if (result === "W") acc.wins++
        else if (result === "D") acc.draws++
        else if (result === "L") acc.losses++
        return acc
      },
      { wins: 0, draws: 0, losses: 0 },
    )

    const resultDistribution = [
      { name: "Wins", value: resultCounts.wins, color: "#22c55e" },
      { name: "Draws", value: resultCounts.draws, color: "#eab308" },
      { name: "Losses", value: resultCounts.losses, color: "#ef4444" },
    ]

    // Team performance
    const teamStats = validMatches.reduce(
      (acc, match) => {
        const team = match.team as string

        if (!acc[team]) {
          acc[team] = { wins: 0, draws: 0, losses: 0 }
        }

        if (match.result === "W") acc[team].wins++
        else if (match.result === "D") acc[team].draws++
        else if (match.result === "L") acc[team].losses++

        return acc
      },
      {} as Record<string, { wins: number; draws: number; losses: number }>,
    )

    const teamPerformance = Object.entries(teamStats)
      .map(([team, stats]) => ({
        team,
        ...stats,
        total: stats.wins + stats.draws + stats.losses,
      }))
      .sort((a, b) => b.total - a.total)

    // Home vs Away stats
    const venueStats = validMatches.reduce(
      (acc, match) => {
        const venue = match.venue as string
        const result = match.result as string

        if (venue === "Home") {
          if (result === "W") acc.homeWins++
          else if (result === "D") acc.homeDraws++
          else if (result === "L") acc.homeLosses++
        } else if (venue === "Away") {
          if (result === "W") acc.awayWins++
          else if (result === "D") acc.awayDraws++
          else if (result === "L") acc.awayLosses++
        }

        return acc
      },
      {
        homeWins: 0,
        homeDraws: 0,
        homeLosses: 0,
        awayWins: 0,
        awayDraws: 0,
        awayLosses: 0,
      },
    )

    const homeAwayStats = [
      { name: "Wins", home: venueStats.homeWins, away: venueStats.awayWins },
      { name: "Draws", home: venueStats.homeDraws, away: venueStats.awayDraws },
      { name: "Losses", home: venueStats.homeLosses, away: venueStats.awayLosses },
    ]

    // Formation success rates
    const formationStats = validMatches.reduce(
      (acc, match) => {
        const formation = match.formation as string
        if (!formation) return acc

        if (!acc[formation]) {
          acc[formation] = { wins: 0, total: 0 }
        }

        if (match.result === "W") acc[formation].wins++
        acc[formation].total++

        return acc
      },
      {} as Record<string, { wins: number; total: number }>,
    )

    const formationSuccess = Object.entries(formationStats)
      .filter(([_, stats]) => stats.total >= 5) // Only include formations with enough matches
      .map(([formation, stats]) => ({
        formation,
        winRate: Math.round((stats.wins / stats.total) * 100),
        matches: stats.total,
      }))
      .sort((a, b) => b.winRate - a.winRate)

    return {
      resultDistribution,
      teamPerformance,
      homeAwayStats,
      formationSuccess,
    }
  } catch (error) {
    console.error("Error fetching or parsing CSV data:", error)
    throw new Error("Failed to load match data")
  }
}

export async function getTeamsAndFormations() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/matches-GJ9G0e8J352Sm03vTkuDWtFPkS4gfk.csv",
    )
    const csvText = await response.text()

    const { data } = Papa.parse<MatchData>(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    })

    const teams = [...new Set(data.map((match) => match.team).filter(Boolean))]
    const formations = [...new Set(data.map((match) => match.formation).filter(Boolean))]

    return { teams, formations }
  } catch (error) {
    console.error("Error fetching teams and formations:", error)
    return { teams: [], formations: [] }
  }
}
