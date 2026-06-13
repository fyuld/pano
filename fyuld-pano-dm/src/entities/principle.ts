export type QualityCriteria =
  | 'Readability'
  | 'Maintainability'
  | 'Testability'
  | 'Modifiability'
  | 'Reusability'
  | 'Simplicity'
  | 'Performance'
  | 'PerformanceLatency'
  | 'PerformanceThroughput'
  | 'Scalability'
  | 'Reliability'
  | 'Availability'
  | 'Resilience'
  | 'Efficiency'
  | 'Affordability'
  | 'Profitability'
  | 'Usability'
  | 'Accessibility'
  | 'Compatibility'
  | 'Interoperability'
  | 'Observability'
  | 'Supportability'
  | 'Operability'
  | 'Recoverability'
  | 'Configurability'
  | 'Deployability'
  | 'Security'
  | 'Privacy'
  | 'Compliance'
  | 'Auditability'
  | 'Safety'
  | 'AgentIntelligibility'

export type PrinciplePreferences = {
  points: number
  qualityCriteria?: QualityCriteria[]
}

export type Principle = {
  name: string
  preferences: PrinciplePreferences
  description?: string
  purpose: string
  implementation: string
  defaultAgentRecommendation?: string
  constraints: string[]
}
