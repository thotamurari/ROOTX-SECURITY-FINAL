import OpenAI from 'openai'
import { config } from '../config/index.js'
import logger from '../utils/logger.js'

const openai = new OpenAI({ apiKey: config.openaiApiKey })

// ─── Analyze Text for Social Engineering ────────────────
export async function analyzeTextForThreats(text: string): Promise<{
    summary: string
    confidence: number
    urgencyScore: number
    fearScore: number
    authorityScore: number
    overallRisk: number
    details: string[]
    recommendations: string[]
}> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are SafeOpen AI — an expert cybersecurity analyst specializing in social engineering detection. Analyze the given text/message for manipulation tactics.

Return a JSON response with:
- summary: Brief analysis summary
- urgencyScore: 0-100 (how much urgency/pressure the text creates)
- fearScore: 0-100 (how much fear/threat the text uses)
- authorityScore: 0-100 (how much it impersonates authority)
- overallRisk: 0-100 (overall social engineering risk)
- confidence: 0-100 (your confidence in the analysis)
- details: Array of specific findings
- recommendations: Array of recommended actions

Be thorough but concise. Return ONLY valid JSON.`
                },
                { role: 'user', content: text },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 1000,
        })

        const content = response.choices[0]?.message?.content
        if (!content) throw new Error('No AI response')

        const result = JSON.parse(content)
        return {
            summary: result.summary || 'Analysis complete',
            confidence: result.confidence || 70,
            urgencyScore: result.urgencyScore || 0,
            fearScore: result.fearScore || 0,
            authorityScore: result.authorityScore || 0,
            overallRisk: result.overallRisk || 0,
            details: result.details || [],
            recommendations: result.recommendations || [],
        }
    } catch (error) {
        logger.error('OpenAI text analysis failed', { error: (error as Error).message })
        return {
            summary: 'AI analysis temporarily unavailable',
            confidence: 0,
            urgencyScore: 0,
            fearScore: 0,
            authorityScore: 0,
            overallRisk: 0,
            details: ['AI service unavailable'],
            recommendations: ['Manual review recommended'],
        }
    }
}

// ─── Analyze URL for Threats ────────────────
export async function analyzeUrlWithAI(url: string, securityData: Record<string, unknown>): Promise<{
    summary: string
    confidence: number
    riskScore: number
    details: string[]
    recommendations: string[]
}> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are SafeOpen AI — an expert cybersecurity analyst. Analyze the given URL and its security scan data. Provide a comprehensive threat assessment.

Return a JSON response with:
- summary: Brief threat assessment
- confidence: 0-100
- riskScore: 0-100
- details: Array of specific findings about the URL
- recommendations: Array of recommended actions

Return ONLY valid JSON.`
                },
                { role: 'user', content: `URL: ${url}\n\nSecurity scan data:\n${JSON.stringify(securityData, null, 2)}` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 800,
        })

        const content = response.choices[0]?.message?.content
        if (!content) throw new Error('No AI response')

        const result = JSON.parse(content)
        return {
            summary: result.summary || 'Analysis complete',
            confidence: result.confidence || 70,
            riskScore: result.riskScore || 0,
            details: result.details || [],
            recommendations: result.recommendations || [],
        }
    } catch (error) {
        logger.error('OpenAI URL analysis failed', { error: (error as Error).message })
        return {
            summary: 'AI analysis unavailable',
            confidence: 0,
            riskScore: 0,
            details: [],
            recommendations: ['Manual review recommended'],
        }
    }
}

// ─── Analyze Behavior for Anomalies ────────────────
export async function analyzeBehaviorWithAI(
    baseline: Record<string, number>,
    current: Record<string, number>
): Promise<{
    anomalyScore: number
    anomalousFields: string[]
    summary: string
}> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are SafeOpen AI — analyzing user behavior patterns for anomalies. Compare baseline metrics with current metrics and identify anomalous changes.

Return JSON with:
- anomalyScore: 0-100 (overall anomaly level)
- anomalousFields: Array of field names that show unusual deviations
- summary: Brief description of findings

Return ONLY valid JSON.`
                },
                { role: 'user', content: `Baseline: ${JSON.stringify(baseline)}\nCurrent: ${JSON.stringify(current)}` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 500,
        })

        const content = response.choices[0]?.message?.content
        if (!content) throw new Error('No AI response')

        const result = JSON.parse(content)
        return {
            anomalyScore: result.anomalyScore || 0,
            anomalousFields: result.anomalousFields || [],
            summary: result.summary || 'Analysis complete',
        }
    } catch (error) {
        logger.error('OpenAI behavior analysis failed', { error: (error as Error).message })
        return { anomalyScore: 0, anomalousFields: [], summary: 'AI analysis unavailable' }
    }
}
