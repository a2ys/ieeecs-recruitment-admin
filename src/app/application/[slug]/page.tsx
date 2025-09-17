"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

interface ApplicationProps {
  id: string;
  user_id: string;
  department: string;
  submitted: boolean;
  created_at: string;
  updated_at: string;
  status: string;
  username?: string;
}

interface AnswerProps {
  id: string;
  question_id: string;
  body: string;
}

interface QuestionProps {
  id: string;
  body: string;
}

interface QaPair {
  id: string;
  question: string;
  answer: string;
}

interface EvaluationState {
  rating: number | null;
  looks_ai: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Pending Review",
  under_review: "Under Review",
  waitlisted: "Waitlisted",
  accepted: "Accepted",
  rejected: "Rejected",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  technical: "Technical",
  social_media: "Social Media",
  design: "Design",
  management: "Management",
};

const fetchApplicationData = async (slug: string) => {
  const supabase = createClient();
  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", slug)
    .single();
  if (appError) throw new Error("Failed to fetch application.");
  const [userResponse, answersResponse] = await Promise.all([
    supabase
      .from("users")
      .select("full_name")
      .eq("id", application.user_id)
      .single(),
    supabase
      .from("answers")
      .select("id, question_id, body")
      .eq("application_id", application.id),
  ]);
  if (userResponse.error) throw new Error("Failed to fetch user.");
  if (answersResponse.error) throw new Error("Failed to fetch answers.");
  const username = userResponse.data.full_name;
  const answers = answersResponse.data as AnswerProps[];
  let qaPairs: QaPair[] = [];
  if (answers.length > 0) {
    const questionIds = answers.map((a) => a.question_id);
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("id, body")
      .in("id", questionIds);
    if (questionsError) throw new Error("Failed to fetch questions.");
    const questionsMap = new Map(
      (questions as QuestionProps[]).map((q) => [q.id, q.body])
    );
    qaPairs = answers.map((answer) => ({
      id: answer.id,
      question: questionsMap.get(answer.question_id) || "Unknown Question",
      answer: answer.body,
    }));
  }
  return { application: { ...application, username }, qaPairs };
};

const ApplicationDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [application, setApplication] = useState<ApplicationProps | null>(null);
  const [qaPairs, setQaPairs] = useState<QaPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [evaluations, setEvaluations] = useState<
    Record<string, EvaluationState>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      setError("Application ID is missing.");
      return;
    }
    const getData = async () => {
      try {
        setIsLoading(true);
        const { application, qaPairs } = await fetchApplicationData(slug);
        setApplication(application);
        setQaPairs(qaPairs);

        const initialEvals: Record<string, EvaluationState> = {};
        for (const qa of qaPairs) {
          initialEvals[qa.id] = { rating: null, looks_ai: false };
        }
        setEvaluations(initialEvals);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, [slug]);

  const handleRatingChange = (answerId: string, rating: number) => {
    setEvaluations((prev) => ({
      ...prev,
      [answerId]: { ...prev[answerId], rating },
    }));
  };

  const handleAiFlagChange = (answerId: string) => {
    setEvaluations((prev) => ({
      ...prev,
      [answerId]: { ...prev[answerId], looks_ai: !prev[answerId].looks_ai },
    }));
  };

  const handleSubmitEvaluation = async () => {
    setIsSubmitting(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to evaluate.");
      setIsSubmitting(false);
      return;
    }
    const evaluator_id = user.id;

    const T = qaPairs.length;
    const M = T * 10;
    let C = 0;
    let A = 0;
    Object.values(evaluations).forEach((ev) => {
      C += ev.rating || 0;
      if (ev.looks_ai) A += 1;
    });

    const allRated = Object.values(evaluations).every(
      (ev) => ev.rating !== null
    );
    if (!allRated) {
      alert("Please rate all questions before submitting.");
      setIsSubmitting(false);
      return;
    }

    const w1 = 0.8;
    const w2 = 0.2;
    const S = w1 * (C / M) - w2 * (A / T);
    const finalScoreValue = Math.max(0, S) * 100;

    try {
      const { data: evaluationData, error: evalError } = await supabase
        .from("evaluations")
        .insert({
          application_id: application!.id,
          evaluator_id: evaluator_id,
          final_score: finalScoreValue,
        })
        .select("id")
        .single();

      if (evalError) throw evalError;

      const answerEvaluationsToInsert = Object.entries(evaluations).map(
        ([answerId, evalState]) => ({
          evaluation_id: evaluationData.id,
          answer_id: answerId,
          rating: evalState.rating,
          looks_ai: evalState.looks_ai,
        })
      );

      const { error: answerEvalsError } = await supabase
        .from("answer_evaluations")
        .insert(answerEvaluationsToInsert);

      if (answerEvalsError) throw answerEvalsError;

      setFinalScore(finalScoreValue);
      alert(
        `Evaluation submitted successfully! Final Score: ${finalScoreValue.toFixed(
          2
        )}`
      );
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      alert("Failed to submit evaluation. Check the console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const DetailItem = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-base font-medium">{value}</p>
    </div>
  );

  if (isLoading)
    return (
      <p className="text-center mt-10 text-gray-400">
        Loading application details...
      </p>
    );
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!application)
    return (
      <p className="text-center mt-10 text-gray-500">Application not found.</p>
    );

  return (
    <main className="min-h-screen p-8 bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 text-sm hover:underline text-gray-400"
        >
          &larr; Back to Applications
        </button>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-8">
          <h1 className="text-3xl font-bold mb-4">Application Details</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailItem label="Applicant Name" value={application.username} />
            <DetailItem
              label="Department"
              value={
                DEPARTMENT_LABELS[application.department] ||
                application.department
              }
            />
            <DetailItem
              label="Submission Status"
              value={application.submitted ? "Yes" : "No"}
            />
            <DetailItem
              label="Application Status"
              value={STATUS_LABELS[application.status] || application.status}
            />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Evaluation</h2>
          <div className="space-y-6">
            {qaPairs.map((qa) => {
              const currentEval = evaluations[qa.id];
              return (
                <div
                  key={qa.id}
                  className="bg-gray-900 rounded-lg border border-gray-800 p-4"
                >
                  <p className="font-semibold text-gray-300">{qa.question}</p>
                  <p className="mt-2 text-gray-100 whitespace-pre-wrap">
                    {qa.answer}
                  </p>

                  <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-400 mr-2">
                        Rating:
                      </span>
                      {[...Array(10)].map((_, i) => {
                        const ratingValue = i + 1;
                        return (
                          <button
                            key={ratingValue}
                            onClick={() =>
                              handleRatingChange(qa.id, ratingValue)
                            }
                            className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                              currentEval?.rating === ratingValue
                                ? "bg-indigo-500 text-white"
                                : "bg-gray-700 hover:bg-gray-600"
                            }`}
                          >
                            {ratingValue}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-400">
                        Looks AI?
                      </span>
                      <button
                        onClick={() => handleAiFlagChange(qa.id)}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                          currentEval?.looks_ai
                            ? "bg-red-600 text-white"
                            : "bg-gray-700 hover:bg-gray-600"
                        }`}
                      >
                        {currentEval?.looks_ai ? "Yes" : "No"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {qaPairs.length > 0 && (
            <div className="mt-8 p-4 bg-gray-900 rounded-lg border border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">Final Score</h3>
                <p className="text-3xl font-bold text-indigo-400">
                  {finalScore !== null
                    ? `${finalScore.toFixed(2)} / 100`
                    : "Pending..."}
                </p>
              </div>
              <button
                onClick={handleSubmitEvaluation}
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Final Evaluation"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ApplicationDetailPage;
