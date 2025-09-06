import { getPollById } from '@/app/lib/actions/poll-actions';
import { notFound, redirect } from 'next/navigation';
// Import the client component
import EditPollForm from './EditPollForm';

export default async function EditPollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { poll, error, isOwner } = await getPollById(id);

  if (error || !poll) {
    notFound();
  }
  
  // If user is not the owner, redirect to the poll view page
  if (isOwner === false) {
    redirect(`/polls/${id}`);
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Poll</h1>
      <EditPollForm poll={poll} />
    </div>
  );
}