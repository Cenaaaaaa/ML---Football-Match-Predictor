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
  sh: number
  sot: number
  dist: string
  fk: number
  pk: number
  pkatt: number
  season: string
  team: string
}

type PredictionInput = {
  team: string
  opponent: string
  venue: string
  formation: string
  poss: number
  sh: number
  sot: number
}

// Advanced ML Model Class
class FootballPredictor {
  private teamFreqEncoding: Record<string, number> = {}
  private opponentFreqEncoding: Record<string, number> = {}
  private formationFreqEncoding: Record<string, number> = {}
  private refereeFreqEncoding: Record<string, number> = {}
  private captainFreqEncoding: Record<string, number> = {}
  private compFreqEncoding: Record<string, number> = {}

  private venueEncoder: Record<string, number> = { Home: 1, Away: 0, Neutral: 0.5 }
  private dayEncoder: Record<string, number> = {}

  private model: RandomForestModel
  private labelEncoder: Record<string, number> = { W: 2, D: 1, L: 0 }
  private labelDecoder: Record<number, string> = { 2: "W", 1: "D", 0: "L" }

  constructor() {
    this.model = new RandomForestModel()
  }

  train(data: MatchData[]) {
    // Clean data - remove rows with missing critical values
    const cleanData = data.filter(
      (match) =>
        match.result &&
        match.team &&
        match.opponent &&
        match.venue &&
        match.formation &&
        match.poss !== undefined &&
        match.sh !== undefined &&
        match.sot !== undefined &&
        match.dist &&
        match.referee &&
        match.captain,
    )

    console.log(`Training on ${cleanData.length} matches`)

    // Create frequency encodings for high cardinality features
    this.teamFreqEncoding = this.createFrequencyEncoding(cleanData.map((m) => m.team))
    this.opponentFreqEncoding = this.createFrequencyEncoding(cleanData.map((m) => m.opponent))
    this.formationFreqEncoding = this.createFrequencyEncoding(cleanData.map((m) => m.formation))
    this.refereeFreqEncoding = this.createFrequencyEncoding(cleanData.map((m) => m.referee))
    this.captainFreqEncoding = this.createFrequencyEncoding(cleanData.map((m) => m.captain))
    this.compFreqEncoding = this.createFrequencyEncoding(cleanData.map((m) => m.comp))

    // Create day encoding
    const uniqueDays = [...new Set(cleanData.map((m) => m.day).filter(Boolean))]
    uniqueDays.forEach((day, idx) => {
      this.dayEncoder[day] = idx / uniqueDays.length
    })

    // Prepare training data
    const trainingData = cleanData.map((match) => ({
      features: this.extractFeatures(match),
      label: this.labelEncoder[match.result] || 1,
    }))

    // Train the model
    this.model.train(trainingData)
  }

  private createFrequencyEncoding(values: string[]): Record<string, number> {
    const counts: Record<string, number> = {}
    values.forEach((val) => {
      if (val) counts[val] = (counts[val] || 0) + 1
    })

    const total = values.length
    const frequencies: Record<string, number> = {}

    Object.entries(counts).forEach(([key, count]) => {
      frequencies[key] = count / total
    })

    return frequencies
  }

  private extractFeatures(match: MatchData | PredictionInput): number[] {
    const features: number[] = []

    // Venue encoding (one-hot)
    features.push(match.venue === "Home" ? 1 : 0)
    features.push(match.venue === "Away" ? 1 : 0)

    // Numerical features
    features.push(match.poss || 50)
    features.push(match.sh || 10)
    features.push(match.sot || 4)

    // Add more numerical features if available
    if ("fk" in match) features.push(match.fk || 0)
    else features.push(0)

    if ("pk" in match) features.push(match.pk || 0)
    else features.push(0)

    if ("dist" in match) features.push(Number.parseFloat(match.dist) || 17)
    else features.push(17)

    // Frequency encodings
    features.push(this.teamFreqEncoding[match.team] || 0.001)
    features.push(this.opponentFreqEncoding[match.opponent] || 0.001)
    features.push(this.formationFreqEncoding[match.formation] || 0.001)

    // Additional encodings for full matches
    if ("referee" in match) {
      features.push(this.refereeFreqEncoding[match.referee] || 0.001)
    } else {
      features.push(0.001)
    }

    if ("captain" in match) {
      features.push(this.captainFreqEncoding[match.captain] || 0.001)
    } else {
      features.push(0.001)
    }

    if ("comp" in match) {
      features.push(this.compFreqEncoding[match.comp] || 0.001)
    } else {
      features.push(0.001)
    }

    if ("day" in match) {
      features.push(this.dayEncoder[match.day] || 0.5)
    } else {
      features.push(0.5)
    }

    return features
  }

  predict(input: PredictionInput): { result: string; confidence: number } {
    const features = this.extractFeatures(input)
    const prediction = this.model.predict(features)

    return {
      result: this.labelDecoder[prediction.class] || "D",
      confidence: prediction.confidence,
    }
  }
}

// Simplified Random Forest implementation
class RandomForestModel {
  private trees: DecisionTree[] = []
  private numTrees = 10

  train(data: Array<{ features: number[]; label: number }>) {
    // Create multiple decision trees with bootstrap sampling
    for (let i = 0; i < this.numTrees; i++) {
      const bootstrapData = this.bootstrapSample(data)
      const tree = new DecisionTree()
      tree.train(bootstrapData)
      this.trees.push(tree)
    }
  }

  private bootstrapSample(
    data: Array<{ features: number[]; label: number }>,
  ): Array<{ features: number[]; label: number }> {
    const sample = []
    for (let i = 0; i < data.length; i++) {
      const randomIndex = Math.floor(Math.random() * data.length)
      sample.push(data[randomIndex])
    }
    return sample
  }

  predict(features: number[]): { class: number; confidence: number } {
    const predictions = this.trees.map((tree) => tree.predict(features))

    // Count votes
    const votes: Record<number, number> = {}
    predictions.forEach((pred) => {
      votes[pred] = (votes[pred] || 0) + 1
    })

    // Find majority vote
    const sortedVotes = Object.entries(votes)
      .map(([cls, count]) => ({ class: Number.parseInt(cls), count }))
      .sort((a, b) => b.count - a.count)

    const winningClass = sortedVotes[0].class
    const confidence = sortedVotes[0].count / this.numTrees

    return { class: winningClass, confidence }
  }
}

// Simplified Decision Tree
class DecisionTree {
  private root: TreeNode | null = null

  train(data: Array<{ features: number[]; label: number }>) {
    this.root = this.buildTree(data, 0)
  }

  private buildTree(data: Array<{ features: number[]; label: number }>, depth: number): TreeNode {
    // Stop conditions
    if (depth > 10 || data.length < 5) {
      return this.createLeafNode(data)
    }

    // Find best split
    const bestSplit = this.findBestSplit(data)
    if (!bestSplit) {
      return this.createLeafNode(data)
    }

    // Split data
    const leftData = data.filter((d) => d.features[bestSplit.featureIndex] <= bestSplit.threshold)
    const rightData = data.filter((d) => d.features[bestSplit.featureIndex] > bestSplit.threshold)

    if (leftData.length === 0 || rightData.length === 0) {
      return this.createLeafNode(data)
    }

    // Create internal node
    return {
      isLeaf: false,
      featureIndex: bestSplit.featureIndex,
      threshold: bestSplit.threshold,
      left: this.buildTree(leftData, depth + 1),
      right: this.buildTree(rightData, depth + 1),
    }
  }

  private findBestSplit(
    data: Array<{ features: number[]; label: number }>,
  ): { featureIndex: number; threshold: number } | null {
    let bestGini = Number.POSITIVE_INFINITY
    let bestSplit = null

    const numFeatures = data[0].features.length

    for (let featureIndex = 0; featureIndex < numFeatures; featureIndex++) {
      const values = data.map((d) => d.features[featureIndex]).sort((a, b) => a - b)
      const uniqueValues = [...new Set(values)]

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2
        const gini = this.calculateGini(data, featureIndex, threshold)

        if (gini < bestGini) {
          bestGini = gini
          bestSplit = { featureIndex, threshold }
        }
      }
    }

    return bestSplit
  }

  private calculateGini(
    data: Array<{ features: number[]; label: number }>,
    featureIndex: number,
    threshold: number,
  ): number {
    const leftData = data.filter((d) => d.features[featureIndex] <= threshold)
    const rightData = data.filter((d) => d.features[featureIndex] > threshold)

    const totalSize = data.length
    const leftSize = leftData.length
    const rightSize = rightData.length

    if (leftSize === 0 || rightSize === 0) return Number.POSITIVE_INFINITY

    const leftGini = this.giniImpurity(leftData.map((d) => d.label))
    const rightGini = this.giniImpurity(rightData.map((d) => d.label))

    return (leftSize / totalSize) * leftGini + (rightSize / totalSize) * rightGini
  }

  private giniImpurity(labels: number[]): number {
    const counts: Record<number, number> = {}
    labels.forEach((label) => {
      counts[label] = (counts[label] || 0) + 1
    })

    const total = labels.length
    let gini = 1

    Object.values(counts).forEach((count) => {
      const prob = count / total
      gini -= prob * prob
    })

    return gini
  }

  private createLeafNode(data: Array<{ features: number[]; label: number }>): TreeNode {
    const labelCounts: Record<number, number> = {}
    data.forEach((d) => {
      labelCounts[d.label] = (labelCounts[d.label] || 0) + 1
    })

    const majorityLabel = Object.entries(labelCounts).sort(([, a], [, b]) => b - a)[0][0]

    return {
      isLeaf: true,
      prediction: Number.parseInt(majorityLabel),
    }
  }

  predict(features: number[]): number {
    if (!this.root) return 1 // Default to draw

    let node = this.root
    while (!node.isLeaf) {
      if (features[node.featureIndex!] <= node.threshold!) {
        node = node.left!
      } else {
        node = node.right!
      }
    }

    return node.prediction!
  }
}

interface TreeNode {
  isLeaf: boolean
  featureIndex?: number
  threshold?: number
  left?: TreeNode
  right?: TreeNode
  prediction?: number
}

// Global model instance
let globalModel: FootballPredictor | null = null

export async function predictMatch(input: PredictionInput): Promise<{ result: string; confidence: number }> {
  try {
    // Initialize model if not already done
    if (!globalModel) {
      console.log("Initializing ML model...")

      const response = await fetch(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/matches-GJ9G0e8J352Sm03vTkuDWtFPkS4gfk.csv",
      )
      const csvText = await response.text()

      const { data } = Papa.parse<MatchData>(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      })

      globalModel = new FootballPredictor()
      globalModel.train(data)
      console.log("Model training completed!")
    }

    // Make prediction
    const prediction = globalModel.predict(input)
    console.log(
      `Prediction for ${input.team} vs ${input.opponent}: ${prediction.result} (${(prediction.confidence * 100).toFixed(1)}%)`,
    )

    return prediction
  } catch (error) {
    console.error("Error in prediction:", error)
    return { result: "D", confidence: 0.33 }
  }
}
