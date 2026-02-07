import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { analyzeUserPerformance } from "@/lib/ai-automation";

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get comprehensive performance analysis
    const performanceAnalysis = await analyzeUserPerformance(user.id);

    return NextResponse.json({
      performanceAnalysis,
      insights: generatePerformanceInsights(performanceAnalysis),
      recommendations: generateRecommendations(performanceAnalysis),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching performance analysis:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function generatePerformanceInsights(analysis: any) {
  const insights = [];

  // Completion insights
  if (analysis.completionRate >= 0.9) {
    insights.push("Excellent consistency - you're completing most planned runs!");
  } else if (analysis.completionRate >= 0.7) {
    insights.push("Good consistency - room for improvement in completion rate");
  } else {
    insights.push("Low completion rate - consider reducing training volume or intensity");
  }

  // Effort insights
  if (analysis.averageRpe >= 8) {
    insights.push("High effort levels detected - ensure adequate recovery");
  } else if (analysis.averageRpe <= 4) {
    insights.push("Low effort levels - you may be ready for increased intensity");
  }

  // Trend insights
  if (analysis.distanceTrend > 2) {
    insights.push("Positive distance progression - great improvement!");
  } else if (analysis.distanceTrend < -2) {
    insights.push("Decreasing distance trend - check for fatigue or overtraining");
  }

  // Injury insights
  if (analysis.injuryRate > 0.2) {
    insights.push("High injury rate - prioritize recovery and form");
  }

  // Consistency insights
  if (analysis.consistency < 2) {
    insights.push("Very consistent training - excellent routine!");
  } else if (analysis.consistency > 5) {
    insights.push("High variability - consider more structured approach");
  }

  return insights;
}

function generateRecommendations(analysis: any) {
  const recommendations = [];

  // Completion recommendations
  if (analysis.completionRate < 0.7) {
    recommendations.push({
      type: "consistency",
      priority: "high",
      message: "Reduce training volume by 20% to improve completion rate",
      action: "consider_adaptation"
    });
  }

  // Effort recommendations
  if (analysis.averageRpe >= 8) {
    recommendations.push({
      type: "recovery",
      priority: "high", 
      message: "Add extra rest days and reduce intensity",
      action: "add_recovery"
    });
  } else if (analysis.averageRpe <= 4 && analysis.completionRate >= 0.8) {
    recommendations.push({
      type: "progression",
      priority: "medium",
      message: "Ready for progressive overload - increase distance by 10%",
      action: "increase_intensity"
    });
  }

  // Injury recommendations
  if (analysis.injuryRate > 0.1) {
    recommendations.push({
      type: "injury_prevention",
      priority: "high",
      message: "Focus on form and consider cross-training",
      action: "injury_prevention"
    });
  }

  return recommendations;
}
