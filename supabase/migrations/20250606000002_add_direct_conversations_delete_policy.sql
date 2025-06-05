-- Add DELETE policy for direct_conversations to allow participants to delete conversations
CREATE POLICY "Users can delete conversations they're part of" 
ON "public"."direct_conversations" 
FOR DELETE 
USING (("auth"."uid"() = ANY ("participants")));