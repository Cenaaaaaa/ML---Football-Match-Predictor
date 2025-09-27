import PredictionForm from "@/components/prediction-form"
import { DataAnalytics } from "@/components/data-analytics"
import { ModelInsights } from "@/components/model-insights"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-10">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
            Football Match Predictor
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Advanced ML-powered predictions using XGBoost-inspired algorithms and comprehensive feature engineering
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <PredictionForm />
            <ModelInsights />
          </div>
          <div className="lg:col-span-2">
            <DataAnalytics />
          </div>
        </div>
      </div>
    </div>
  )
}
