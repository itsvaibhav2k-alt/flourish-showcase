-- Fix RLS performance issues
-- 1. Wrap auth.<function>() calls in (select ...) to avoid per-row evaluation
-- 2. Consolidate multiple permissive policies for same role/action

-- ============================================
-- email_events - Fix auth.uid() performance
-- ============================================
DROP POLICY IF EXISTS "Users can view email events for their organization" ON public.email_events;

CREATE POLICY "Users can view email events for their organization"
ON public.email_events FOR SELECT
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
);

-- ============================================
-- email_sequences - Fix auth.uid() performance
-- ============================================
DROP POLICY IF EXISTS "Users can view sequences for their organization" ON public.email_sequences;
DROP POLICY IF EXISTS "Users can create sequences for their organization" ON public.email_sequences;
DROP POLICY IF EXISTS "Users can update sequences for their organization" ON public.email_sequences;
DROP POLICY IF EXISTS "Users can delete sequences for their organization" ON public.email_sequences;

CREATE POLICY "Users can view sequences for their organization"
ON public.email_sequences FOR SELECT
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can create sequences for their organization"
ON public.email_sequences FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update sequences for their organization"
ON public.email_sequences FOR UPDATE
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete sequences for their organization"
ON public.email_sequences FOR DELETE
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
);

-- ============================================
-- email_sequence_steps - Fix auth.uid() and consolidate duplicate SELECT policies
-- ============================================
DROP POLICY IF EXISTS "Users can view steps for their sequences" ON public.email_sequence_steps;
DROP POLICY IF EXISTS "Users can manage steps for their sequences" ON public.email_sequence_steps;

-- Single consolidated policy for SELECT
CREATE POLICY "Users can view steps for their sequences"
ON public.email_sequence_steps FOR SELECT
USING (
  sequence_id IN (
    SELECT es.id FROM email_sequences es
    WHERE es.organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
    )
  )
);

-- Separate policies for INSERT, UPDATE, DELETE
CREATE POLICY "Users can insert steps for their sequences"
ON public.email_sequence_steps FOR INSERT
WITH CHECK (
  sequence_id IN (
    SELECT es.id FROM email_sequences es
    WHERE es.organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "Users can update steps for their sequences"
ON public.email_sequence_steps FOR UPDATE
USING (
  sequence_id IN (
    SELECT es.id FROM email_sequences es
    WHERE es.organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "Users can delete steps for their sequences"
ON public.email_sequence_steps FOR DELETE
USING (
  sequence_id IN (
    SELECT es.id FROM email_sequences es
    WHERE es.organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
    )
  )
);

-- ============================================
-- sequence_enrollments - Fix auth.uid() and consolidate duplicate SELECT policies
-- ============================================
DROP POLICY IF EXISTS "Users can view enrollments for their organization" ON public.sequence_enrollments;
DROP POLICY IF EXISTS "Users can manage enrollments for their organization" ON public.sequence_enrollments;

-- Single consolidated policy for SELECT
CREATE POLICY "Users can view enrollments for their organization"
ON public.sequence_enrollments FOR SELECT
USING (
  sequence_id IN (
    SELECT es.id FROM email_sequences es
    WHERE es.organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
    )
  )
);

-- Separate policies for INSERT, UPDATE, DELETE
CREATE POLICY "Users can insert enrollments for their organization"
ON public.sequence_enrollments FOR INSERT
WITH CHECK (
  sequence_id IN (
    SELECT es.id FROM email_sequences es
    WHERE es.organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "Users can update enrollments for their organization"
ON public.sequence_enrollments FOR UPDATE
USING (
  sequence_id IN (
    SELECT es.id FROM email_sequences es
    WHERE es.organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "Users can delete enrollments for their organization"
ON public.sequence_enrollments FOR DELETE
USING (
  sequence_id IN (
    SELECT es.id FROM email_sequences es
    WHERE es.organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
    )
  )
);

-- ============================================
-- sequence_step_executions - Fix auth.uid() and consolidate duplicate SELECT policies
-- ============================================
DROP POLICY IF EXISTS "Users can view executions for their enrollments" ON public.sequence_step_executions;
DROP POLICY IF EXISTS "Service role full access to step executions" ON public.sequence_step_executions;

-- Single consolidated policy for SELECT that handles both user and service role access
CREATE POLICY "Users can view executions for their enrollments"
ON public.sequence_step_executions FOR SELECT
USING (
  enrollment_id IN (
    SELECT se.id FROM sequence_enrollments se
    JOIN email_sequences es ON es.id = se.sequence_id
    WHERE es.organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
    )
  )
);

-- Service role policy for background jobs (INSERT/UPDATE only, no duplicate SELECT)
CREATE POLICY "Service role can manage step executions"
ON public.sequence_step_executions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- smart_ask_config - Fix auth.uid() performance
-- (Only apply if table exists - may have been removed)
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smart_ask_config') THEN
    DROP POLICY IF EXISTS "Users can view smart ask config for their organization" ON public.smart_ask_config;
    DROP POLICY IF EXISTS "Users can insert smart ask config for their organization" ON public.smart_ask_config;
    DROP POLICY IF EXISTS "Users can update smart ask config for their organization" ON public.smart_ask_config;
    DROP POLICY IF EXISTS "Users can delete smart ask config for their organization" ON public.smart_ask_config;

    CREATE POLICY "Users can view smart ask config for their organization"
    ON public.smart_ask_config FOR SELECT
    USING (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));

    CREATE POLICY "Users can insert smart ask config for their organization"
    ON public.smart_ask_config FOR INSERT
    WITH CHECK (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));

    CREATE POLICY "Users can update smart ask config for their organization"
    ON public.smart_ask_config FOR UPDATE
    USING (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));

    CREATE POLICY "Users can delete smart ask config for their organization"
    ON public.smart_ask_config FOR DELETE
    USING (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));
  END IF;
END $$;

-- ============================================
-- smart_ask_results - Fix auth.uid() performance
-- (Only apply if table exists - may have been removed)
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smart_ask_results') THEN
    DROP POLICY IF EXISTS "Users can view smart ask results for their organization" ON public.smart_ask_results;
    DROP POLICY IF EXISTS "Users can insert smart ask results for their organization" ON public.smart_ask_results;
    DROP POLICY IF EXISTS "Users can update smart ask results for their organization" ON public.smart_ask_results;
    DROP POLICY IF EXISTS "Users can delete smart ask results for their organization" ON public.smart_ask_results;

    CREATE POLICY "Users can view smart ask results for their organization"
    ON public.smart_ask_results FOR SELECT
    USING (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));

    CREATE POLICY "Users can insert smart ask results for their organization"
    ON public.smart_ask_results FOR INSERT
    WITH CHECK (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));

    CREATE POLICY "Users can update smart ask results for their organization"
    ON public.smart_ask_results FOR UPDATE
    USING (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));

    CREATE POLICY "Users can delete smart ask results for their organization"
    ON public.smart_ask_results FOR DELETE
    USING (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));
  END IF;
END $$;

-- ============================================
-- grant_proposals - Fix auth.uid() performance
-- ============================================
DROP POLICY IF EXISTS "Users can view proposals for their organization" ON public.grant_proposals;
DROP POLICY IF EXISTS "Users can insert proposals for their organization" ON public.grant_proposals;
DROP POLICY IF EXISTS "Users can update proposals for their organization" ON public.grant_proposals;
DROP POLICY IF EXISTS "Users can delete proposals for their organization" ON public.grant_proposals;

CREATE POLICY "Users can view proposals for their organization"
ON public.grant_proposals FOR SELECT
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert proposals for their organization"
ON public.grant_proposals FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update proposals for their organization"
ON public.grant_proposals FOR UPDATE
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete proposals for their organization"
ON public.grant_proposals FOR DELETE
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = (SELECT auth.uid())
  )
);
