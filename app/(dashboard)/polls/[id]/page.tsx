import { getPollById } from '@/app/lib/actions/poll-actions';
import { notFound } from 'next/navigation';
import PollDetail from './PollDetail';

export const dynamic = 'force-dynamic';

export default async function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Fetch the poll data from the server
  const { id } = await params;
  const { poll, error } = await getPollById(id);

  if (error || !poll) {
    notFound();
  }

  return <PollDetail poll={poll} pollId={id} />;
}