"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateQuestion, validateOptions } from "../utils/input-validation";

// CREATE POLL
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

// GET POLL BY ID
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

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Require login to vote
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: 'You must be logged in to vote.' };
  }

  // Check if user has already voted on this poll
  const { data: existingVote, error: voteCheckError } = await supabase
    .from("votes")
    .select()
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .single();

  if (voteCheckError && voteCheckError.code !== 'PGRST116') { // PGRST116 means no rows returned
    return { error: voteCheckError.message };
  }

  if (existingVote) {
    return { error: 'You have already voted on this poll.' };
  }

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user.id, // No longer optional
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
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

// UPDATE POLL
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

// SUBMIT VOTE
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
