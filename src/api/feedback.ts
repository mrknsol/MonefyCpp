import { apiRequest } from './client';

export type FeedbackIssueType = 'card' | 'transfer' | 'login' | 'crash' | 'balance' | 'other';

type SubmitFeedbackResponse = { ok: boolean; id: number };

export async function apiSubmitFeedback(
    issueType: FeedbackIssueType,
    message: string,
): Promise<SubmitFeedbackResponse> {
  return apiRequest<SubmitFeedbackResponse>('/api/feedback', {
    method: 'POST',
    body: { issueType, message },
  });
}