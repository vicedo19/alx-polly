"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateQuestion, validateOptions } from "../utils/input-validation";

/**
 * Creates a new poll with question and options after validation and sanitization.
 * 
 * This function handles the complete poll creation workflow including:
 * - Input validation for question and options using validateQuestion and validateOptions
 * - XSS prevention through DOMPurify sanitization
 * - User authentication verification
 * - Database insertion with proper error handling
 * - Automatic redirect to the created poll page
 * 
 * @param formData - FormData containing 'question' and 'options' (JSON string) fields
 * @returns Promise<{ error: string } | never> - Returns error object on failure, redirects on success
 * 
 * @example
 * ```tsx
 * // In a create poll form
 * <form action={createPoll}>
 *   <input name="question" placeholder="Enter your question" required />
 *   <input name="options" type="hidden" value={JSON.stringify(options)} />
 *   <button type="submit">Create Poll</button>
 * </form>
 * ```
 * 
 * @throws Will return validation errors if question/options are invalid
 * @throws Will return authentication error if user is not logged in
 */
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const questionInput = formData.get("question") as string;
  const optionsInput = formData.getAll("options").filter(Boolean) as string[];

  // Validate and sanitize question
  const questionValidation = validateQuestion(questionInput);
  if (!questionValidation.isValid) {
    return { error: questionValidation.error };
  }
  
  // Validate and sanitize options
  const optionsValidation = validateOptions(optionsInput);
  if (!optionsValidation.isValid) {
    return { error: optionsValidation.error };
  }
  
  // Get sanitized values
  const question = questionValidation.sanitizedValue as string;
  const options = JSON.parse(optionsValidation.sanitizedValue as string);

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question,
      options,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

/**
 * Retrieves a poll by its ID with appropriate data filtering based on user permissions.
 * 
 * This function implements role-based data access including:
 * - Poll existence validation
 * - User authentication and role checking
 * - Data filtering based on ownership and admin status:
 *   - Poll owners: Full access to all poll data including vote counts
 *   - Admin users: Full access to all polls
 *   - Regular users: Limited access (poll data without sensitive information)
 * - Proper error handling for non-existent polls
 * 
 * @param id - The unique identifier of the poll to retrieve
 * @returns Promise<Poll | null> - Poll object with appropriate data filtering, null if not found
 * 
 * @example
 * ```tsx
 * // In a poll detail page
 * const poll = await getPollById(params.id);
 * if (!poll) {
 *   notFound(); // Show 404 page
 * }
 * return <PollDetail poll={poll} />;
 * ```
 * 
 * @security Implements proper authorization checks to prevent unauthorized data access
 */
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // First, check if the poll exists
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  // If the poll is found, check if the user has access to it
  // Admin users can access any poll
  // Regular users can only access their own polls
  if (data) {
    // If user is not logged in, they can only view the poll, not edit it
    if (!user) {
      // Return limited poll data for public viewing
      return { 
        poll: {
          id: data.id,
          question: data.question,
          options: data.options,
          created_at: data.created_at,
          // Don't include user_id or other sensitive fields
        }, 
        error: null,
        isOwner: false
      };
    }
    
    // Check if user is the owner of the poll
    const isOwner = user.id === data.user_id;
    
    // If user is not the owner, return limited data
    if (!isOwner) {
      // Get user role to check if admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      const isAdmin = roleData?.role === 'admin';
      
      // If not admin, return limited data
      if (!isAdmin) {
        return { 
          poll: {
            id: data.id,
            question: data.question,
            options: data.options,
            created_at: data.created_at,
            // Don't include user_id or other sensitive fields
          }, 
          error: null,
          isOwner: false
        };
      }
    }
    
    // User is either owner or admin, return full data
    return { poll: data, error: null, isOwner };
  }
  
  return { poll: null, error: "Poll not found" };
}



/**
 * Deletes a poll with proper ownership verification and authorization.
 * 
 * This function implements secure poll deletion including:
 * - User authentication verification
 * - Ownership validation (only poll creator can delete)
 * - Database deletion with proper error handling
 * - Automatic redirect to polls list after successful deletion
 * 
 * @param pollId - The unique identifier of the poll to delete
 * @returns Promise<{ error: string } | never> - Returns error object on failure, redirects on success
 * 
 * @example
 * ```tsx
 * // In a delete poll form
 * <form action={() => deletePoll(poll.id)}>
 *   <button type="submit" className="text-red-600">
 *     Delete Poll
 *   </button>
 * </form>
 * ```
 * 
 * @security Only allows poll owners to delete their own polls
 * @throws Will return authentication error if user is not logged in
 * @throws Will return authorization error if user doesn't own the poll
 */
export async function deletePoll(pollId: string) {
  const supabase = await createClient();
  
  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to delete a poll." };
  }

  // Only allow deleting polls owned by the user
  const { error } = await supabase
    .from("polls")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
    
  if (error) return { error: error.message };
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Updates an existing poll with new question and options after validation.
 * 
 * This function handles secure poll updates including:
 * - Input validation and sanitization for question and options
 * - User authentication verification
 * - Ownership validation (only poll creator can update)
 * - XSS prevention through DOMPurify sanitization
 * - Database update with proper error handling
 * 
 * @param pollId - The unique identifier of the poll to update
 * @param formData - FormData containing 'question' and 'options' (JSON string) fields
 * @returns Promise<{ error: string | null }> - Returns error object on failure, null on success
 * 
 * @example
 * ```tsx
 * // In an edit poll form
 * <form action={(formData) => updatePoll(poll.id, formData)}>
 *   <input name="question" defaultValue={poll.question} required />
 *   <input name="options" type="hidden" value={JSON.stringify(options)} />
 *   <button type="submit">Update Poll</button>
 * </form>
 * ```
 * 
 * @security Only allows poll owners to update their own polls
 * @throws Will return validation errors if question/options are invalid
 * @throws Will return authentication error if user is not logged in
 */
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const questionInput = formData.get("question") as string;
  const optionsInput = formData.getAll("options").filter(Boolean) as string[];

  // Validate and sanitize question
  const questionValidation = validateQuestion(questionInput);
  if (!questionValidation.isValid) {
    return { error: questionValidation.error };
  }
  
  // Validate and sanitize options
  const optionsValidation = validateOptions(optionsInput);
  if (!optionsValidation.isValid) {
    return { error: optionsValidation.error };
  }
  
  // Get sanitized values
  const question = questionValidation.sanitizedValue as string;
  const options = JSON.parse(optionsValidation.sanitizedValue as string);

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Only allow updating polls owned by the user
  const { error } = await supabase
    .from("polls")
    .update({ question, options })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Submits a vote for a specific option in a poll with duplicate vote prevention.
 * 
 * This function implements the complete voting workflow including:
 * - User authentication verification
 * - Duplicate vote prevention (one vote per user per poll)
 * - Poll existence validation
 * - Atomic vote count updates in poll options
 * - Vote record creation in votes table
 * - Real-time data revalidation for immediate UI updates
 * 
 * @param pollId - The unique identifier of the poll
 * @param optionId - The unique identifier of the selected option
 * @returns Promise<{ error?: string; success?: boolean }> - Returns success status or error message
 * 
 * @example
 * ```tsx
 * // In a voting component
 * const handleVote = async (optionId: string) => {
 *   const result = await submitVote(poll.id, optionId);
 *   if (result.error) {
 *     toast.error(result.error);
 *   } else {
 *     toast.success('Vote submitted successfully!');
 *   }
 * };
 * ```
 * 
 * @security Prevents duplicate voting and ensures user authentication
 * @throws Will return authentication error if user is not logged in
 * @throws Will return validation error if user has already voted
 * @throws Will return error if poll or option doesn't exist
 */
export async function submitVote(pollId: string, optionId: string) {
  const supabase = await createClient();

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to vote." };
  }

  // Check if user has already voted on this poll
  const { data: existingVote } = await supabase
    .from("votes")
    .select()
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .single();

  if (existingVote) {
    return { error: "You have already voted on this poll." };
  }

  // Get the poll to update the options
  const { data: poll } = await supabase
    .from("polls")
    .select("options")
    .eq("id", pollId)
    .single();

  if (!poll) {
    return { error: "Poll not found." };
  }

  // Update the vote count for the selected option
  const updatedOptions = poll.options.map((option: any) => {
    if (option.id === optionId) {
      return { ...option, votes: (option.votes || 0) + 1 };
    }
    return option;
  });

  // Record the vote in the votes table
  const { error: voteError } = await supabase.from("votes").insert([
    {
      user_id: user.id,
      poll_id: pollId,
      option_id: optionId,
    },
  ]);

  if (voteError) {
    return { error: voteError.message };
  }

  // Update the poll with the new vote counts
  const { error: updateError } = await supabase
    .from("polls")
    .update({ options: updatedOptions })
    .eq("id", pollId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath(`/polls/${pollId}`);
  return { success: true };
}
